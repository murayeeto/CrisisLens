from flask import Flask, jsonify, request
import hashlib
from datetime import datetime
from config import config
from utils.logger import logger
from services.firebase_service import firebase_service
from services.news_service import news_service
from services.event_service import event_service
from services.relief_fund_service import relief_fund_service, ReliefFundError
from services.stripe_service import stripe_service

app = Flask(
    __name__,
    instance_relative_config=True
)

DEFAULT_USER_PREFERENCES = {
    "countries": [],
    "categories": [],
}

# Initialize Firebase Admin SDK
try:
    firebase_service.initialize()
    logger.info("Firebase Admin SDK initialized successfully")
except Exception as e:
    logger.warning(f"Firebase initialization: {e}")
    if not config.USE_MOCK_AUTH:
        logger.warning("Continuing without Firebase - using auth bypass mode")

# CORS Configuration - Clean single approach
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization,Stripe-Signature'
    response.headers['Access-Control-Allow-Methods'] = 'GET,PUT,PATCH,POST,DELETE,OPTIONS'
    return response

@app.route('/api/events', methods=['OPTIONS'])
@app.route('/api/events/<path:path>', methods=['OPTIONS'])
@app.route('/api/news', methods=['OPTIONS'])
@app.route('/api/auth/login', methods=['OPTIONS'])
@app.route('/api/auth/me', methods=['OPTIONS'])
@app.route('/api/users/me', methods=['OPTIONS'])
@app.route('/api/users/me/saved-events', methods=['OPTIONS'])
@app.route('/api/users/me/saved-events/<path:path>', methods=['OPTIONS'])
@app.route('/api/campaigns', methods=['OPTIONS'])
@app.route('/api/campaigns/<path:path>', methods=['OPTIONS'])
@app.route('/api/campaigns/<path:path>/review', methods=['OPTIONS'])
@app.route('/api/donations/session/<path:path>', methods=['OPTIONS'])
@app.route('/api/stripe/webhook', methods=['OPTIONS'])
def handle_options():
    return '', 204

def _serialize_datetime(value):
    if value is None:
        return None

    if hasattr(value, "isoformat"):
        return value.isoformat()

    return value

def _normalize_severity(value):
    if value == "moderate":
        return "medium"
    return value or "info"

def _derive_event_category(event):
    text = " ".join(
        part.lower()
        for part in [
            getattr(event, "title", ""),
            getattr(event, "description", ""),
            getattr(getattr(event, "ai_analysis", None), "category", ""),
            getattr(getattr(event, "ai_analysis", None), "summary", ""),
        ]
        if part
    )

    keyword_groups = [
        ("wildfire", ["wildfire", "brush fire", "forest fire"]),
        ("storm", ["storm", "flood", "typhoon", "hurricane", "cyclone", "rainfall", "weather"]),
        ("earthquake", ["earthquake", "seismic", "aftershock", "tremor"]),
        ("protest", ["protest", "demonstration", "march", "rally", "civil unrest", "strike"]),
        ("transit", ["transit", "rail", "train", "airport", "airline", "highway", "bridge", "road closure"]),
        ("port", ["port", "shipping", "harbor", "berth", "tanker", "vessel", "cargo"]),
        ("market", ["market", "stocks", "commodities", "trading", "financial"]),
    ]

    for category, keywords in keyword_groups:
        if any(keyword in text for keyword in keywords):
            return category

    return "other"

def _serialize_event(event):
    if not event:
        return None

    severity = _normalize_severity(event.ai_analysis.severity if event.ai_analysis else "info")
    category = _derive_event_category(event)
    sources = [
        {
            "name": article.source_name,
            "url": article.url,
            "publishedAt": article.published_at,
        }
        for article in (event.source_articles or [])
    ]

    return {
        "id": event.id,
        "title": event.title,
        "description": event.description,
        "severity": severity,
        "category": category,
        "region": event.location.region if event.location and event.location.region else "Unknown",
        "location": event.location.name if event.location else "Unknown",
        "country": event.location.country if event.location else "",
        "lat": float(event.location.latitude) if event.location and hasattr(event.location, 'latitude') else 0,
        "lng": float(event.location.longitude) if event.location and hasattr(event.location, 'longitude') else 0,
        "startedAt": _serialize_datetime(event.created_at),
        "updatedAt": _serialize_datetime(event.updated_at),
        "previewImage": event.image_url or "",
        "previewText": event.description,
        "aiSummary": event.ai_analysis.summary if event.ai_analysis else event.description,
        "affectedGroups": event.ai_analysis.affected_groups if event.ai_analysis else [],
        "impactAnalysis": event.ai_analysis.impact_analysis if event.ai_analysis else "",
        "howToHelp": event.ai_analysis.how_to_help if event.ai_analysis else "",
        "watchGuidance": event.ai_analysis.watch_guidance if event.ai_analysis else "",
        "sources": sources,
        "sourcesCount": len(sources),
        "tags": [category.replace('-', ' '), severity],
    }

def _is_serialized_event_snapshot(payload):
    return isinstance(payload, dict) and bool(payload.get("id")) and bool(payload.get("title"))

def _normalize_event_snapshot(payload):
    if not _is_serialized_event_snapshot(payload):
        return None

    snapshot = dict(payload)
    snapshot["startedAt"] = _serialize_datetime(snapshot.get("startedAt"))
    snapshot["updatedAt"] = _serialize_datetime(snapshot.get("updatedAt"))

    if "lat" in snapshot and snapshot.get("lat") is not None:
        snapshot["lat"] = float(snapshot["lat"])
    if "lng" in snapshot and snapshot.get("lng") is not None:
        snapshot["lng"] = float(snapshot["lng"])

    return snapshot

def _persist_event_snapshot(payload):
    snapshot = _normalize_event_snapshot(payload)
    if not snapshot:
        return

    try:
        firebase_service.set_document("events", snapshot["id"], snapshot, merge=True)
    except Exception as exc:
        logger.warning(f"Unable to persist event snapshot {snapshot.get('id')}: {exc}")

def _load_persisted_event_snapshot(event_id):
    direct_match = firebase_service.get_document("events", event_id)
    normalized_direct_match = _normalize_event_snapshot(direct_match)
    if normalized_direct_match:
        return normalized_direct_match

    matches = firebase_service.list_documents("events", filters=[("id", "==", event_id)])
    for match in matches:
        normalized_match = _normalize_event_snapshot(match)
        if normalized_match:
            return normalized_match

    return None

def _resolve_event(event_id):
    event = event_service.get_event(event_id)
    if event:
        snapshot = _serialize_event(event)
        _persist_event_snapshot(snapshot)
        return snapshot

    persisted_snapshot = _load_persisted_event_snapshot(event_id)
    if persisted_snapshot:
        logger.info(f"Resolved event {event_id} from persisted snapshot")
        return persisted_snapshot

    articles = news_service.fetch_trending_news()
    for article in articles:
        try:
            event = event_service.create_event_from_articles([article])
            if event.id == event_id:
                snapshot = _serialize_event(event)
                _persist_event_snapshot(snapshot)
                return snapshot
        except Exception as exc:
            logger.warning(f"Could not create event while resolving {event_id}: {exc}")

    return None

def _verify_request_user():
    auth_header = request.headers.get('Authorization', '')
    if not auth_header:
        return None, (jsonify({"error": "Missing authorization header"}), 401)

    token = auth_header.replace('Bearer ', '')
    decoded_token = firebase_service.verify_id_token(token)
    if not decoded_token:
        return None, (jsonify({"error": "Invalid token"}), 401)

    return decoded_token, None


def _resolve_user_role(decoded_token, user_data=None):
    user_data = user_data or firebase_service.get_user_doc(decoded_token['uid']) or {}
    explicit_role = (user_data.get("role") or "").strip().lower()
    email = (user_data.get("email") or decoded_token.get("email") or "").strip().lower()

    if explicit_role in {"reviewer", "admin"}:
        return "reviewer"
    if email and email in config.RELIEF_REVIEWER_EMAILS:
        return "reviewer"
    return explicit_role or "member"


def _require_reviewer(decoded_token):
    user_data = firebase_service.get_user_doc(decoded_token['uid']) or {}
    role = _resolve_user_role(decoded_token, user_data)
    if role != "reviewer":
        return None, (jsonify({"error": "Reviewer access required"}), 403)
    return user_data, None

def _build_user_payload(decoded_token):
    user_data = firebase_service.get_user_doc(decoded_token['uid']) or {}
    preferences = user_data.get("preferences") or {}

    return {
        "id": decoded_token['uid'],
        "uid": decoded_token['uid'],
        "email": user_data.get("email") or decoded_token.get('email', ''),
        "displayName": user_data.get("displayName") or decoded_token.get('name', ''),
        "createdAt": _serialize_datetime(user_data.get("createdAt")) or datetime.now().isoformat(),
        "updatedAt": _serialize_datetime(user_data.get("updatedAt")),
        "savedEvents": user_data.get("savedEvents", []),
        "role": _resolve_user_role(decoded_token, user_data),
        "preferences": {
            "countries": preferences.get("countries", []),
            "categories": preferences.get("categories", []),
        },
        "onboardingCompleted": bool(user_data.get("onboardingCompleted", False)),
    }


@app.errorhandler(ReliefFundError)
def handle_relief_fund_error(error):
    return jsonify({"error": error.message}), error.status_code

# Basic health check endpoint
@app.route('/health', methods=['GET'])
def health():
    logger.info("Health check endpoint called")
    return jsonify({"status": "ok", "service": "CrisisLens API"}), 200

# API Routes with /api prefix
@app.route('/api/events', methods=['GET'])
def get_events():
    """Fetch events from Firestore first, then generate new ones if needed."""
    logger.info("Get events endpoint called")
    try:
        # STRATEGY 1: Try to load events from Firestore (persistent storage)
        logger.info("Attempting to load events from Firestore...")
        try:
            db = firebase_service._db
            if not db:
                logger.warning("Firebase not initialized, skipping Firestore load")
                raise Exception("Firebase not available")
            firestore_events = []
            
            # Query all events from Firestore
            docs = db.collection('events').stream()
            for doc in docs:
                event_data = doc.to_dict()
                firestore_events.append({
                    "id": event_data.get('id'),
                    "title": event_data.get('title'),
                    "description": event_data.get('description'),
                    "severity": event_data.get('severity', 'info'),
                    "category": event_data.get('category', 'other'),
                    "region": event_data.get('region', 'Unknown'),
                    "location": event_data.get('location', 'Unknown'),
                    "lat": float(event_data.get('lat', 0)),
                    "lng": float(event_data.get('lng', 0)),
                    "timestamp": event_data.get('createdAt', ''),
                    "startedAt": event_data.get('createdAt', ''),
                    "updatedAt": event_data.get('updatedAt', ''),
                    "previewImage": event_data.get('previewImage', ''),
                    "aiSummary": event_data.get('aiSummary', event_data.get('description', '')),
                    "affectedGroups": event_data.get('affectedGroups', []),
                    "impactAnalysis": event_data.get('impactAnalysis', ''),
                    "howToHelp": event_data.get('howToHelp', ''),
                    "watchGuidance": event_data.get('watchGuidance', ''),
                    "sources": event_data.get('sources', []),
                    "sourcesCount": len(event_data.get('sources', [])),
                })
            
            if firestore_events:
                logger.info(f"✓ Loaded {len(firestore_events)} events from Firestore")
                return jsonify(firestore_events), 200
            else:
                logger.info("No events found in Firestore, will generate new ones")
        except Exception as e:
            logger.warning(f"Could not load from Firestore: {e}, generating new events...")
        
        # STRATEGY 2: If Firestore empty, fetch trending news articles and create events
        logger.info("Fetching trending news articles...")
        articles = news_service.fetch_trending_news()
        
        if not articles:
            logger.warning("No articles available from news service")
            return jsonify([]), 200
        
        # Convert articles to events and store in Firestore
        events = []
        for article in articles[:20]:  # Limit to 20 events
            try:
                logger.info(f"Converting article '{article.title}' to event...")
                event = event_service.create_event_from_articles([article])
                logger.info(f"Event created: {event.id}. Location: {event.location.name if event.location else 'None'}")
                
                # Ensure location has required attributes
                if not event.location:
                    logger.warning(f"Event {event.id} has no location, skipping")
                    continue
                
                serialized_event = _serialize_event(event)
                _persist_event_snapshot(serialized_event)
                events.append(serialized_event)
                logger.info(f"Event converted successfully")
            except Exception as e:
                logger.error(f"Error converting article to event: {e}", exc_info=True)
                continue
        
        logger.info(f"Returning {len(events)} events")
        return jsonify(events), 200
    
    except Exception as e:
        logger.error(f"Error fetching events: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/events/<event_id>', methods=['GET'])
def get_event(event_id):
    """Fetch a specific event by ID from Firestore."""
    logger.info(f"Get event {event_id} endpoint called")
    try:
        event = _resolve_event(event_id)
        if event:
            logger.info(f"Event {event_id} resolved successfully")
            return jsonify(event), 200

        logger.warning(f"Event {event_id} not found after regeneration")
        return jsonify({"error": "Event not found"}), 404
    
    except Exception as e:
        logger.error(f"Error fetching event: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500

@app.route('/api/news/trending', methods=['GET'])
def get_trending_news():
    """Fetch trending news articles."""
    logger.info("Get trending news endpoint called")
    try:
        articles = news_service.fetch_trending_news()
        
        news = []
        for i, article in enumerate(articles[:10]):
            # Generate event ID using the same logic as event_service
            event_id = hashlib.md5(article.url.encode()).hexdigest()
            
            news.append({
                "id": f"news_{i}",
                "eventId": event_id,  # Link to event using MD5 hash of URL
                "title": article.title,
                "previewText": article.description or article.title,
                "outlet": article.source_name,
                "publishedAt": article.published_at,
                "url": article.url,
            })
        
        logger.info(f"Returning {len(news)} trending articles")
        return jsonify(news), 200
    
    except Exception as e:
        logger.error(f"Error fetching trending news: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login endpoint - delegates to Firebase."""
    logger.info("Login endpoint called")
    return jsonify({"message": "Use Firebase Auth for authentication"}), 200

@app.route('/api/auth/me', methods=['GET'])
@app.route('/api/users/me', methods=['GET'])
def get_current_user():
    """Get current authenticated user from Firebase."""
    logger.info("Get current user endpoint called")
    try:
        decoded_token, error_response = _verify_request_user()
        if error_response:
            return error_response

        return jsonify(_build_user_payload(decoded_token)), 200
    
    except Exception as e:
        logger.error(f"Error fetching user: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/users/me', methods=['PATCH'])
def update_current_user():
    """Update the current user profile and preferences."""
    logger.info("Update current user endpoint called")
    try:
        decoded_token, error_response = _verify_request_user()
        if error_response:
            return error_response
        assert decoded_token is not None

        payload = request.get_json(silent=True) or {}
        updates = {}

        if "displayName" in payload and isinstance(payload["displayName"], str):
            updates["displayName"] = payload["displayName"].strip()

        if "preferences" in payload and isinstance(payload["preferences"], dict):
            preferences = payload["preferences"]
            updates["preferences"] = {
                "countries": preferences.get("countries", []),
                "categories": preferences.get("categories", []),
            }

        if "onboardingCompleted" in payload:
            updates["onboardingCompleted"] = bool(payload["onboardingCompleted"])

        updates["email"] = decoded_token.get("email", "")
        updates["updatedAt"] = datetime.now().isoformat()

        if "createdAt" not in updates:
            existing_doc = firebase_service.get_user_doc(decoded_token['uid']) or {}
            updates["createdAt"] = _serialize_datetime(existing_doc.get("createdAt")) or datetime.now().isoformat()

        if "preferences" not in updates:
            existing_preferences = (firebase_service.get_user_doc(decoded_token['uid']) or {}).get("preferences") or {}
            updates["preferences"] = {
                "countries": existing_preferences.get("countries", DEFAULT_USER_PREFERENCES["countries"]),
                "categories": existing_preferences.get("categories", DEFAULT_USER_PREFERENCES["categories"]),
            }

        success = firebase_service.set_user_doc(decoded_token['uid'], updates)
        if not success:
            return jsonify({"error": "Failed to update user"}), 500

        return jsonify(_build_user_payload(decoded_token)), 200

    except Exception as e:
        logger.error(f"Error updating user: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500

@app.route('/api/users/me/saved-events', methods=['GET'])
def get_saved_events():
    """Get user's saved events from Firebase."""
    logger.info("Get saved events endpoint called")
    try:
        decoded_token, error_response = _verify_request_user()
        if error_response:
            return error_response
        assert decoded_token is not None

        user_data = firebase_service.get_user_doc(decoded_token.get('uid')) or {}
        saved_event_ids = user_data.get('savedEvents', [])
        saved_events = []

        for event_id in saved_event_ids:
            event = _resolve_event(event_id)
            if event:
                saved_events.append(event)

        return jsonify(saved_events), 200
    
    except Exception as e:
        logger.error(f"Error fetching saved events: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/users/me/saved-events/<event_id>', methods=['POST'])
def save_event(event_id):
    """Save event for authenticated user."""
    logger.info(f"Save event {event_id} endpoint called")
    try:
        decoded_token, error_response = _verify_request_user()
        if error_response:
            return error_response
        assert decoded_token is not None

        event = _resolve_event(event_id)
        if not event:
            return jsonify({"error": "Event not found"}), 404

        success = firebase_service.add_saved_event(decoded_token['uid'], event_id)
        if not success:
            return jsonify({"error": "Unable to save event"}), 500

        return jsonify({"status": "saved", "eventId": event_id}), 200
    
    except Exception as e:
        logger.error(f"Error saving event: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/users/me/saved-events/<event_id>', methods=['DELETE'])
def unsave_event(event_id):
    """Remove saved event for authenticated user."""
    logger.info(f"Unsave event {event_id} endpoint called")
    try:
        decoded_token, error_response = _verify_request_user()
        if error_response:
            return error_response
        assert decoded_token is not None

        success = firebase_service.remove_saved_event(decoded_token['uid'], event_id)
        if not success:
            return jsonify({"error": "Unable to remove saved event"}), 500

        return jsonify({"status": "unsaved", "eventId": event_id}), 200
    
    except Exception as e:
        logger.error(f"Error unsaving event: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/campaigns', methods=['GET'])
def list_campaigns():
    """List campaign records, optionally filtered by event."""
    event_id = (request.args.get('eventId') or '').strip() or None
    include_inactive = (request.args.get('includeInactive') or '').lower() == 'true'
    campaigns = relief_fund_service.list_campaigns(event_id=event_id, include_inactive=include_inactive)
    return jsonify(campaigns), 200


@app.route('/api/campaigns/<campaign_id>', methods=['GET'])
def get_campaign(campaign_id):
    """Return a single relief campaign."""
    campaign = relief_fund_service.get_campaign(campaign_id)
    if not campaign:
        return jsonify({"error": "Campaign not found"}), 404
    return jsonify(campaign), 200


@app.route('/api/campaigns/review-queue', methods=['GET'])
def get_campaign_review_queue():
    """Return pending higher-cap campaigns awaiting review."""
    decoded_token, error_response = _verify_request_user()
    if error_response:
        return error_response

    _user_data, reviewer_error = _require_reviewer(decoded_token)
    if reviewer_error:
        return reviewer_error

    campaigns = relief_fund_service.list_review_queue()
    return jsonify(campaigns), 200


@app.route('/api/campaigns/me', methods=['GET'])
def get_my_campaigns():
    """Return the current user's campaign records."""
    decoded_token, error_response = _verify_request_user()
    if error_response:
        return error_response
    assert decoded_token is not None

    campaigns = relief_fund_service.list_campaigns(
        owner_uid=decoded_token['uid'],
        include_inactive=True,
    )
    return jsonify(campaigns), 200


@app.route('/api/campaigns', methods=['POST'])
def create_campaign():
    """Create a new event-linked relief campaign."""
    decoded_token, error_response = _verify_request_user()
    if error_response:
        return error_response
    assert decoded_token is not None

    payload = request.get_json(silent=True) or {}
    event_id = (payload.get('eventId') or '').strip()
    if not event_id:
        return jsonify({"error": "eventId is required"}), 400

    payload_event = _normalize_event_snapshot(payload.get("event"))
    if payload_event and payload_event.get("id") != event_id:
        return jsonify({"error": "Event payload does not match eventId"}), 400

    event = _resolve_event(event_id)
    if not event and payload_event:
        _persist_event_snapshot(payload_event)
        event = payload_event
    if not event:
        return jsonify({"error": "Event not found"}), 404

    user_profile = firebase_service.get_user_doc(decoded_token['uid']) or {}
    campaign = relief_fund_service.create_campaign(
        owner_uid=decoded_token['uid'],
        owner_name=user_profile.get("displayName") or decoded_token.get('name', ''),
        owner_email=user_profile.get("email") or decoded_token.get('email', ''),
        event_snapshot=event,
        payload=payload,
    )
    return jsonify(campaign), 201


@app.route('/api/campaigns/<campaign_id>', methods=['PATCH'])
def update_campaign(campaign_id):
    """Update a creator's campaign."""
    decoded_token, error_response = _verify_request_user()
    if error_response:
        return error_response
    assert decoded_token is not None

    payload = request.get_json(silent=True) or {}
    campaign = relief_fund_service.update_campaign(
        campaign_id=campaign_id,
        owner_uid=decoded_token['uid'],
        payload=payload,
    )
    return jsonify(campaign), 200


@app.route('/api/campaigns/<campaign_id>/review', methods=['POST'])
def review_campaign(campaign_id):
    """Approve or deny a pending relief review request."""
    decoded_token, error_response = _verify_request_user()
    if error_response:
        return error_response
    assert decoded_token is not None

    user_data, reviewer_error = _require_reviewer(decoded_token)
    if reviewer_error:
        return reviewer_error
    assert user_data is not None

    payload = request.get_json(silent=True) or {}
    reviewer_email = user_data.get("email") or ""
    if not reviewer_email and decoded_token:
        reviewer_email = decoded_token.get("email", "") or ""
    campaign = relief_fund_service.review_campaign(
        campaign_id=campaign_id,
        reviewer_uid=decoded_token['uid'],
        reviewer_email=reviewer_email,
        decision=payload.get("decision"),
        notes=payload.get("notes") or "",
    )
    return jsonify(campaign), 200


@app.route('/api/campaigns/<campaign_id>/checkout-session', methods=['POST'])
def create_campaign_checkout_session(campaign_id):
    """Create a Stripe Checkout Session for a campaign donation."""
    payload = request.get_json(silent=True) or {}
    campaign = relief_fund_service.get_campaign(campaign_id)
    amount_cents = relief_fund_service.validate_checkout(campaign, payload.get("amount"))
    donor_name = (payload.get("donorName") or "").strip()
    donor_email = (payload.get("donorEmail") or "").strip()

    checkout_session = stripe_service.create_checkout_session(
        campaign=campaign,
        amount_cents=amount_cents,
        donor_name=donor_name,
        donor_email=donor_email,
    )
    donation = relief_fund_service.create_pending_donation(
        campaign=campaign,
        session_id=checkout_session.id,
        payment_intent_id=getattr(checkout_session, "payment_intent", None),
        amount_cents=amount_cents,
        donor_name=donor_name,
        donor_email=donor_email,
    )

    return jsonify(
        {
            "url": checkout_session.url,
            "sessionId": checkout_session.id,
            "donation": donation,
        }
    ), 200


@app.route('/api/donations/session/<session_id>', methods=['GET'])
def get_donation_session(session_id):
    """Fetch donation status by Stripe Checkout Session ID."""
    donation = relief_fund_service.get_donation_by_session(session_id)
    if not donation:
        return jsonify({"error": "Donation session not found"}), 404
    return jsonify(donation), 200


@app.route('/api/stripe/webhook', methods=['POST'])
def stripe_webhook():
    """Handle Stripe webhook events for donation completion."""
    payload = request.get_data()
    signature = request.headers.get('Stripe-Signature', '')
    event = stripe_service.construct_webhook_event(payload, signature)
    event_type = event["type"]
    data_object = event["data"]["object"]

    if event_type == "checkout.session.completed" and data_object.get("payment_status") == "paid":
        donation, campaign = relief_fund_service.mark_donation_completed(data_object)
        return jsonify({"received": True, "donation": donation, "campaign": campaign}), 200

    if event_type == "checkout.session.expired":
        relief_fund_service.mark_donation_expired(data_object.get("id"))

    return jsonify({"received": True}), 200

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal error: {error}")
    return jsonify({"error": "Internal server error"}), 500

if __name__ == "__main__":
    logger.info("[START] CrisisLens Backend started")
    logger.info(f"Mock Auth Mode: {config.USE_MOCK_AUTH}")
    logger.info(f"Mock Data Mode: {config.USE_MOCK_DATA}")
    app.run(host="0.0.0.0", port=8000, debug=config.DEBUG)

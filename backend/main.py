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
from services.openai_service import generate_mock_analysis_from_text, analysis_needs_refresh
from services.translation_service import TranslationService

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

def _safe_int(value, default=0):
    try:
        return int(value)
    except (TypeError, ValueError):
        return default

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

def _serialize_source_article(article):
    if not article:
        return None

    return {
        "id": article.id,
        "title": article.title,
        "description": article.description or "",
        "imageUrl": article.image_url or "",
        "sourceName": article.source_name,
        "sourceUri": getattr(article, "source_uri", None),
        "publishedAt": _serialize_datetime(article.published_at),
        "url": article.url,
        "content": article.content or "",
        "language": getattr(article, "language", None),
        "eventUri": getattr(article, "event_uri", None),
        "eventKey": getattr(article, "event_key", None),
        "duplicateOf": getattr(article, "duplicate_of", None),
        "isDuplicate": getattr(article, "is_duplicate", None),
        "socialScore": getattr(article, "social_score", None),
        "categories": list(getattr(article, "categories", []) or []),
        "concepts": list(getattr(article, "concepts", []) or []),
    }

def _severity_priority(value):
    return {
        "critical": 4,
        "high": 3,
        "medium": 2,
        "low": 1,
        "info": 0,
    }.get((value or "info").lower(), 0)

def _serialize_event(event):
    if not event:
        return None

    severity = _normalize_severity(event.ai_analysis.severity if event.ai_analysis else "info")
    category = _derive_event_category(event)
    source_articles = [
        serialized_article
        for serialized_article in (_serialize_source_article(article) for article in (event.source_articles or []))
        if serialized_article
    ]
    sources = [
        {
            "id": article.get("id"),
            "name": article.get("sourceName"),
            "url": article.get("url"),
            "publishedAt": article.get("publishedAt"),
            "sourceUri": article.get("sourceUri"),
            "isDuplicate": article.get("isDuplicate"),
        }
        for article in source_articles
    ]
    primary_source = source_articles[0] if source_articles else {}
    event_key = primary_source.get("eventUri") or primary_source.get("eventKey") or event.id

    return {
        "id": event.id,
        "eventKey": event_key,
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
        "sourceArticles": source_articles,
        "sources": sources,
        "sourcesCount": len(sources),
        "articleCount": len(source_articles),
        "primarySourceName": primary_source.get("sourceName"),
        "primarySourceUrl": primary_source.get("url"),
        "tags": [category.replace('-', ' '), severity],
    }

def _is_serialized_event_snapshot(payload):
    return isinstance(payload, dict) and bool(payload.get("id")) and bool(payload.get("title"))

def _normalize_event_snapshot(payload):
    if not _is_serialized_event_snapshot(payload):
        return None

    snapshot = dict(payload)
    snapshot["startedAt"] = _serialize_datetime(snapshot.get("startedAt") or snapshot.get("createdAt"))
    snapshot["updatedAt"] = _serialize_datetime(snapshot.get("updatedAt"))
    snapshot["country"] = snapshot.get("country", "") or ""
    snapshot["previewImage"] = snapshot.get("previewImage", "") or ""
    snapshot["previewText"] = snapshot.get("previewText") or snapshot.get("description", "")

    if "lat" in snapshot and snapshot.get("lat") is not None:
        snapshot["lat"] = float(snapshot["lat"])
    if "lng" in snapshot and snapshot.get("lng") is not None:
        snapshot["lng"] = float(snapshot["lng"])

    source_articles = snapshot.get("sourceArticles")
    if not isinstance(source_articles, list):
        source_articles = []
    snapshot["sourceArticles"] = source_articles

    sources = snapshot.get("sources")
    if not isinstance(sources, list) or not sources:
        sources = [
            {
                "id": article.get("id"),
                "name": article.get("sourceName"),
                "url": article.get("url"),
                "publishedAt": article.get("publishedAt"),
                "sourceUri": article.get("sourceUri"),
                "isDuplicate": article.get("isDuplicate"),
            }
            for article in source_articles
            if isinstance(article, dict)
        ]
    snapshot["sources"] = sources
    snapshot["sourcesCount"] = max(_safe_int(snapshot.get("sourcesCount")), len(sources), len(source_articles))
    snapshot["articleCount"] = max(_safe_int(snapshot.get("articleCount")), len(source_articles), snapshot["sourcesCount"])
    snapshot["eventKey"] = snapshot.get("eventKey") or snapshot.get("id")
    snapshot["primarySourceName"] = snapshot.get("primarySourceName") or (sources[0].get("name") if sources else None)
    snapshot["primarySourceUrl"] = snapshot.get("primarySourceUrl") or (sources[0].get("url") if sources else None)
    snapshot["tags"] = snapshot.get("tags") or [snapshot.get("category", "other"), snapshot.get("severity", "info")]

    return _repair_event_snapshot_analysis(snapshot)

def _repair_event_snapshot_analysis(snapshot):
    if not snapshot:
        return snapshot

    current_summary = snapshot.get("aiSummary", "")
    title = snapshot.get("title", "")
    description = snapshot.get("description", "")

    if not analysis_needs_refresh(title, description, current_summary):
        return snapshot

    location = snapshot.get("location", "Unknown")
    grounded_analysis = generate_mock_analysis_from_text(
        f"Title: {title}\nDescription: {description}\n",
        location,
    )

    repaired = dict(snapshot)
    repaired["aiSummary"] = grounded_analysis.summary
    repaired["affectedGroups"] = grounded_analysis.affected_groups
    repaired["impactAnalysis"] = grounded_analysis.impact_analysis
    repaired["howToHelp"] = grounded_analysis.how_to_help
    repaired["watchGuidance"] = grounded_analysis.watch_guidance
    repaired["severity"] = _normalize_severity(grounded_analysis.severity)
    return repaired

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

def _coerce_event_limit(raw_value):
    if raw_value in (None, ""):
        return None

    try:
        parsed_limit = int(raw_value)
    except (TypeError, ValueError):
        return config.EVENT_TARGET_COUNT

    return max(1, min(parsed_limit, config.MAX_EVENT_LIMIT))

def _event_sort_key(event):
    return (
        _severity_priority(event.get("severity")),
        _serialize_datetime(
            event.get("updatedAt")
            or event.get("startedAt")
            or event.get("timestamp")
            or ""
        ) or "",
        event.get("articleCount") or event.get("sourcesCount") or 0,
    )

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
        "language": user_data.get("language", "en"),
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
        # Get language preference from query params
        language = request.args.get('language', 'en').lower()
        if language not in TranslationService.LANGUAGE_CODES:
            language = 'en'
        requested_limit = _coerce_event_limit(request.args.get('limit'))
        target_event_count = requested_limit or config.EVENT_TARGET_COUNT
        
        # STRATEGY 1: Try to load events from Firestore (persistent storage)
        logger.info("Attempting to load events from Firestore...")
        firestore_events = []
        existing_ids = set()
        try:
            db = firebase_service._db
            if not db:
                logger.warning("Firebase not initialized, skipping Firestore load")
                raise Exception("Firebase not available")
            
            # Query all events from Firestore
            docs = db.collection('events').stream()
            for doc in docs:
                event_data = doc.to_dict()
                event_id = event_data.get('id')
                
                # Skip duplicates
                if not event_id:
                    logger.warning(f"Skipping event document without id: {doc.id}")
                    continue
                if event_id in existing_ids:
                    logger.warning(f"Skipping duplicate event: {event_id}")
                    continue
                existing_ids.add(event_id)
                
                needs_analysis_refresh = analysis_needs_refresh(
                    event_data.get("title", ""),
                    event_data.get("description", ""),
                    event_data.get("aiSummary", ""),
                )
                event = _normalize_event_snapshot(event_data)
                if not event:
                    logger.warning(f"Skipping invalid event snapshot: {event_id}")
                    continue
                
                # Translate summaries if needed and enabled
                if language != 'en' and config.ENABLE_TRANSLATIONS:
                    event = TranslationService.translate_event_summaries(dict(event), language)
                
                firestore_events.append(event)
                if needs_analysis_refresh:
                    _persist_event_snapshot(event_data)
            
            if firestore_events:
                logger.info(f"✓ Loaded {len(firestore_events)} unique events from Firestore")
                firestore_events.sort(key=_event_sort_key, reverse=True)
                if len(firestore_events) >= target_event_count:
                    response_events = firestore_events[:requested_limit] if requested_limit else firestore_events
                    logger.info(f"Returning {len(response_events)} events from Firestore cache")
                    return jsonify(response_events), 200
                logger.info(
                    f"Firestore has {len(firestore_events)} events, topping up to target of {target_event_count}"
                )
            else:
                logger.info("No events found in Firestore, will generate new ones")
        except Exception as e:
            logger.warning(f"Could not load from Firestore: {e}, generating new events...")
        
        # STRATEGY 2: If Firestore is empty or below target, fetch grouped article coverage and create missing events
        missing_event_count = max(target_event_count - len(firestore_events), 0)
        fetch_target_count = min(config.MAX_EVENT_LIMIT, target_event_count)
        logger.info(
            f"Fetching grouped news coverage to fill {missing_event_count} missing events (fetch target {fetch_target_count})..."
        )
        try:
            article_groups = news_service.fetch_trending_news_groups(limit=fetch_target_count)
        except Exception as exc:
            if firestore_events:
                logger.warning(f"Could not top up cached events: {exc}. Returning cached results instead.")
                response_events = firestore_events[:requested_limit] if requested_limit else firestore_events
                return jsonify(response_events), 200
            raise
        
        if not article_groups:
            logger.warning("No grouped articles available from news service")
            response_events = firestore_events[:requested_limit] if requested_limit else firestore_events
            return jsonify(response_events), 200
        
        if existing_ids:
            logger.info(f"Found {len(existing_ids)} existing events in Firestore before top-up")
        
        # Convert articles to events and store in Firestore
        generated_events = []
        for article_group in article_groups:
            if len(firestore_events) + len(generated_events) >= target_event_count:
                break
            try:
                if not article_group:
                    continue
                logger.info(f"Converting grouped story '{article_group[0].title}' with {len(article_group)} sources into event...")
                event = event_service.create_event_from_articles(article_group)
                
                # Skip if event already exists
                if event.id in existing_ids:
                    logger.info(f"Event {event.id} already exists, skipping duplicate")
                    continue
                
                logger.info(f"Event created: {event.id}. Location: {event.location.name if event.location else 'None'}")
                
                # Ensure location has required attributes
                if not event.location:
                    logger.warning(f"Event {event.id} has no location, skipping")
                    continue
                
                serialized_event = _serialize_event(event)
                _persist_event_snapshot(serialized_event)
                
                # Translate summaries if needed and enabled
                if language != 'en' and config.ENABLE_TRANSLATIONS:
                    serialized_event = TranslationService.translate_event_summaries(serialized_event, language)
                
                generated_events.append(serialized_event)
                existing_ids.add(event.id)  # Track new event to avoid duplicates in this batch
                logger.info(f"Event converted successfully")
            except Exception as e:
                logger.error(f"Error converting article to event: {e}", exc_info=True)
                continue
        
        combined_events = sorted(firestore_events + generated_events, key=_event_sort_key, reverse=True)
        response_events = combined_events[:requested_limit] if requested_limit else combined_events
        logger.info(f"Returning {len(response_events)} events after cache top-up")
        return jsonify(response_events), 200
    
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

@app.route('/api/events/<event_id>/translate', methods=['POST'])
def translate_event(event_id):
    """Translate a specific event's summaries to the target language."""
    logger.info(f"Translate event {event_id} endpoint called")
    try:
        language = request.json.get('language', 'en') if request.json else 'en'
        
        # Validate language code
        if language not in TranslationService.LANGUAGE_CODES:
            return jsonify({"error": f"Unsupported language: {language}"}), 400
        
        # If English, no translation needed
        if language == 'en':
            event = _resolve_event(event_id)
            if event:
                return jsonify(event), 200
            return jsonify({"error": "Event not found"}), 404
        
        # Get the event
        event = _resolve_event(event_id)
        if not event:
            return jsonify({"error": "Event not found"}), 404
        
        # Translate the event summaries
        translated_event = TranslationService.translate_event_summaries(event, language)
        logger.info(f"Event {event_id} translated to {language}")
        
        return jsonify(translated_event), 200
    
    except Exception as e:
        logger.error(f"Error translating event: {e}", exc_info=True)
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

        if "language" in payload and isinstance(payload["language"], str):
            language = payload["language"].lower()
            # Validate language code
            if language in TranslationService.LANGUAGE_CODES:
                updates["language"] = language
            else:
                logger.warning(f"Invalid language code: {language}")

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

from flask import Flask, jsonify, request
import os
import hashlib
from datetime import datetime, timedelta
from config import config
from utils.logger import logger
from services.firebase_service import firebase_service, FirebaseService
from services.news_service import news_service
from services.event_service import event_service
from middleware.auth_middleware import require_auth

app = Flask(
    __name__,
    instance_relative_config=True
)

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
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS'
    return response

@app.route('/api/events', methods=['OPTIONS'])
@app.route('/api/events/<path:path>', methods=['OPTIONS'])
@app.route('/api/news', methods=['OPTIONS'])
@app.route('/api/auth/login', methods=['OPTIONS'])
@app.route('/api/users/me', methods=['OPTIONS'])
@app.route('/api/users/me/saved-events', methods=['OPTIONS'])
@app.route('/api/users/me/saved-events/<path:path>', methods=['OPTIONS'])
def handle_options():
    return '', 204

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
            db = FirebaseService._db
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
                
                event_dict = {
                    "id": event.id,
                    "title": event.title,
                    "description": event.description,
                    "severity": event.ai_analysis.severity if event.ai_analysis else "high",
                    "category": event.location.name.split(',')[-1].strip().lower() if event.location else "other",
                    "region": event.location.region if event.location and event.location.region else "Unknown",
                    "location": event.location.name if event.location else "Unknown",
                    "lat": float(event.location.latitude) if event.location and hasattr(event.location, 'latitude') else 0,
                    "lng": float(event.location.longitude) if event.location and hasattr(event.location, 'longitude') else 0,
                    "timestamp": event.created_at.isoformat(),
                    "startedAt": event.created_at.isoformat(),
                    "updatedAt": event.updated_at.isoformat(),
                    "previewImage": event.image_url or "",
                    "aiSummary": event.ai_analysis.summary if event.ai_analysis else event.description,
                    "affectedGroups": event.ai_analysis.affected_groups if event.ai_analysis else [],
                    "impactAnalysis": event.ai_analysis.impact_analysis if event.ai_analysis else "",
                    "howToHelp": event.ai_analysis.how_to_help if event.ai_analysis else "",
                    "watchGuidance": event.ai_analysis.watch_guidance if event.ai_analysis else "",
                    "sources": [{"name": article.source_name, "url": article.url}],
                    "sourcesCount": 1,
                }
                events.append(event_dict)
                
                # Store in Firestore for persistence
                try:
                    db = FirebaseService._db
                    db.collection('events').document(event.id).set({
                        'id': event.id,
                        'title': event.title,
                        'description': event.description,
                        'category': event_dict['category'],
                        'severity': event_dict['severity'],
                        'location': event.location.name if event.location else "Unknown",
                        'lat': event_dict['lat'],
                        'lng': event_dict['lng'],
                        'previewImage': event.image_url or "",
                        'aiSummary': event_dict['aiSummary'],
                        'affectedGroups': event_dict['affectedGroups'],
                        'impactAnalysis': event_dict['impactAnalysis'],
                        'howToHelp': event_dict['howToHelp'],
                        'watchGuidance': event_dict['watchGuidance'],
                        'sources': event_dict['sources'],
                        'createdAt': event.created_at.isoformat(),
                        'updatedAt': event.updated_at.isoformat(),
                    })
                    logger.info(f"Event {event.id} stored in Firestore")
                except Exception as e:
                    logger.warning(f"Could not store event in Firestore: {e}")
                
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
        # Try to get from Firestore first
        db = FirebaseService._db
        if not db:
            logger.info("DB not initialized, initializing...")
            FirebaseService.initialize()
            db = FirebaseService._db
        
        logger.info(f"Querying Firestore for event {event_id}...")
        doc = db.collection('events').document(event_id).get()
        
        if doc.exists:
            event_data = doc.to_dict()
            logger.info(f"Event {event_id} found in Firestore")
            return jsonify(event_data), 200
        
        # Fallback to in-memory store
        logger.info(f"Event {event_id} not in Firestore, checking in-memory store...")
        event = event_service.get_event(event_id)
        if event:
            logger.info(f"Event {event_id} found in store")
            return jsonify({
                "id": event.id,
                "title": event.title,
                "description": event.description,
                "severity": event.ai_analysis.severity if event.ai_analysis else "high",
                "location": event.location.name if event.location else "Unknown",
                "lat": float(event.location.latitude) if event.location else 0,
                "lng": float(event.location.longitude) if event.location else 0,
                "previewImage": event.image_url or "",
                "aiSummary": event.ai_analysis.summary if event.ai_analysis else event.description,
                "affectedGroups": event.ai_analysis.affected_groups if event.ai_analysis else [],
                "impactAnalysis": event.ai_analysis.impact_analysis if event.ai_analysis else "",
                "howToHelp": event.ai_analysis.how_to_help if event.ai_analysis else "",
                "watchGuidance": event.ai_analysis.watch_guidance if event.ai_analysis else "",
                "sources": [{"name": a.source_name, "url": a.url} for a in event.source_articles] if event.source_articles else [],
            }), 200
        
        logger.warning(f"Event {event_id} not found in Firestore or store")
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

@app.route('/api/users/me', methods=['GET'])
def get_current_user():
    """Get current authenticated user from Firebase."""
    logger.info("Get current user endpoint called")
    try:
        auth_header = request.headers.get('Authorization', '')
        
        if not auth_header:
            # If no auth header, return 401
            return jsonify({"error": "Missing authorization header"}), 401
        
        try:
            token = auth_header.replace('Bearer ', '')
            decoded_token = firebase_service.verify_id_token(token)
            
            if not decoded_token:
                return jsonify({"error": "Invalid token"}), 401
            
            # Fetch user document from Firestore
            user_data = firebase_service.get_user_doc(decoded_token['uid'])
            
            user = {
                "id": decoded_token['uid'],
                "email": decoded_token.get('email', ''),
                "displayName": decoded_token.get('name', ''),
                "createdAt": datetime.now().isoformat(),
            }
            
            if user_data:
                user.update(user_data)
            
            return jsonify(user), 200
        
        except Exception as e:
            logger.error(f"Auth error: {e}")
            return jsonify({"error": "Authentication failed"}), 401
    
    except Exception as e:
        logger.error(f"Error fetching user: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/users/me/saved-events', methods=['GET'])
def get_saved_events():
    """Get user's saved events from Firebase."""
    logger.info("Get saved events endpoint called")
    try:
        auth_header = request.headers.get('Authorization', '')
        
        if not auth_header:
            return jsonify({"error": "Missing authorization header"}), 401
        
        try:
            token = auth_header.replace('Bearer ', '')
            decoded_token = firebase_service.verify_id_token(token)
            
            if not decoded_token:
                return jsonify({"error": "Invalid token"}), 401
            
            user_data = firebase_service.get_user_doc(decoded_token['uid'])
            
            if not user_data:
                return jsonify([]), 200
            
            saved_event_ids = user_data.get('savedEvents', [])
            
            # Fetch saved events by ID
            saved_events = []
            for event_id in saved_event_ids:
                event = event_service.get_event(event_id)
                if event:
                    saved_events.append({
                        "id": event.id,
                        "title": event.title,
                        "description": event.description,
                    })
            
            return jsonify(saved_events), 200
        
        except Exception as e:
            logger.error(f"Auth error: {e}")
            return jsonify({"error": "Authentication failed"}), 401
    
    except Exception as e:
        logger.error(f"Error fetching saved events: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/users/me/saved-events/<event_id>', methods=['POST'])
def save_event(event_id):
    """Save event for authenticated user."""
    logger.info(f"Save event {event_id} endpoint called")
    try:
        auth_header = request.headers.get('Authorization', '')
        
        if not auth_header:
            return jsonify({"error": "Missing authorization header"}), 401
        
        try:
            token = auth_header.replace('Bearer ', '')
            decoded_token = firebase_service.verify_id_token(token)
            
            if not decoded_token:
                return jsonify({"error": "Invalid token"}), 401
            
            # Add event to user's saved events
            firebase_service.add_saved_event(decoded_token['uid'], event_id)
            
            return jsonify({"status": "saved", "eventId": event_id}), 200
        
        except Exception as e:
            logger.error(f"Auth error: {e}")
            return jsonify({"error": "Authentication failed"}), 401
    
    except Exception as e:
        logger.error(f"Error saving event: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/users/me/saved-events/<event_id>', methods=['DELETE'])
def unsave_event(event_id):
    """Remove saved event for authenticated user."""
    logger.info(f"Unsave event {event_id} endpoint called")
    try:
        auth_header = request.headers.get('Authorization', '')
        
        if not auth_header:
            return jsonify({"error": "Missing authorization header"}), 401
        
        try:
            token = auth_header.replace('Bearer ', '')
            decoded_token = firebase_service.verify_id_token(token)
            
            if not decoded_token:
                return jsonify({"error": "Invalid token"}), 401
            
            # Remove event from user's saved events
            firebase_service.remove_saved_event(decoded_token['uid'], event_id)
            
            return jsonify({"status": "unsaved", "eventId": event_id}), 200
        
        except Exception as e:
            logger.error(f"Auth error: {e}")
            return jsonify({"error": "Authentication failed"}), 401
    
    except Exception as e:
        logger.error(f"Error unsaving event: {e}")
        return jsonify({"error": str(e)}), 500

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

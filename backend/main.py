from flask import Flask, jsonify, request
import os
from datetime import datetime, timedelta
from config import config
from utils.logger import logger

app = Flask(
    __name__,
    instance_relative_config=True
)

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

# Mock event data
MOCK_EVENTS = [
    {
        "id": "1",
        "title": "Earthquake in Turkey",
        "severity": "critical",
        "category": "Seismic",
        "region": "Middle East",
        "description": "Major earthquake (7.8 magnitude) strikes southern Turkey",
        "location": "Turkey",
        "lat": 37.1,
        "lng": 35.5,
        "timestamp": (datetime.now() - timedelta(days=2)).isoformat(),
        "startedAt": (datetime.now() - timedelta(days=2)).isoformat(),
        "updatedAt": (datetime.now() - timedelta(hours=2)).isoformat(),
        "affected": 2500000,
        "sources": [{"name": "USGS", "url": "https://usgs.gov"}, {"name": "Reuters", "url": "https://reuters.com"}],
        "sourcesCount": 2,
        "previewImage": "https://images.unsplash.com/photo-1569163139394-de4798aa62b2?w=800&q=80",
        "aiSummary": "A devastating 7.8 magnitude earthquake struck southern Turkey, causing widespread destruction across multiple provinces. Initial reports indicate significant casualties and displacement.",
        "tags": ["earthquake", "seismic", "turkey", "emergency"],
        "impacts": [
            {"label": "Deaths", "value": "50,000+", "severity": "critical"},
            {"label": "Displaced", "value": "2.5M", "severity": "critical"},
            {"label": "Infrastructure", "value": "Severe", "severity": "critical"}
        ],
        "whatToWatch": [
            {"title": "Aftershocks", "description": "Multiple aftershocks expected in coming weeks"},
            {"title": "Supply Chain", "description": "Regional ports remain closed for assessment"}
        ],
        "howToHelp": [
            {"label": "Red Crescent", "url": "https://www.redcrescent.org.tr"},
            {"label": "UN OCHA", "url": "https://www.unocha.org"}
        ]
    },
    {
        "id": "2",
        "title": "Flooding in Pakistan",
        "severity": "high",
        "category": "Flooding",
        "region": "South Asia",
        "description": "Severe flooding affects multiple provinces",
        "location": "Pakistan",
        "lat": 31.5,
        "lng": 74.3,
        "timestamp": (datetime.now() - timedelta(days=5)).isoformat(),
        "startedAt": (datetime.now() - timedelta(days=5)).isoformat(),
        "updatedAt": (datetime.now() - timedelta(days=1)).isoformat(),
        "affected": 1200000,
        "sources": [{"name": "UN OCHA", "url": "https://reliefweb.int"}, {"name": "BBC", "url": "https://bbc.com"}],
        "sourcesCount": 2,
        "previewImage": "https://images.unsplash.com/photo-1559493615-cd4628902d4a?w=800&q=80",
        "aiSummary": "Monsoon rains have triggered severe flooding across Pakistan's major provinces, affecting agricultural areas and displacing thousands of families.",
        "tags": ["flood", "monsoon", "pakistan", "displacement"],
        "impacts": [
            {"label": "Affected", "value": "1.2M", "severity": "high"},
            {"label": "Crops", "value": "500K acres", "severity": "high"},
            {"label": "Access", "value": "Limited", "severity": "high"}
        ],
        "whatToWatch": [
            {"title": "Water Levels", "description": "Rivers expected to remain swollen for 1-2 weeks"}
        ],
        "howToHelp": [
            {"label": "Pakistan Red Crescent", "url": "https://www.prcs.org.pk"}
        ]
    },
    {
        "id": "3",
        "title": "Hurricane Season Alert",
        "severity": "high",
        "category": "Tropical Cyclone",
        "region": "Atlantic",
        "description": "Atlantic hurricane season forecast indicates above-average activity",
        "location": "Atlantic Ocean",
        "lat": 20.0,
        "lng": -50.0,
        "timestamp": (datetime.now() - timedelta(days=1)).isoformat(),
        "startedAt": (datetime.now() - timedelta(days=1)).isoformat(),
        "updatedAt": (datetime.now() - timedelta(hours=6)).isoformat(),
        "affected": 50000000,
        "sources": [{"name": "NOAA", "url": "https://weather.gov"}],
        "sourcesCount": 1,
        "previewImage": "https://images.unsplash.com/photo-1532274040911-5f82f9c6ff7a?w=800&q=80",
        "aiSummary": "NOAA forecasts above-normal Atlantic hurricane activity this season with 16-18 named storms predicted, 7-10 hurricanes, and 3-5 major hurricanes.",
        "tags": ["hurricane", "atlantic", "weather", "forecast"],
        "impacts": [
            {"label": "Forecast", "value": "16-18 storms", "severity": "high"},
            {"label": "Season", "value": "June-Nov", "severity": "medium"},
            {"label": "Preparedness", "value": "Critical", "severity": "high"}
        ],
        "whatToWatch": [
            {"title": "SST Anomalies", "description": "Sea surface temperatures above normal"},
            {"title": "Wind Shear", "description": "Lower than normal upper-level wind shear expected"}
        ],
        "howToHelp": [
            {"label": "American Red Cross", "url": "https://redcross.org"}
        ]
    },
    {
        "id": "4",
        "title": "Wildfire in California",
        "severity": "medium",
        "category": "Wildfire",
        "region": "North America",
        "description": "Large wildfire continues to spread in Northern California",
        "location": "California, USA",
        "lat": 39.5,
        "lng": -120.5,
        "timestamp": (datetime.now() - timedelta(days=3)).isoformat(),
        "startedAt": (datetime.now() - timedelta(days=3)).isoformat(),
        "updatedAt": (datetime.now() - timedelta(hours=4)).isoformat(),
        "affected": 300000,
        "sources": [{"name": "CAL FIRE", "url": "https://fire.ca.gov"}],
        "sourcesCount": 1,
        "previewImage": "https://images.unsplash.com/photo-1564760055775-d63b17a6b44c?w=800&q=80",
        "aiSummary": "A large wildfire is actively spreading across Northern California with strong wind conditions. Evacuation orders in effect for surrounding communities.",
        "tags": ["wildfire", "california", "air-quality", "evacuation"],
        "impacts": [
            {"label": "Area Burned", "value": "250K acres", "severity": "medium"},
            {"label": "Air Quality", "value": "Hazardous", "severity": "medium"},
            {"label": "Evacuations", "value": "Ongoing", "severity": "medium"}
        ],
        "whatToWatch": [
            {"title": "Weather", "description": "High winds expected to continue through weekend"}
        ],
        "howToHelp": [
            {"label": "Red Cross Donations", "url": "https://redcross.org"}
        ]
    },
    {
        "id": "5",
        "title": "Drought Crisis in Horn of Africa",
        "severity": "high",
        "category": "Drought",
        "region": "East Africa",
        "description": "Severe drought affecting millions across East Africa",
        "location": "Horn of Africa",
        "lat": 5.0,
        "lng": 40.0,
        "timestamp": (datetime.now() - timedelta(days=10)).isoformat(),
        "startedAt": (datetime.now() - timedelta(days=10)).isoformat(),
        "updatedAt": (datetime.now() - timedelta(days=2)).isoformat(),
        "affected": 5000000,
        "sources": [{"name": "UN OCHA", "url": "https://reliefweb.int"}],
        "sourcesCount": 1,
        "previewImage": "https://images.unsplash.com/photo-1500382017468-7049fae79eef?w=800&q=80",
        "aiSummary": "Prolonged drought conditions affecting the Horn of Africa region have led to severe water scarcity, livestock losses, and food insecurity affecting millions.",
        "tags": ["drought", "food-security", "water-crisis", "east-africa"],
        "impacts": [
            {"label": "Affected", "value": "5M+", "severity": "high"},
            {"label": "Livestock", "value": "Deaths", "severity": "high"},
            {"label": "Food", "value": "Crisis", "severity": "high"}
        ],
        "whatToWatch": [
            {"title": "Rainfall", "description": "Next rainy season critical for recovery"}
        ],
        "howToHelp": [
            {"label": "World Food Programme", "url": "https://wfp.org"}
        ]
    },
]

# Basic health check endpoint
@app.route('/health', methods=['GET'])
def health():
    logger.info("Health check endpoint called")
    return jsonify({"status": "ok", "service": "CrisisLens API"}), 200

# API Routes with /api prefix
@app.route('/api/events', methods=['GET'])
def get_events():
    logger.info("Get events endpoint called")
    return jsonify(MOCK_EVENTS), 200

@app.route('/api/events/<event_id>', methods=['GET'])
def get_event(event_id):
    logger.info(f"Get event {event_id} endpoint called")
    event = next((e for e in MOCK_EVENTS if e['id'] == event_id), None)
    if not event:
        return jsonify({"error": "Event not found"}), 404
    return jsonify(event), 200

@app.route('/api/news', methods=['GET'])
def get_news():
    logger.info("Get news endpoint called")
    news = [
        {
            "id": "n1",
            "title": "Major earthquake strikes Turkey",
            "description": "Powerful 7.8 magnitude earthquake causes widespread damage",
            "source": "Reuters",
            "timestamp": (datetime.now() - timedelta(days=2)).isoformat(),
            "url": "https://example.com",
        },
        {
            "id": "n2",
            "title": "Pakistan floods worsen humanitarian crisis",
            "description": "Heavy monsoon rains cause devastating floods",
            "source": "BBC",
            "timestamp": (datetime.now() - timedelta(days=5)).isoformat(),
            "url": "https://example.com",
        },
    ]
    return jsonify(news), 200

@app.route('/api/news/trending', methods=['GET'])
def get_trending_news():
    logger.info("Get trending news endpoint called")
    news = [
        {
            "id": "n1",
            "eventId": "1",
            "title": "Major earthquake strikes Turkey - Rescue operations underway",
            "previewText": "Recovery efforts intensify as international aid arrives",
            "outlet": "Reuters",
            "publishedAt": (datetime.now() - timedelta(hours=4)).isoformat(),
            "url": "https://example.com",
        },
        {
            "id": "n2",
            "eventId": "2",
            "title": "Pakistan monsoon crisis deepens - 1.2M affected",
            "previewText": "Emergency response teams mobilize across affected regions",
            "outlet": "BBC",
            "publishedAt": (datetime.now() - timedelta(hours=8)).isoformat(),
            "url": "https://example.com",
        },
        {
            "id": "n3",
            "eventId": "3",
            "title": "Atlantic hurricane season forecast released",
            "previewText": "NOAA predicts above-average storm activity for 2026",
            "outlet": "NOAA",
            "publishedAt": (datetime.now() - timedelta(hours=12)).isoformat(),
            "url": "https://example.com",
        },
        {
            "id": "n4",
            "eventId": "4",
            "title": "Northern California wildfire spreads - 250K acres burned",
            "previewText": "Strong winds continue to push flames across dry terrain",
            "outlet": "CAL FIRE",
            "publishedAt": (datetime.now() - timedelta(hours=2)).isoformat(),
            "url": "https://example.com",
        },
        {
            "id": "n5",
            "eventId": "5",
            "title": "Horn of Africa drought worsens - food crisis deepens",
            "previewText": "UN warns of potential famine conditions in coming months",
            "outlet": "UN OCHA",
            "publishedAt": (datetime.now() - timedelta(hours=6)).isoformat(),
            "url": "https://example.com",
        },
    ]
    return jsonify(news), 200

@app.route('/api/auth/login', methods=['POST'])
def login():
    logger.info("Login endpoint called")
    return jsonify({"token": "mock_token", "message": "Login endpoint"}), 200

@app.route('/api/users/me', methods=['GET'])
def get_current_user():
    logger.info("Get current user endpoint called")
    user = {
        "id": "user_1",
        "name": "Demo User",
        "email": "demo@example.com",
        "role": "analyst",
        "joinedAt": (datetime.now() - timedelta(days=30)).isoformat(),
    }
    return jsonify(user), 200

@app.route('/api/users/me/saved-events', methods=['GET'])
def get_saved_events():
    logger.info("Get saved events endpoint called")
    # Return first 2 events as saved
    return jsonify(MOCK_EVENTS[:2]), 200

@app.route('/api/users/me/saved-events/<event_id>', methods=['POST'])
def save_event(event_id):
    logger.info(f"Save event {event_id} endpoint called")
    return jsonify({"status": "saved", "eventId": event_id}), 200

@app.route('/api/users/me/saved-events/<event_id>', methods=['DELETE'])
def unsave_event(event_id):
    logger.info(f"Unsave event {event_id} endpoint called")
    return jsonify({"status": "unsaved", "eventId": event_id}), 200

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

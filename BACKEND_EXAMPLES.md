# CrisisLens Backend - Examples & Testing Guide

## Installation & Launch (5 minutes)

```bash
cd backend
pip install -r requirements.txt
python main.py
# Server runs on http://localhost:8000
```

In another terminal:
```bash
cd backend
python cli.py health  # Verify server is running
```

## Testing Workflow

### 1. Health Check (Verify server is up)
```bash
python cli.py health
```

Expected output:
```
✅ Backend is running!
{
  "status": "ok",
  "service": "CrisisLens Backend"
}
```

### 2. Fetch Trending News
```bash
python cli.py trending
```

Expected output:
```
✅ Found 3 articles

1. Earthquake Strikes West Coast
   Source: CNN
   A 6.2 magnitude earthquake hit California early this morning...

2. Humanitarian Aid Reaches Flood Zone
   Source: BBC
   International humanitarian organizations deliver emergency supplies...
```

### 3. Generate Events (Convert news to structured events)
```bash
python cli.py generate
```

This takes 5-10 seconds (or instant with mock data). Output:
```
✅ Generated 3 events

Event: Earthquake Strikes West Coast
Location: California, USA (36.1162, -119.6816)
Category: natural_disaster
Summary: A significant earthquake struck California requiring immediate response...

Event: Humanitarian Aid Reaches Flood Zone
Location: Pakistan (30.3753, 69.3451)
Category: humanitarian
Summary: Flooding in the Indus River region has displaced thousands...
```

### 4. List All Events
```bash
python cli.py events
```

Output:
```
✅ Found 2 events

ID: 550e8400-e29b-41d4-a716-446655440000
Title: Earthquake Strikes West Coast
Location: California, USA
```

### 5. Get Event Details
```bash
# Copy an event ID from the list above
python cli.py event 550e8400-e29b-41d4-a716-446655440000
```

Output: Full event JSON with all details

### 6. Save an Event
```bash
python cli.py save 550e8400-e29b-41d4-a716-446655440000
```

Output:
```
✅ Event saved!
{
  "status": "saved",
  "event_id": "550e8400-e29b-41d4-a716-446655440000",
  "saved_at": "2024-01-15T10:30:00"
}
```

### 7. View Saved Events
```bash
python cli.py saved
```

Output:
```
✅ Found 1 saved events

1. Earthquake Strikes West Coast
```

### 8. Check Auth
```bash
python cli.py auth
```

Output:
```
✅ Authenticated as:
{
  "user_id": "test-user-123",
  "email": "test@example.com",
  "display_name": "Test User"
}
```

## Web Dashboard Testing

### Open Dashboard
1. Start backend: `python main.py`
2. Open browser: `http://localhost:8000/test`
3. Click buttons to test

Features:
- Health check
- Fetch news
- Generate events
- View events list
- Interactive event cards (click to view details)
- Save/manage events
- Auth verification

## Curl Examples

### Health Check
```bash
curl http://localhost:8000/health
```

Response:
```json
{"status": "ok", "service": "CrisisLens Backend"}
```

### Trending News
```bash
curl http://localhost:8000/api/news/trending | jq '.[0]'
```

Response:
```json
{
  "id": "article-123",
  "title": "Earthquake Strikes West Coast",
  "description": "A 6.2 magnitude earthquake hit California...",
  "image_url": "https://path/to/image.jpg",
  "source_name": "CNN",
  "published_at": "2024-01-15T10:30:00",
  "url": "https://example.com/article",
  "content": "Full article text..."
}
```

### Generate Events
```bash
curl -X POST http://localhost:8000/api/events/generate?limit=2 | jq '.[0]'
```

Response (Event object with AI analysis):
```json
{
  "id": "uuid-1234",
  "title": "Earthquake Strikes West Coast",
  "description": "A 6.2 magnitude earthquake hit California early this morning...",
  "location": {
    "name": "California, USA",
    "latitude": 36.1162,
    "longitude": -119.6816,
    "country": "USA",
    "region": "California"
  },
  "source_articles": [
    {
      "id": "article-1",
      "title": "Earthquake Strikes West Coast",
      "description": "...",
      "url": "...",
      "source_name": "CNN"
    }
  ],
  "ai_analysis": {
    "summary": "A significant earthquake struck California requiring immediate emergency response.",
    "category": "natural_disaster",
    "affected_groups": ["residents", "infrastructure workers", "travelers"],
    "impact_analysis": "Infrastructure damage reported across Bay Area. Building inspections underway. Secondary impacts include potential aftershocks and power outages.",
    "how_to_help": "Donate to Red Cross or local relief organizations. Volunteer through official emergency management channels. Avoid going to affected areas.",
    "watch_guidance": "Monitor US Geological Survey for aftershock reports. Follow local emergency alerts. Track news for recovery updates."
  },
  "created_at": "2024-01-15T11:30:00",
  "updated_at": "2024-01-15T11:30:00"
}
```

### List Events
```bash
curl http://localhost:8000/api/events | jq
```

### Get Specific Event
```bash
# Use ID from events list
curl http://localhost:8000/api/events/uuid-1234 | jq
```

### Current User
```bash
curl http://localhost:8000/api/auth/me
```

Response:
```json
{
  "user_id": "test-user-123",
  "email": "test@example.com",
  "display_name": "Test User"
}
```

### Save Event
```bash
curl -X POST http://localhost:8000/api/users/saved-events/uuid-1234
```

Response:
```json
{
  "status": "saved",
  "event_id": "uuid-1234",
  "saved_at": "2024-01-15T11:30:00"
}
```

### Get Saved Events
```bash
curl http://localhost:8000/api/users/saved-events | jq
```

### Remove Saved Event
```bash
curl -X DELETE http://localhost:8000/api/users/saved-events/uuid-1234
```

Response:
```json
{
  "status": "removed",
  "event_id": "uuid-1234"
}
```

## Configuration Examples

### Using Mock Data (Default)
```bash
# In .env
USE_MOCK_DATA=true
USE_MOCK_AUTH=true
```

- No API keys needed
- Instant responses
- Good for testing/demo

### Using Real APIs
```bash
# In .env
USE_MOCK_DATA=false
USE_MOCK_AUTH=false

NEWS_API_KEY=your_key...
OPENAI_API_KEY=sk-...
MAPS_API_KEY=AIza...
```

1. Get API keys:
   - News API: https://newsapi.org
   - OpenAI: https://platform.openai.com
   - Google Maps: https://cloud.google.com

2. Add to .env and restart server

## Performance Testing

### Measure Event Generation Speed
```bash
# With mock data (should be instant)
time python cli.py generate

# With real APIs (should be 5-10 seconds)
# Set USE_MOCK_DATA=false and add real API keys
time python cli.py generate
```

### Test High Volume
```bash
# Generate 10 events
curl -X POST http://localhost:8000/api/events/generate?limit=10

# Monitor response time in browser console or with time command
time curl -X POST http://localhost:8000/api/events/generate?limit=5
```

## Error Scenarios & Recovery

### Scenario: Backend Not Running
```bash
python cli.py health
# Error: Backend not running
# Fix: python main.py
```

### Scenario: Missing API Keys
```bash
# With USE_MOCK_DATA=false and no keys
python cli.py generate
# Falls back to mock data automatically
# Check logs for warnings
```

### Scenario: API Rate Limit
```bash
# News API rate limited
# Backend gracefully returns mock data
# Check logs: "News API error"
```

### Scenario: Invalid Event ID
```bash
python cli.py event invalid-id
# Error: Event not found
# Fix: List events first, use valid ID
```

## Using with Frontend

### From React/Frontend:

```javascript
// Fetch trends
const news = await fetch('http://localhost:8000/api/news/trending')
  .then(r => r.json());

// Generate events
const events = await fetch('http://localhost:8000/api/events/generate', 
  { method: 'POST' })
  .then(r => r.json());

// Get events for map
const allEvents = await fetch('http://localhost:8000/api/events')
  .then(r => r.json());

// Render on map
events.forEach(event => {
  // event.location.latitude / longitude ready for mapping
  // event.ai_analysis has summaries and categories
});
```

### Enable CORS for Frontend
```bash
# In .env
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

## Debugging Tips

### See Detailed Logs
```bash
# In .env
DEBUG=true

# Run with logging
python main.py
```

### Check Environment
```bash
# See what env vars are loaded
python -c "from config import config; print(config.__dict__)"
```

### Test Individual Services
```bash
# In Python shell
python
>>> from services.news_service import news_service
>>> articles = news_service.fetch_trending_news()
>>> print(f"Got {len(articles)} articles")
```

### Inspect Event Structure
```bash
python
>>> from services.event_service import event_service
>>> from services.news_service import news_service
>>> articles = news_service.fetch_trending_news()[:1]
>>> event = event_service.create_event_from_articles(articles)
>>> import json
>>> print(json.dumps(event.dict(), indent=2, default=str))
```

## Next Integration Steps

1. ✅ Backend running and tested locally
2. Start frontend (React)
3. Connect frontend to `http://localhost:8000`
4. Test event display on map
5. Test save/load user data
6. Add real API keys
7. Deploy backend to cloud

## Support

- Logs: Check server output for errors
- CLI: Use `python cli.py` commands to isolate issues
- Dashboard: Open `http://localhost:8000/test` for interactive testing
- Models: Check `models.py` for expected data formats
- Services: Each service is isolated and testable

Good luck! 🚀

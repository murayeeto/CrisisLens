# CrisisLens Backend - Setup & Deployment Guide

## System Requirements
- Python 3.8+
- pip (Python package manager)
- ~100MB disk space

## Installation Steps

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

**Expected packages installed:**
- fastapi - Web framework
- uvicorn - ASGI server
- pydantic - Data validation
- requests - HTTP client
- httpx - Async HTTP
- openai - OpenAI API client
- python-dotenv - Environment variables

### 2. Configure Environment Variables
```bash
cp ../.env.example .env
```

Edit `.env` and add your API keys (or leave empty to use mock data):
```
NEWS_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
MAPS_API_KEY=your_key_here
```

### 3. Start the Server
```bash
python main.py
# OR
uvicorn main:app --reload --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

## Testing the Backend

### Option A: Web Dashboard (Easiest)
1. Server running at `http://localhost:8000`
2. Open browser: `http://localhost:8000/test`
3. Click buttons to test features

### Option B: CLI Script
```bash
# Check backend is running
python cli.py health

# Fetch trending news
python cli.py trending

# Generate events from news
python cli.py generate

# List all events
python cli.py events

# Get specific event
python cli.py event <event_id_from_above>

# Check user auth
python cli.py auth

# Save an event
python cli.py save <event_id>

# List saved events
python cli.py saved
```

### Option C: Command Line (curl)
```bash
# Health check
curl http://localhost:8000/health

# Trending news
curl http://localhost:8000/api/news/trending | jq

# Generate events (takes 10-30 seconds with real APIs)
curl -X POST http://localhost:8000/api/events/generate?limit=2

# List events
curl http://localhost:8000/api/events | jq

# Get specific event
curl http://localhost:8000/api/events/{event_id} | jq
```

## API Endpoints Reference

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/health` | Health check |
| GET | `/api/news/trending` | Get trending news |
| GET | `/api/events` | List all events |
| GET | `/api/events/{id}` | Get event detail |
| POST | `/api/events/generate` | Generate events |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/users/saved-events` | Get saved events |
| POST | `/api/users/saved-events/{id}` | Save event |
| DELETE | `/api/users/saved-events/{id}` | Unsave event |

## Data Flow

```
News API
   ↓
news_service.fetch_trending_news()
   ↓
location_parser.extract_location_from_text()
   ↓
geocoding_service.geocode_location()
   ↓
openai_service.generate_event_analysis()
   ↓
event_service.create_event_from_articles()
   ↓
event (stored in-memory)
   ↓
API Response
```

## Sample API Responses

### GET /api/news/trending
Returns a list of recent news articles:
```json
[
  {
    "id": "article-123",
    "title": "Earthquake Strikes West Coast",
    "description": "A significant earthquake hit California...",
    "image_url": "https://...",
    "source_name": "CNN",
    "published_at": "2024-01-15T10:30:00",
    "url": "https://...",
    "content": "..."
  }
]
```

### POST /api/events/generate → Event Object
```json
[
  {
    "id": "event-uuid",
    "title": "Earthquake Strikes West Coast",
    "description": "A significant earthquake hit California...",
    "location": {
      "name": "California, USA",
      "latitude": 36.1162,
      "longitude": -119.6816,
      "country": "USA",
      "region": "California"
    },
    "source_articles": [...],
    "ai_analysis": {
      "summary": "Major earthquake in California region...",
      "category": "natural_disaster",
      "affected_groups": ["residents", "infrastructure"],
      "impact_analysis": "Widespread damage reported...",
      "how_to_help": "Donate to Red Cross...",
      "watch_guidance": "Monitor aftershocks..."
    },
    "created_at": "2024-01-15T10:30:00",
    "updated_at": "2024-01-15T10:30:00"
  }
]
```

### GET /api/auth/me
```json
{
  "user_id": "test-user-123",
  "email": "test@example.com",
  "display_name": "Test User"
}
```

## Mock Mode vs Real APIs

### Running with Mock Data (Default)
- No API keys required
- Instant responses
- Perfect for testing/demo
- Real data sources not contacted

Enable:
```
USE_MOCK_DATA=true
USE_MOCK_AUTH=true  # Also bypass auth
```

### Running with Real APIs
1. Get API keys:
   - **News API**: https://newsapi.org (free tier available)
   - **OpenAI**: https://platform.openai.com/account/api-keys
   - **Google Maps**: https://cloud.google.com/maps-platform
   
2. Add keys to `.env`:
```
NEWS_API_KEY=xyz...
OPENAI_API_KEY=sk-...
MAPS_API_KEY=AIza...
```

3. Set in `.env`:
```
USE_MOCK_DATA=false
DEBUG=false
```

## Troubleshooting

### Port 8000 Already in Use
```bash
# Find process using port 8000
lsof -i :8000

# Kill the process
kill -9 <PID>

# Or use different port
uvicorn main:app --port 8001
```

### Import Errors
```bash
# Reinstall dependencies
pip install --upgrade -r requirements.txt

# Or create fresh venv
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### API Keys Not Working
- Verify key is valid on provider's website
- Check billing is active
- Look at server logs for error details
- Try with `USE_MOCK_DATA=true` to test without keys

### Slow Response Times
- Check `USE_MOCK_DATA=false` - real APIs are slower
- OpenAI calls take 2-5 seconds
- News API takes 1-2 seconds
- Geocoding takes 0.5-1 second

## Architecture Overview

### Services (Business Logic)
- **news_service.py** - Fetches and normalizes news
- **event_service.py** - Creates events from articles
- **geocoding_service.py** - Converts locations to coordinates
- **openai_service.py** - Generates AI analysis
- **user_service.py** - Manages saved events
- **auth_service.py** - Handles authentication

### Routes (API Endpoints)
- **health.py** - Status endpoints
- **news.py** - News fetching
- **events.py** - Event operations
- **auth.py** - Authentication
- **users.py** - User data

### Utils
- **logger.py** - Logging system
- **prompts.py** - OpenAI prompt templates
- **location_parser.py** - Extract locations from text

## Performance Notes

**Single Event Generation:**
- With mock data: ~100ms
- With real APIs: 5-10 seconds (News + Geocoding + OpenAI)
- Bottleneck: OpenAI API (2-5 seconds)

**Batch Operations:**
- `/api/events/generate?limit=5` calls 5 articles sequentially
- Consider adding async processing for production

## Next Steps

1. ✅ Backend running locally
2. ⏭️ Connect to real APIs
3. ⏭️ Set up frontend to consume API
4. ⏭️ Add database for persistence
5. ⏭️ Deploy to cloud (Azure/AWS/GCP)

## Getting Help

- Check logs: Run backend with `DEBUG=true`
- Look at CLI output: `python cli.py trending` shows raw responses
- Test endpoints: Use web dashboard at `/test`
- Check models.py: See expected response formats

Good luck! 🚀

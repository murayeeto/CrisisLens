# CrisisLens Backend

Real-time crisis intelligence API for ingesting breaking news, analyzing impacts, and generating map-ready event data.

## Quick Start

### Prerequisites
- Python 3.8+
- pip

### Setup

1. **Install dependencies:**
```bash
cd backend
pip install -r requirements.txt
```

2. **Configure environment:**
```bash
cp ../.env.example .env
```

3. **Run the server:**
```bash
python main.py
# or with uvicorn
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`

## Testing

### Web Dashboard
Open your browser and go to: `http://localhost:8000/test`

### CLI Test Script
```bash
python cli.py health       # Check backend status
python cli.py trending     # Fetch trending news
python cli.py generate     # Generate events from news  
python cli.py events       # List all events
python cli.py event <id>   # Get specific event
python cli.py saved        # List saved events
python cli.py save <id>    # Save an event
python cli.py auth         # Check authentication
```

### Example curl commands

**Health check:**
```bash
curl http://localhost:8000/health
```

**Get trending news:**
```bash
curl http://localhost:8000/api/news/trending
```

**Generate events:**
```bash
curl -X POST http://localhost:8000/api/events/generate?limit=3
```

**List all events:**
```bash
curl http://localhost:8000/api/events
```

**Get specific event:**
```bash
curl http://localhost:8000/api/events/{event_id}
```

**Check authentication:**
```bash
curl http://localhost:8000/api/auth/me
```

**Get saved events:**
```bash
curl http://localhost:8000/api/users/saved-events
```

**Save an event:**
```bash
curl -X POST http://localhost:8000/api/users/saved-events/{event_id}
```

**Remove saved event:**
```bash
curl -X DELETE http://localhost:8000/api/users/saved-events/{event_id}
```

## API Routes

### Health & Status
- `GET /health` - Health check
- `GET /` - Root endpoint

### News
- `GET /api/news/trending` - Fetch trending news articles

### Events
- `GET /api/events` - List all generated events
- `GET /api/events/{event_id}` - Get a specific event
- `POST /api/events/generate?limit=N` - Generate N events from trending news

### Authentication
- `GET /api/auth/me` - Get current user (headers: Authorization: Bearer <token>)

### User Data
- `GET /api/users/saved-events` - Get user's saved events (headers: Authorization)
- `POST /api/users/saved-events/{event_id}` - Save an event
- `DELETE /api/users/saved-events/{event_id}` - Remove a saved event

## Project Structure

```
backend/
├── main.py              # FastAPI app entry point
├── config.py            # Configuration and environment variables
├── models.py            # Pydantic models
├── cli.py               # CLI test script
├── test_page.py         # HTML test dashboard
├── requirements.txt     # Python dependencies
└── services/            # Business logic services
    ├── news_service.py      # News API integration
    ├── event_service.py     # Event generation
    ├── openai_service.py    # OpenAI integration
    ├── geocoding_service.py # Location geocoding
    ├── user_service.py      # User saved events
    └── auth_service.py      # Authentication
└── routes/              # API route handlers
    ├── health.py        # Health/status endpoints
    ├── news.py          # News endpoints
    ├── events.py        # Event endpoints
    ├── auth.py          # Auth endpoints
    └── users.py         # User endpoints
└── utils/               # Utility modules
    ├── logger.py        # Logging
    ├── prompts.py       # OpenAI prompt templates
    └── location_parser.py # Location extraction
```

## Configuration

Set these environment variables in `.env`:

```
# API Keys
NEWS_API_KEY=your_news_api_key_here
OPENAI_API_KEY=your_openai_key_here
MAPS_API_KEY=your_google_maps_or_mapbox_key

# Firebase (optional for production)
FIREBASE_API_KEY=your_firebase_key

# Features
DEBUG=false
USE_MOCK_AUTH=true  # Use mock authentication
USE_MOCK_DATA=false # Use real APIs (requires keys above)
CORS_ORIGINS=*
```

### Mock Mode

The backend includes automatic fallback to mock data:
- If API keys are missing, it uses sample data
- If external APIs fail, it gracefully degrades
- Set `USE_MOCK_DATA=true` to always use mock data for testing

## API Response Examples

### Event Object
```json
{
  "id": "uuid-123",
  "title": "Earthquake Strikes West Coast",
  "description": "A 6.2 magnitude earthquake hit California early this morning...",
  "image_url": "https://...",
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
      "title": "...",
      "description": "...",
      "url": "..."
    }
  ],
  "ai_analysis": {
    "summary": "A significant earthquake struck California requiring immediate response.",
    "category": "natural_disaster",
    "affected_groups": ["residents", "workers"],
    "impact_analysis": "...",
    "how_to_help": "...",
    "watch_guidance": "..."
  },
  "created_at": "2024-01-15T10:30:00",
  "updated_at": "2024-01-15T10:30:00"
}
```

### Error Response
```json
{
  "error": "Event not found",
  "details": "No event with id xyz123"
}
```

## Development Notes

- **Modularity**: Each service handles one concern (news, geocoding, AI analysis)
- **Fallbacks**: All external APIs have graceful fallbacks to mock data
- **Logging**: All operations are logged to help with debugging
- **CORS**: Enabled for frontend integration
- **Testing**: Use the CLI script or web dashboard to test without frontend

## Next Steps

1. Add real API keys to `.env`
2. Test with `python cli.py generate`
3. Connect frontend to the API
4. Replace in-memory stores with database (Firestore/PostgreSQL)
5. Add Firebase authentication
6. Deploy to production

## Troubleshooting

**Backend not starting?**
- Check Python 3.8+ is installed
- Verify all dependencies: `pip install -r requirements.txt`
- Check port 8000 is not in use

**Mock data showing instead of real data?**
- Set `USE_MOCK_DATA=false` in `.env`
- Add valid API keys for News API, OpenAI, and Maps API
- Check logs for API errors

**Tests showing 401 Unauthorized?**
- Set `USE_MOCK_AUTH=true` to bypass auth for testing
- Or provide a valid Authorization header

**OpenAI/News API calls timing out?**
- Check your internet connection
- Verify API keys are valid
- Check rate limits on your API accounts

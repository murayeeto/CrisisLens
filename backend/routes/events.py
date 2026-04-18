from fastapi import APIRouter, HTTPException, Query
from typing import List
from models import Event
from services.event_service import event_service
from services.news_service import news_service

router = APIRouter(prefix="/api/events", tags=["events"])

@router.get("")
def list_events() -> List[Event]:
    """List all generated events."""
    return event_service.list_events()

@router.get("/{event_id}")
def get_event(event_id: str) -> Event:
    """Get a specific event by ID."""
    event = event_service.get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

@router.post("/generate")
def generate_events_from_trending(limit: int = Query(5, ge=1, le=20)) -> List[Event]:
    """
    Generate events from trending news.
    This endpoint fetches trending news and converts them into structured events.
    """
    try:
        # Fetch trending news
        articles = news_service.fetch_trending_news()
        
        if not articles:
            raise HTTPException(status_code=400, detail="No articles available")
        
        # Group articles by location and create events
        events = []
        
        # For now, create one event per article (can be grouped by location later)
        for article in articles[:limit]:
            try:
                event = event_service.create_event_from_articles([article])
                events.append(event)
            except Exception as e:
                # Skip articles that fail processing
                continue
        
        return events
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

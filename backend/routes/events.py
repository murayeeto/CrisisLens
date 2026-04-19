from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any
from models import Event
from services.event_service import event_service
from services.news_service import news_service
from services.firebase_service import FirebaseService
from utils.logger import logger
from firebase_admin import firestore

router = APIRouter(prefix="/api/events", tags=["events"])

@router.get("")
def list_events() -> List[Dict[str, Any]]:
    """List all events from Firestore."""
    try:
        logger.info("[events.list_events] Starting to fetch events")
        db = FirebaseService._db
        if not db:
            logger.info("[events.list_events] DB not initialized, initializing...")
            FirebaseService.initialize()
            db = FirebaseService._db
        
        logger.info("[events.list_events] Querying Firestore...")
        # Fetch from Firestore ordered by updatedAt descending
        query = db.collection('events').order_by('updatedAt', direction=firestore.Query.DESCENDING)
        logger.info("[events.list_events] Query created, streaming results...")
        docs = query.stream()
        
        events = []
        for doc in docs:
            try:
                event_data = doc.to_dict()
                events.append(event_data)
                logger.debug(f"[events.list_events] Added event: {event_data.get('id', 'unknown')}")
            except Exception as e:
                logger.warning(f"[events.list_events] Failed to parse event {doc.id}: {e}")
                continue
        
        logger.info(f"[events.list_events] Successfully returned {len(events)} events from Firestore")
        return events
    
    except Exception as e:
        logger.error(f"[events.list_events] Error fetching events from Firestore: {e}", exc_info=True)
        # Fallback to in-memory store if Firestore fails
        logger.warning("[events.list_events] Falling back to in-memory event store")
        try:
            return [e.model_dump() for e in event_service.list_events()]
        except Exception as fallback_err:
            logger.error(f"[events.list_events] Fallback also failed: {fallback_err}")
            return []

@router.get("/{event_id}")
def get_event(event_id: str) -> Dict[str, Any]:
    """Get a specific event by ID."""
    try:
        db = FirebaseService._db
        if not db:
            FirebaseService.initialize()
            db = FirebaseService._db
        
        doc = db.collection('events').document(event_id).get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Event not found")
        
        return doc.to_dict()
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching event {event_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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

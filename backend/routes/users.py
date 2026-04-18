from fastapi import APIRouter, HTTPException, Header
from typing import List
from models import Event
from services.user_service import user_service
from services.event_service import event_service
from services.auth_service import auth_service

router = APIRouter(prefix="/api/users", tags=["users"])

def get_user_id(authorization: str = Header(None)) -> str:
    """Extract user ID from authorization header or use mock user."""
    user = auth_service.get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return user.user_id

@router.get("/saved-events")
def get_saved_events(authorization: str = Header(None)) -> List[Event]:
    """Get user's saved events."""
    user_id = get_user_id(authorization)
    
    event_ids = user_service.get_saved_events(user_id)
    events = []
    
    for event_id in event_ids:
        event = event_service.get_event(event_id)
        if event:
            events.append(event)
    
    return events

@router.post("/saved-events/{event_id}")
def save_event(event_id: str, authorization: str = Header(None)):
    """Save an event for the user."""
    user_id = get_user_id(authorization)
    
    # Verify event exists
    event = event_service.get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Check if already saved
    if user_service.is_event_saved(user_id, event_id):
        raise HTTPException(status_code=400, detail="Event already saved")
    
    saved = user_service.save_event(user_id, event_id)
    return {"status": "saved", "event_id": event_id, "saved_at": saved.saved_at}

@router.delete("/saved-events/{event_id}")
def remove_saved_event(event_id: str, authorization: str = Header(None)):
    """Remove a saved event."""
    user_id = get_user_id(authorization)
    
    success = user_service.remove_saved_event(user_id, event_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Saved event not found")
    
    return {"status": "removed", "event_id": event_id}

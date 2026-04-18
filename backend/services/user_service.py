from datetime import datetime
from typing import List, Optional
from models import SavedEvent, Event
from utils.logger import logger

# In-memory store for saved events
_saved_events_store = {}  # Key: (user_id, event_id), Value: SavedEvent
_user_events_index = {}   # Key: user_id, Value: List[event_id]

class UserService:
    @staticmethod
    def save_event(user_id: str, event_id: str) -> SavedEvent:
        """Save event for user."""
        saved = SavedEvent(
            event_id=event_id,
            user_id=user_id,
            saved_at=datetime.now()
        )
        
        key = (user_id, event_id)
        _saved_events_store[key] = saved
        
        if user_id not in _user_events_index:
            _user_events_index[user_id] = []
        
        if event_id not in _user_events_index[user_id]:
            _user_events_index[user_id].append(event_id)
        
        logger.info(f"User {user_id} saved event {event_id}")
        return saved
    
    @staticmethod
    def get_saved_events(user_id: str) -> List[str]:
        """Get list of saved event IDs for user."""
        return _user_events_index.get(user_id, [])
    
    @staticmethod
    def is_event_saved(user_id: str, event_id: str) -> bool:
        """Check if event is saved by user."""
        key = (user_id, event_id)
        return key in _saved_events_store
    
    @staticmethod
    def remove_saved_event(user_id: str, event_id: str) -> bool:
        """Remove saved event for user."""
        key = (user_id, event_id)
        
        if key in _saved_events_store:
            del _saved_events_store[key]
            
            if user_id in _user_events_index:
                if event_id in _user_events_index[user_id]:
                    _user_events_index[user_id].remove(event_id)
            
            logger.info(f"User {user_id} removed saved event {event_id}")
            return True
        
        return False

user_service = UserService()

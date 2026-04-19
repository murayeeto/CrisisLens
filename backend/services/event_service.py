import uuid
import hashlib
from datetime import datetime
from typing import List, Optional
from models import Event, NewsArticle, Location
from services.geocoding_service import geocoding_service
from services.openai_service import openai_service
from utils.location_parser import extract_location_from_text, clean_location_name
from utils.logger import logger

# In-memory event store
_event_store = {}

class EventService:
    @staticmethod
    def create_event_from_articles(articles: List[NewsArticle]) -> Event:
        """
        Convert a list of articles into a structured event with AI analysis.
        Uses deterministic event ID based on article URL for consistent lookups.
        """
        if not articles:
            raise ValueError("At least one article is required")
        
        # Use first article as primary
        primary = articles[0]
        
        # Generate deterministic event ID from article URL
        event_id = hashlib.md5(primary.url.encode()).hexdigest()
        
        # Check if event already exists in store
        if event_id in _event_store:
            logger.info(f"Event {event_id} already exists in store")
            return _event_store[event_id]
        
        # Extract location from articles
        location_text = extract_location_from_text(
            f"{primary.title} {primary.description}"
        )
        
        if not location_text:
            location_text = extract_location_from_text(primary.content or "")
        
        location_text = clean_location_name(location_text) if location_text else "Undisclosed Location"
        
        # Geocode location
        location = geocoding_service.geocode_location(location_text)
        
        # Generate AI analysis
        articles_text = "\n".join([
            f"Title: {a.title}\nDescription: {a.description}\n"
            for a in articles[:3]  # Limit to first 3 for token efficiency
        ])
        ai_analysis = openai_service.generate_event_analysis(articles_text, location.name)
        
        # Create event
        event = Event(
            id=event_id,
            title=primary.title,
            description=primary.description or "Event detected from news sources.",
            image_url=primary.image_url,
            location=location,
            source_articles=articles,
            ai_analysis=ai_analysis,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        # Store event
        _event_store[event.id] = event
        logger.info(f"Created event: {event.id}")
        
        return event
    
    @staticmethod
    def get_event(event_id: str) -> Optional[Event]:
        """Get event by ID."""
        return _event_store.get(event_id)
    
    @staticmethod
    def list_events() -> List[Event]:
        """List all events."""
        return list(_event_store.values())
    
    @staticmethod
    def clear_events():
        """Clear all events (useful for testing)."""
        _event_store.clear()

event_service = EventService()

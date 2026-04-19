import hashlib
from datetime import datetime, timezone
from typing import List, Optional
from models import Event, NewsArticle, Location
from services.geocoding_service import geocoding_service
from services.news_service import NewsService
from services.openai_service import openai_service
from utils.location_parser import extract_location_from_text, clean_location_name
from utils.logger import logger

# In-memory event store
_event_store = {}

class EventService:
    @staticmethod
    def _parse_article_datetime(value: str) -> Optional[datetime]:
        return NewsService._parse_article_datetime(value)

    @staticmethod
    def _article_priority_score(article: NewsArticle) -> float:
        return NewsService._article_priority_score(article)

    @staticmethod
    def _canonical_event_key(primary: NewsArticle) -> str:
        return primary.event_uri or primary.event_key or primary.duplicate_of or primary.url

    @staticmethod
    def create_event_from_articles(articles: List[NewsArticle]) -> Event:
        """
        Convert a list of articles into a structured event with AI analysis.
        Uses deterministic event IDs based on grouped article metadata so that
        cross-source coverage of the same event resolves to the same record.
        Extracts location from multiple sources in articles.
        """
        if not articles:
            raise ValueError("At least one article is required")

        ranked_articles = sorted(articles, key=EventService._article_priority_score, reverse=True)

        # Use the richest article as the primary representative for the grouped event.
        primary = ranked_articles[0]

        canonical_event_key = EventService._canonical_event_key(primary)
        event_id = hashlib.md5(canonical_event_key.encode()).hexdigest()
        
        # Check if event already exists in store
        if event_id in _event_store:
            logger.info(f"Event {event_id} already exists in store")
            return _event_store[event_id]
        
        # Try to extract location from multiple article sources
        location_text = None
        
        # 1. Try title first (often contains location)
        if primary.title:
            location_text = extract_location_from_text(primary.title)
        
        # 2. If not found, try description
        if not location_text and primary.description:
            location_text = extract_location_from_text(primary.description)
        
        # 3. If still not found, try full content
        if not location_text and primary.content:
            location_text = extract_location_from_text(primary.content)
        
        # 4. Combine multiple article sources for better location detection
        if not location_text and len(articles) > 1:
            combined_text = "\n".join([
                f"{a.title}\n{a.description}\n{a.content}"
                for a in ranked_articles[:3]  # Check first 3 articles
            ])
            location_text = extract_location_from_text(combined_text)
        
        location_text = clean_location_name(location_text) if location_text else "Undisclosed Location"
        logger.info(f"Extracted location: '{location_text}'")
        
        # Geocode location
        location = geocoding_service.geocode_location(location_text)
        logger.info(f"Geocoded to: {location.name} ({location.latitude}, {location.longitude})")
        
        # Generate AI analysis
        articles_text = "\n\n".join([
            f"Title: {a.title}\nDescription: {a.description or ''}\nContent: {(a.content or '')[:800]}\n"
            for a in ranked_articles[:3]  # Limit to first 3 for token efficiency
        ])
        ai_analysis = openai_service.generate_event_analysis(articles_text, location.name)

        article_datetimes = [
            parsed_datetime
            for parsed_datetime in (EventService._parse_article_datetime(article.published_at) for article in ranked_articles)
            if parsed_datetime
        ]
        created_at = min(article_datetimes) if article_datetimes else datetime.now(timezone.utc)
        updated_at = max(article_datetimes) if article_datetimes else datetime.now(timezone.utc)
        
        # Create event
        event = Event(
            id=event_id,
            title=primary.title,
            description=primary.description or "Event detected from news sources.",
            image_url=primary.image_url,
            location=location,
            source_articles=ranked_articles,
            ai_analysis=ai_analysis,
            created_at=created_at,
            updated_at=updated_at
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

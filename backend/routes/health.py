from fastapi import APIRouter
from services.event_service import event_service
from services.news_service import news_service

router = APIRouter()

@router.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "CrisisLens Backend"}

@router.get("/")
def root():
    """Root endpoint."""
    return {"message": "CrisisLens API v1", "status": "running"}

@router.get("/test/full")
def full_test():
    """
    Full test endpoint - returns complete event data with all fields:
    - Article information
    - AI analysis (summary, category, affected groups, impacts)
    - Location with coordinates for mapping
    """
    try:
        # Fetch trending news
        articles = news_service.fetch_trending_news()
        
        if not articles:
            return {"status": "error", "message": "No articles available"}
        
        # Create a test event from the first article
        event = event_service.create_event_from_articles([articles[0]])
        
        return {
            "status": "ok",
            "test_data": {
                "article": {
                    "id": event.source_articles[0].id,
                    "title": event.source_articles[0].title,
                    "description": event.source_articles[0].description,
                    "source": event.source_articles[0].source_name,
                    "content": event.source_articles[0].content,
                    "url": event.source_articles[0].url,
                    "published_at": str(event.source_articles[0].published_at)
                },
                "event": {
                    "id": event.id,
                    "title": event.title,
                    "description": event.description
                },
                "analysis": {
                    "summary": event.ai_analysis.summary,
                    "category": event.ai_analysis.category,
                    "affected_groups": event.ai_analysis.affected_groups,
                    "impact_analysis": event.ai_analysis.impact_analysis,
                    "how_to_help": event.ai_analysis.how_to_help,
                    "watch_guidance": event.ai_analysis.watch_guidance
                },
                "location": {
                    "name": event.location.name,
                    "latitude": event.location.latitude,
                    "longitude": event.location.longitude,
                    "country": event.location.country,
                    "region": event.location.region
                }
            }
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

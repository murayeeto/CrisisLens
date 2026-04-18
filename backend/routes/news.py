from fastapi import APIRouter, HTTPException
from typing import List
from models import NewsArticle
from services.news_service import news_service

router = APIRouter(prefix="/api/news", tags=["news"])

@router.get("/trending")
def get_trending_news() -> List[NewsArticle]:
    """Fetch trending news stories."""
    try:
        articles = news_service.fetch_trending_news()
        return articles
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

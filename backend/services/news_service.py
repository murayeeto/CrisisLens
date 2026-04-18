import requests
from typing import List
from config import config
from models import NewsArticle
from utils.logger import logger
from datetime import datetime

MOCK_ARTICLES = [
    {
        "id": "mock-1",
        "title": "Earthquake Strikes West Coast",
        "description": "A 6.2 magnitude earthquake hit California early this morning, causing minor damage and power outages.",
        "image_url": "https://via.placeholder.com/400x300?text=Earthquake",
        "source_name": "CNN",
        "published_at": datetime.now().isoformat(),
        "url": "https://example.com/article1",
        "content": "A significant 6.2 magnitude earthquake struck the San Francisco Bay Area. Emergency services are responding to reports of structural damage in several neighborhoods."
    },
    {
        "id": "mock-2",
        "title": "Humanitarian Aid Reaches Flood Zone",
        "description": "International humanitarian organizations deliver emergency supplies to flood-affected regions.",
        "image_url": "https://via.placeholder.com/400x300?text=Flood",
        "source_name": "BBC",
        "published_at": datetime.now().isoformat(),
        "url": "https://example.com/article2",
        "content": "Rescue teams in the Sindh province of Pakistan are delivering aid to thousands affected by unprecedented flooding along the Indus River."
    }
]

class NewsService:
    @staticmethod
    def fetch_trending_news() -> List[NewsArticle]:
        """Fetch trending news from News API or return mock data."""
        if config.USE_MOCK_DATA or not config.NEWS_API_KEY:
            logger.warning("Using mock news data (set USE_MOCK_DATA=false and NEWS_API_KEY to use real API)")
            return [NewsArticle(**article) for article in MOCK_ARTICLES]
        
        try:
            url = "https://newsapi.org/v2/top-headlines"
            params = {
                "apiKey": config.NEWS_API_KEY,
                "sortBy": "publishedAt",
                "language": "en",
                "pageSize": 20
            }
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            articles = []
            for article in data.get("articles", []):
                normalized = NewsArticle(
                    id=article.get("url", "").split("/")[-1],
                    title=article.get("title", ""),
                    description=article.get("description", ""),
                    image_url=article.get("urlToImage", ""),
                    source_name=article.get("source", {}).get("name", "Unknown"),
                    published_at=article.get("publishedAt", ""),
                    url=article.get("url", ""),
                    content=article.get("content", "")
                )
                articles.append(normalized)
            
            logger.info(f"Fetched {len(articles)} articles from News API")
            return articles
        
        except Exception as e:
            logger.error(f"News API error: {e}. Falling back to mock data.")
            return [NewsArticle(**article) for article in MOCK_ARTICLES]

news_service = NewsService()

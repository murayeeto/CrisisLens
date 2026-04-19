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
        """Fetch trending news from newsapi.ai or return mock data."""
        if config.USE_MOCK_DATA or not config.NEWS_API_KEY:
            logger.warning("Using mock news data (set USE_MOCK_DATA=false and NEWS_API_KEY to use real API)")
            return [NewsArticle(**article) for article in MOCK_ARTICLES]
        
        try:
            # Using newsapi.ai endpoint for crisis/disaster news
            url = "https://newsapi.ai/api/v1/article/getArticles"
            params = {
                "apiKey": config.NEWS_API_KEY,
                "keyword": "crisis OR disaster",  # Simpler query that returns results
                "articlesPage": 1,
                "articlesCount": 20
            }
            
            logger.info(f"Fetching trending articles from newsapi.ai with keyword: crisis OR disaster")
            response = requests.get(url, params=params, timeout=8)
            response.raise_for_status()
            data = response.json()
            
            articles = []
            # newsapi.ai returns articles in articles.results structure
            results = data.get("articles", {}).get("results", [])
            logger.info(f"API returned {len(results)} results")
            
            for article in results:
                try:
                    normalized = NewsArticle(
                        id=article.get("uri", ""),
                        title=article.get("title", ""),
                        description=article.get("body", "")[:500] if article.get("body") else "",  # Truncate body
                        image_url=article.get("image", ""),
                        source_name=article.get("source", {}).get("title", "Unknown") if isinstance(article.get("source"), dict) else "Unknown",
                        published_at=article.get("dateTimePub", article.get("dateTime", "")),
                        url=article.get("url", ""),
                        content=article.get("body", "")
                    )
                    articles.append(normalized)
                    logger.debug(f"Parsed article: {normalized.title[:50]}")
                except Exception as e:
                    logger.warning(f"Error parsing article: {e}")
                    continue
            
            logger.info(f"Fetched {len(articles)} articles from newsapi.ai")
            return articles
        
        except requests.Timeout:
            logger.error(f"newsapi.ai request timed out after 8 seconds. Falling back to mock data.")
            return [NewsArticle(**article) for article in MOCK_ARTICLES]
        except requests.ConnectionError as e:
            logger.error(f"newsapi.ai connection error: {e}. Falling back to mock data.")
            return [NewsArticle(**article) for article in MOCK_ARTICLES]
        except Exception as e:
            logger.error(f"newsapi.ai error: {e}. Falling back to mock data.", exc_info=True)
            return [NewsArticle(**article) for article in MOCK_ARTICLES]
        except requests.ConnectionError as e:
            logger.error(f"News API connection error: {e}. Falling back to mock data.")
            return [NewsArticle(**article) for article in MOCK_ARTICLES]
        except Exception as e:
            logger.error(f"News API error: {e}. Falling back to mock data.")
            return [NewsArticle(**article) for article in MOCK_ARTICLES]

news_service = NewsService()

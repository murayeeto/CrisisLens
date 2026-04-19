import requests
from typing import List
from config import config
from models import NewsArticle
from utils.logger import logger
from datetime import datetime, timedelta

MOCK_ARTICLES = [
    {
        "id": "mock-1",
        "title": "Earthquake Strikes West Coast",
        "description": "A 6.2 magnitude earthquake hit California early this morning, causing minor damage and power outages.",
        "image_url": "https://via.placeholder.com/400x300?text=Earthquake",
        "source_name": "CNN",
        "published_at": (datetime.now() - timedelta(hours=2)).isoformat(),
        "url": "https://example.com/article1",
        "content": "A significant 6.2 magnitude earthquake struck the San Francisco Bay Area. Emergency services are responding to reports of structural damage in several neighborhoods."
    },
    {
        "id": "mock-2",
        "title": "Humanitarian Aid Reaches Flood Zone",
        "description": "International humanitarian organizations deliver emergency supplies to flood-affected regions.",
        "image_url": "https://via.placeholder.com/400x300?text=Flood",
        "source_name": "BBC",
        "published_at": (datetime.now() - timedelta(hours=4)).isoformat(),
        "url": "https://example.com/article2",
        "content": "Rescue teams in the Sindh province of Pakistan are delivering aid to thousands affected by unprecedented flooding along the Indus River."
    },
    {
        "id": "mock-3",
        "title": "Wildfire Spreads Across Australian Territory",
        "description": "Massive wildfire in Queensland, Australia forces thousands to evacuate their homes.",
        "image_url": "https://via.placeholder.com/400x300?text=Wildfire",
        "source_name": "ABC News",
        "published_at": (datetime.now() - timedelta(hours=6)).isoformat(),
        "url": "https://example.com/article3",
        "content": "More than 5,000 residents have been evacuated as a rapidly spreading wildfire threatens communities in Queensland. Fire services report the blaze covers over 50,000 acres."
    },
    {
        "id": "mock-4",
        "title": "Typhoon Warning Issued for Southeast Asia",
        "description": "Meteorological agencies issue level 4 typhoon warning for Philippines and Vietnam regions.",
        "image_url": "https://via.placeholder.com/400x300?text=Typhoon",
        "source_name": "Reuters",
        "published_at": (datetime.now() - timedelta(hours=8)).isoformat(),
        "url": "https://example.com/article4",
        "content": "A Category 4 typhoon is expected to make landfall in the Philippines within 48 hours. The government has activated emergency protocols and begun evacuation procedures."
    },
    {
        "id": "mock-5",
        "title": "Volcanic Eruption Alert in Indonesia",
        "description": "Mount Merapi shows increased seismic activity with ash column rising 2km into the air.",
        "image_url": "https://via.placeholder.com/400x300?text=Volcano",
        "source_name": "USGS",
        "published_at": (datetime.now() - timedelta(hours=12)).isoformat(),
        "url": "https://example.com/article5",
        "content": "Indonesia's Mount Merapi has increased volcanic activity. Scientists report elevated magma pressure and ash emissions. Residents within 3km radius have been advised to evacuate."
    },
    {
        "id": "mock-6",
        "title": "Tsunami Warning Lifted After Indian Ocean Earthquake",
        "description": "A 7.1 magnitude earthquake near Sumatra is followed by precautionary tsunami alert.",
        "image_url": "https://via.placeholder.com/400x300?text=Tsunami",
        "source_name": "AP News",
        "published_at": (datetime.now() - timedelta(hours=14)).isoformat(),
        "url": "https://example.com/article6",
        "content": "The Pacific Tsunami Warning Center issued and then lifted a regional tsunami warning following a strong 7.1 magnitude earthquake near the coast of Sumatra."
    },
    {
        "id": "mock-7",
        "title": "Tornado Devastates Oklahoma Farming Communities",
        "description": "Multiple tornadoes reported across Oklahoma causing significant damage to homes and infrastructure.",
        "image_url": "https://via.placeholder.com/400x300?text=Tornado",
        "source_name": "The Weather Channel",
        "published_at": (datetime.now() - timedelta(hours=16)).isoformat(),
        "url": "https://example.com/article7",
        "content": "A series of powerful tornadoes swept through northwest Oklahoma, damaging dozens of homes and destroying crops across multiple counties. One fatality reported."
    },
    {
        "id": "mock-8",
        "title": "Landslide Blocks Major Highway in Nepal",
        "description": "Heavy monsoon rains trigger landslide blocking main trade route between India and Nepal.",
        "image_url": "https://via.placeholder.com/400x300?text=Landslide",
        "source_name": "Asia Times",
        "published_at": (datetime.now() - timedelta(hours=18)).isoformat(),
        "url": "https://example.com/article8",
        "content": "The main highway between Kathmandu and India's northern border remains closed after a massive landslide triggered by three days of continuous rain."
    },
    {
        "id": "mock-9",
        "title": "Drought Crisis Threatens Horn of Africa",
        "description": "Severe drought conditions affect millions across Ethiopia, Somalia, and Kenya regions.",
        "image_url": "https://via.placeholder.com/400x300?text=Drought",
        "source_name": "UN News",
        "published_at": (datetime.now() - timedelta(hours=20)).isoformat(),
        "url": "https://example.com/article9",
        "content": "A devastating drought affecting the Horn of Africa has left millions at risk of famine. The UN warns that urgent humanitarian intervention is needed to prevent catastrophe."
    },
    {
        "id": "mock-10",
        "title": "Industrial Accident Evacuates City District",
        "description": "Chemical plant explosion in Brazil forces evacuation of nearby residential areas.",
        "image_url": "https://via.placeholder.com/400x300?text=Accident",
        "source_name": "Globo News",
        "published_at": (datetime.now() - timedelta(hours=22)).isoformat(),
        "url": "https://example.com/article10",
        "content": "An explosion at a petrochemical facility in São Paulo state has injured 15 workers and forced the evacuation of surrounding neighborhoods as a precaution."
    },
]

class NewsService:
    @staticmethod
    def fetch_trending_news() -> List[NewsArticle]:
        """Fetch trending news from newsapi.ai or return mock data."""
        if config.USE_MOCK_DATA or not config.NEWS_API_KEY:
            logger.warning("Using mock news data (set USE_MOCK_DATA=false and NEWS_API_KEY to use real API)")
            return [NewsArticle(**article) for article in MOCK_ARTICLES]
        
        try:
            # Calculate date range for last 3 days
            now = datetime.now()
            three_days_ago = now - timedelta(days=3)
            start_date = three_days_ago.strftime("%Y-%m-%d")
            end_date = now.strftime("%Y-%m-%d")
            
            # Using newsapi.ai endpoint for crisis/disaster news with multiple keywords
            url = "https://newsapi.ai/api/v1/article/getArticles"
            
            # Search for multiple crisis/disaster related keywords
            keywords = [
                "earthquake OR seismic",
                "flood OR flooding",
                "wildfire OR forest fire",
                "hurricane OR typhoon OR cyclone",
                "tsunami OR wave",
                "landslide OR mudslide",
                "tornado OR storm",
                "drought OR famine",
                "volcanic OR eruption",
                "accident OR disaster"
            ]
            
            all_articles = []
            
            # Fetch articles for each keyword
            for keyword in keywords:
                try:
                    params = {
                        "apiKey": config.NEWS_API_KEY,
                        "keyword": keyword,
                        "articlesPage": 1,
                        "articlesCount": 10,  # Fetch 10 per keyword
                        "dateStart": start_date,
                        "dateEnd": end_date
                    }
                    
                    logger.info(f"Fetching articles from newsapi.ai for keyword: {keyword} (last 3 days)")
                    response = requests.get(url, params=params, timeout=8)
                    response.raise_for_status()
                    data = response.json()
                    
                    # newsapi.ai returns articles in articles.results structure
                    results = data.get("articles", {}).get("results", [])
                    logger.info(f"API returned {len(results)} results for '{keyword}'")
                    
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
                            
                            # Check if article already exists (by URL) to avoid duplicates
                            if not any(a.url == normalized.url for a in all_articles):
                                all_articles.append(normalized)
                                logger.debug(f"Parsed article: {normalized.title[:50]}")
                        except Exception as e:
                            logger.warning(f"Error parsing article: {e}")
                            continue
                except Exception as e:
                    logger.warning(f"Error fetching articles for keyword '{keyword}': {e}")
                    continue
            
            logger.info(f"Fetched total {len(all_articles)} unique articles from newsapi.ai (last 3 days)")
            return all_articles
        
        except requests.Timeout:
            logger.error(f"newsapi.ai request timed out after 8 seconds. Falling back to mock data.")
            return [NewsArticle(**article) for article in MOCK_ARTICLES]
        except requests.ConnectionError as e:
            logger.error(f"newsapi.ai connection error: {e}. Falling back to mock data.")
            return [NewsArticle(**article) for article in MOCK_ARTICLES]
        except Exception as e:
            logger.error(f"newsapi.ai error: {e}. Falling back to mock data.", exc_info=True)
            return [NewsArticle(**article) for article in MOCK_ARTICLES]

news_service = NewsService()

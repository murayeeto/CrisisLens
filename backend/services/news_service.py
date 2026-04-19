import requests
from typing import List
from config import config
from models import NewsArticle
from utils.logger import logger
from datetime import datetime, timedelta

MOCK_ARTICLES = [
    {
        "id": "mock-1",
        "title": "Earthquake Strikes California Bay Area - 6.2 Magnitude",
        "description": "A 6.2 magnitude earthquake hit the San Francisco Bay Area early this morning, causing minor damage and power outages affecting 50,000 residents.",
        "image_url": "https://via.placeholder.com/400x300?text=Earthquake",
        "source_name": "CNN",
        "published_at": (datetime.now() - timedelta(hours=2)).isoformat(),
        "url": "https://example.com/article1",
        "content": "A significant 6.2 magnitude earthquake struck the San Francisco Bay Area at 4:15 AM local time. Emergency services are responding to reports of structural damage in several neighborhoods. The USGS reports the epicenter was near Oakland, California at coordinates 37.8044, -122.2712. Minor injuries reported."
    },
    {
        "id": "mock-2",
        "title": "Devastating Floods Hit Pakistan - Thousands Evacuated",
        "description": "International humanitarian organizations mobilize as unprecedented monsoon flooding affects Sindh province, displacing over 20,000 families.",
        "image_url": "https://via.placeholder.com/400x300?text=Flood",
        "source_name": "BBC",
        "published_at": (datetime.now() - timedelta(hours=4)).isoformat(),
        "url": "https://example.com/article2",
        "content": "Rescue teams in Sindh province, Pakistan (coordinates 24.9056, 67.0822) are conducting emergency operations as catastrophic flooding along the Indus River threatens thousands of communities. Water levels reaching record highs. International aid coordinating from Karachi."
    },
    {
        "id": "mock-3",
        "title": "Massive Wildfire Threatens Queensland Australia - Evacuation Order",
        "description": "More than 12,000 residents evacuated as rapidly spreading wildfire engulfs 75,000 acres in Queensland bushland.",
        "image_url": "https://via.placeholder.com/400x300?text=Wildfire",
        "source_name": "ABC News",
        "published_at": (datetime.now() - timedelta(hours=6)).isoformat(),
        "url": "https://example.com/article3",
        "content": "A major bushfire near Brisbane, Queensland (-27.4698, 153.0251) has forced evacuation orders affecting over 12,000 residents. The fire has spread across more than 75,000 acres in just 48 hours. Air quality warnings issued for broader region."
    },
    {
        "id": "mock-4",
        "title": "Typhoon Warning Level 4 - Philippines Braces for Impact",
        "description": "Meteorological agencies issue highest typhoon alert as Category 4 system approaches Manila directly, evacuation procedures activated.",
        "image_url": "https://via.placeholder.com/400x300?text=Typhoon",
        "source_name": "Reuters",
        "published_at": (datetime.now() - timedelta(hours=8)).isoformat(),
        "url": "https://example.com/article4",
        "content": "A Category 4 typhoon is expected to make direct landfall near Manila, Philippines (14.5995, 120.9842) within 24 hours. The government has activated maximum emergency protocols. Estimated 500,000+ residents in potential impact zone. Landslide warnings active."
    },
    {
        "id": "mock-5",
        "title": "Mount Merapi Volcanic Eruption Alert - Indonesia Issues Evacuation",
        "description": "Indonesia's most active volcano shows increased seismic activity with ash column rising 3.5km, forcing evacuation of villages within 5km radius.",
        "image_url": "https://via.placeholder.com/400x300?text=Volcano",
        "source_name": "USGS",
        "published_at": (datetime.now() - timedelta(hours=12)).isoformat(),
        "url": "https://example.com/article5",
        "content": "Mount Merapi in Central Java, Indonesia (7.5426, 110.4420) shows critical volcanic activity. Ash emissions reaching 3,500 meters altitude. Evacuations ongoing for 40 villages. USGS alert level at maximum. Latest seismic data indicates magma movement."
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
        "title": "Powerful Tornado Strikes Oklahoma - Multiple Communities Affected",
        "description": "Devastating EF4 tornado tears through Norman, Oklahoma, destroying homes and causing power outages affecting 100,000+ residents.",
        "image_url": "https://via.placeholder.com/400x300?text=Tornado",
        "source_name": "The Weather Channel",
        "published_at": (datetime.now() - timedelta(hours=16)).isoformat(),
        "url": "https://example.com/article7",
        "content": "A powerful EF4 tornado swept through Norman, Oklahoma (35.3395, -97.4867) at 4:30 PM, destroying entire neighborhoods and leaving widespread damage. The National Weather Service reports sustained winds exceeding 170 mph. Multiple fatalities reported."
    },
    {
        "id": "mock-8",
        "title": "Major Landslide Closes Nepal-India Highway - Hundreds Stranded",
        "description": "Monsoon rains trigger massive landslide on critical trade route, cutting off supply lines for thousands.",
        "image_url": "https://via.placeholder.com/400x300?text=Landslide",
        "source_name": "Asia Times",
        "published_at": (datetime.now() - timedelta(hours=18)).isoformat(),
        "url": "https://example.com/article8",
        "content": "A massive landslide near Kathmandu, Nepal (27.7172, 85.3240) has completely blocked the main highway connecting to India. Hundreds of vehicles stranded. Continuous rain forecast for next 72 hours increases avalanche risk."
    },
    {
        "id": "mock-9",
        "title": "Severe Drought Crisis in Horn of Africa - Humanitarian Emergency",
        "description": "Worst drought in 40 years threatens 20 million people across Ethiopia, Somalia, and Kenya with famine.",
        "image_url": "https://via.placeholder.com/400x300?text=Drought",
        "source_name": "UN News",
        "published_at": (datetime.now() - timedelta(hours=20)).isoformat(),
        "url": "https://example.com/article9",
        "content": "A severe drought affecting the Horn of Africa from Ethiopia (9.1450, 40.4897) through Somalia and Kenya has left 20 million people at critical risk. The UN warns this is the worst drought in 40 years. Urgent humanitarian intervention needed."
    },
    {
        "id": "mock-10",
        "title": "Chemical Plant Explosion in Brazil - Industrial Disaster",
        "description": "Major explosion at petrochemical facility in São Paulo causes casualties and forces mass evacuation of surrounding neighborhoods.",
        "image_url": "https://via.placeholder.com/400x300?text=Accident",
        "source_name": "Globo News",
        "published_at": (datetime.now() - timedelta(hours=22)).isoformat(),
        "url": "https://example.com/article10",
        "content": "A catastrophic explosion at a petrochemical facility in Cubatão, São Paulo (-23.8844, -46.4228) has resulted in 15 confirmed fatalities and injuries to dozens of workers. Evacuation orders issued for all residents within 5km radius. Toxic chemical plume detected."
    },
]

class NewsService:
    @staticmethod
    def _is_quality_article(article: NewsArticle) -> bool:
        """
        Check if article has good content quality.
        Filters out articles with severe title/description mismatches.
        """
        if not article.title or not article.description:
            return False
        
        title_lower = article.title.lower()
        desc_lower = article.description.lower()
        
        # Severe mismatch detection: title mentions one thing, description mentions something completely different
        # E.g., "Golfer" in title but "Rugby League" in description
        sports_types = {
            'golf': ['pga', 'golfer', 'golf tour', 'hole'],
            'rugby': ['rugby league', 'rugby union', 'dragons', 'flanagan'],
            'soccer': ['football', 'soccer', 'premier league'],
            'basketball': ['basketball', 'nba'],
        }
        
        # Check for sport type mismatches
        for sport1, keywords1 in sports_types.items():
            if any(kw in title_lower for kw in keywords1):
                # Title is about this sport
                for sport2, keywords2 in sports_types.items():
                    if sport1 != sport2 and any(kw in desc_lower for kw in keywords2):
                        # Description is about a different sport - MISMATCH
                        logger.warning(f"Skipping article: '{sport1}' title but '{sport2}' description")
                        return False
        
        # Check for Cyrillic-only articles (hard to parse locations)
        cyrillic_chars = sum(1 for c in desc_lower if ord(c) > 0x0400 and ord(c) <= 0x04FF)
        if len(desc_lower) > 20 and cyrillic_chars > len(desc_lower) * 0.7:
            # More than 70% Cyrillic text - likely Russian/Ukrainian with no English locations
            logger.warning(f"Skipping Cyrillic-heavy article: {article.title[:50]}")
            return False
        
        return True
    
    @staticmethod
    def fetch_trending_news() -> List[NewsArticle]:
        """Fetch trending news from newsapi.ai - ALWAYS use real API data, never mock."""
        
        # Always try real API - don't use mock data
        try:
            # Calculate date range for last 3 days
            now = datetime.now()
            three_days_ago = now - timedelta(days=3)
            start_date = three_days_ago.strftime("%Y-%m-%d")
            end_date = now.strftime("%Y-%m-%d")
            
            # Using newsapi.ai endpoint for any news articles (regardless of crisis)
            # We'll extract real location from any article
            url = "https://newsapi.ai/api/v1/article/getArticles"
            
            # Broad search terms to get diverse articles with real locations
            keywords = [
                "earthquake",
                "flood", 
                "wildfire",
                "hurricane",
                "tsunami",
                "landslide",
                "tornado",
                "drought",
                "volcanic",
                "accident",
                "disaster",
                "storm",
                "weather",
                "earthquake",
                "fire",
                "emergency",
                "alert",
                "warning",
                "crisis",
                "incident"
            ]
            
            all_articles = []
            
            # Fetch articles for each keyword
            for keyword in keywords:
                if len(all_articles) >= 20:
                    break  # Stop once we have 20
                
                try:
                    params = {
                        "apiKey": config.NEWS_API_KEY,
                        "keyword": keyword,
                        "articlesPage": 1,
                        "articlesCount": 10,  # Fetch 10 per keyword
                        "dateStart": start_date,
                        "dateEnd": end_date
                    }
                    
                    logger.info(f"Fetching articles from newsapi.ai for keyword: {keyword}")
                    response = requests.get(url, params=params, timeout=8)
                    response.raise_for_status()
                    data = response.json()
                    
                    # newsapi.ai returns articles in articles.results structure
                    results = data.get("articles", {}).get("results", [])
                    logger.info(f"API returned {len(results)} results for '{keyword}'")
                    
                    for article in results:
                        if len(all_articles) >= 20:
                            break
                            
                        try:
                            normalized = NewsArticle(
                                id=article.get("uri", ""),
                                title=article.get("title", ""),
                                description=article.get("body", "")[:500] if article.get("body") else "",
                                image_url=article.get("image", ""),
                                source_name=article.get("source", {}).get("title", "Unknown") if isinstance(article.get("source"), dict) else "Unknown",
                                published_at=article.get("dateTimePub", article.get("dateTime", "")),
                                url=article.get("url", ""),
                                content=article.get("body", "")
                            )
                            
                            # Check if article already exists (by URL or title) to avoid duplicates
                            is_duplicate = any(
                                a.url == normalized.url or 
                                (a.title.lower() == normalized.title.lower() and a.title)  # Check title if both exist
                                for a in all_articles
                            )
                            
                            # Check for content quality - skip articles with severe mismatches
                            # (e.g., golf title with rugby description)
                            if not is_duplicate and NewsService._is_quality_article(normalized):
                                all_articles.append(normalized)
                                logger.info(f"✓ Added article: {normalized.title[:60]}")
                            else:
                                if is_duplicate:
                                    logger.info(f"⊘ Skipped duplicate: {normalized.title[:60]}")
                                else:
                                    logger.info(f"⊘ Skipped low-quality: {normalized.title[:60]} (mismatched content)")
                        except Exception as e:
                            logger.warning(f"Error parsing article: {e}")
                            continue
                except Exception as e:
                    logger.warning(f"Error fetching articles for keyword '{keyword}': {e}")
                    continue
            
            if all_articles:
                logger.info(f"✓ Successfully fetched {len(all_articles)} real articles from newsapi.ai")
                return all_articles
            else:
                raise Exception("No articles found from API")
            
        except requests.Timeout:
            logger.error(f"newsapi.ai request timed out. Retrying...")
            raise
        except requests.ConnectionError as e:
            logger.error(f"newsapi.ai connection error: {e}")
            raise
        except Exception as e:
            logger.error(f"newsapi.ai error: {e}", exc_info=True)
            raise

news_service = NewsService()

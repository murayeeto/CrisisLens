import hashlib
import time
import requests
from typing import Dict, List, Optional, Set
import re
from config import config
from models import NewsArticle
from utils.logger import logger
from datetime import datetime, timedelta, timezone
from utils.location_parser import clean_location_name, extract_location_from_text

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
    API_URL = "https://newsapi.ai/api/v1/article/getArticles"
    CRISIS_KEYWORDS = [
        "earthquake", "flood", "flooding", "wildfire", "hurricane", "typhoon", "tsunami",
        "landslide", "tornado", "drought", "volcanic", "eruption", "storm", "fire",
        "evacuation", "explosion", "disaster", "rescue", "outage", "aftershock", "monsoon",
        "conflict", "attack", "shelling", "airstrike", "strike", "protest", "riot", "unrest",
        "outbreak", "epidemic", "famine", "displaced", "blackout", "derailment", "collapse",
    ]
    FOLLOW_UP_KEYWORDS = [
        "hearing", "court", "lawsuit", "investigation", "lawmakers", "visit", "recovery",
        "response", "aid", "rebuild", "inspection", "memorial",
    ]
    NON_CRISIS_TOPICS = {
        "sports": ["golf", "rugby", "premier league", "nba", "mlb", "nfl", "tennis", "soccer"],
        "entertainment": ["box office", "celebrity", "album", "movie", "tv series", "festival"],
        "finance": ["earnings", "stock market", "crypto", "nasdaq", "dow jones", "dividend"],
    }
    TITLE_DEDUPE_STOPWORDS = {
        "the", "and", "for", "with", "that", "from", "this", "after", "into", "over", "amid",
        "breaking", "live", "update", "updates", "reported", "report", "reports", "officials",
        "emergency", "disaster", "storm", "fire", "crisis", "news", "latest",
    }
    KEYWORD_BATCHES = [
        ["earthquake", "aftershock", "tsunami", "seismic", "volcanic", "eruption"],
        ["flood", "monsoon", "storm", "hurricane", "typhoon", "cyclone", "wildfire", "drought", "tornado", "landslide"],
        ["conflict", "attack", "shelling", "airstrike", "war", "military", "riot", "protest", "strike", "unrest"],
        ["explosion", "derailment", "collapse", "outage", "blackout", "evacuation", "rescue", "accident"],
        ["outbreak", "epidemic", "famine", "displaced", "humanitarian", "aid", "refugees", "shortage"],
    ]

    @staticmethod
    def _tokenize(text: str) -> Set[str]:
        return {
            token
            for token in re.findall(r"[a-zA-Z][a-zA-Z'-]+", (text or "").lower())
            if len(token) > 2 and token not in {"the", "and", "for", "with", "that", "from", "this", "after", "into", "over"}
        }

    @staticmethod
    def _parse_boolish(value):
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            lowered = value.strip().lower()
            if lowered in {"true", "1", "yes"}:
                return True
            if lowered in {"false", "0", "no"}:
                return False
        return None

    @staticmethod
    def _extract_labels(items) -> List[str]:
        labels: List[str] = []
        for item in items or []:
            if isinstance(item, str):
                labels.append(item)
                continue

            if not isinstance(item, dict):
                continue

            label = item.get("label")
            if isinstance(label, dict):
                label = label.get("eng") or next((value for value in label.values() if value), None)

            label = label or item.get("labelEng") or item.get("uri")
            if label:
                labels.append(str(label))

        deduped: List[str] = []
        seen = set()
        for label in labels:
            normalized = label.strip()
            if not normalized:
                continue
            lowered = normalized.lower()
            if lowered in seen:
                continue
            seen.add(lowered)
            deduped.append(normalized)
        return deduped[:12]

    @staticmethod
    def _normalized_title_signature(title: str) -> str:
        tokens = [
            token
            for token in re.findall(r"[a-zA-Z][a-zA-Z'-]+", (title or "").lower())
            if len(token) > 2 and token not in NewsService.TITLE_DEDUPE_STOPWORDS
        ]
        if not tokens:
            fallback = (title or "untitled").strip().lower()
            return hashlib.md5(fallback.encode()).hexdigest()
        return "-".join(sorted(set(tokens))[:12])

    @staticmethod
    def _location_hint(article: NewsArticle) -> str:
        raw_location = extract_location_from_text(
            "\n".join(part for part in [article.title, article.description or "", article.content or ""] if part)
        )
        cleaned = clean_location_name(raw_location) if raw_location else ""
        lowered = cleaned.lower()
        if lowered in {"", "unknown", "undisclosed location"}:
            return ""
        return lowered

    @staticmethod
    def _build_event_key(article: NewsArticle) -> str:
        if article.event_uri:
            return f"event:{article.event_uri}"
        if article.duplicate_of:
            return f"duplicate:{article.duplicate_of}"

        location_hint = NewsService._location_hint(article)
        title_signature = NewsService._normalized_title_signature(article.title)
        if location_hint:
            return f"title:{location_hint}|{title_signature}"
        return f"title:{title_signature}"

    @staticmethod
    def _parse_article_datetime(value: str) -> Optional[datetime]:
        if not value:
            return None

        try:
            parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return None

        if parsed.tzinfo is None:
            return parsed.replace(tzinfo=timezone.utc)
        return parsed.astimezone(timezone.utc)

    @staticmethod
    def _coerce_utc_datetime(value: Optional[datetime]) -> Optional[datetime]:
        if value is None:
            return None
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc)

    @staticmethod
    def _article_recency_score(article: NewsArticle, now: Optional[datetime] = None) -> float:
        published_at = NewsService._parse_article_datetime(article.published_at)
        if not published_at:
            return 0

        comparison_now = NewsService._coerce_utc_datetime(now) or datetime.now(timezone.utc)
        age_hours = max((comparison_now - published_at).total_seconds() / 3600, 0)

        if age_hours <= 24:
            return 6000
        if age_hours <= 72:
            return 4500
        if age_hours <= config.NEWS_PRIORITY_WINDOW_DAYS * 24:
            return 3000
        if age_hours <= 14 * 24:
            return 1500
        if age_hours <= config.NEWS_RECENT_WINDOW_DAYS * 24:
            return 500
        return 0

    @staticmethod
    def _article_priority_score(article: NewsArticle, now: Optional[datetime] = None) -> float:
        content_length = min(len(article.content or ""), 1200)
        description_length = min(len(article.description or ""), 300)
        social_score = float(article.social_score or 0)
        duplicate_penalty = -500 if article.is_duplicate else 0
        image_bonus = 120 if article.image_url else 0
        recency_bonus = NewsService._article_recency_score(article, now=now)
        return content_length + description_length + social_score + image_bonus + duplicate_penalty + recency_bonus

    @staticmethod
    def _normalize_article(article) -> Optional[NewsArticle]:
        if not isinstance(article, dict):
            return None

        title = (article.get("title") or "").strip()
        url = (article.get("url") or "").strip()
        if not title or not url:
            return None

        source = article.get("source") if isinstance(article.get("source"), dict) else {}
        event_payload = article.get("event") if isinstance(article.get("event"), dict) else {}
        published_at = article.get("dateTimePub") or article.get("dateTime") or ""
        body = article.get("body") or ""
        duplicate_of = (
            article.get("duplicateArticleUri")
            or article.get("duplicateUri")
            or article.get("originalArticleUri")
            or article.get("originalUri")
        )

        normalized = NewsArticle(
            id=article.get("uri") or url,
            title=title,
            description=body[:500] if body else (article.get("summary") or article.get("snippet") or ""),
            image_url=article.get("image", ""),
            source_name=(source.get("title") or source.get("uri") or "Unknown").strip(),
            source_uri=source.get("uri"),
            published_at=published_at,
            url=url,
            content=body,
            language=article.get("lang"),
            event_uri=article.get("eventUri") or event_payload.get("uri"),
            duplicate_of=duplicate_of,
            is_duplicate=NewsService._parse_boolish(article.get("isDuplicate")),
            social_score=article.get("socialScore"),
            categories=NewsService._extract_labels(article.get("categories")),
            concepts=NewsService._extract_labels(article.get("concepts")),
        )
        normalized.event_key = NewsService._build_event_key(normalized)
        return normalized

    @staticmethod
    def _request_articles_page(session: requests.Session, keyword_batch: List[str], page: int, start_date: str, end_date: str, page_size: int):
        params = {
            "apiKey": config.NEWS_API_KEY,
            "resultType": "articles",
            "keyword": keyword_batch,
            "keywordOper": "or",
            "articlesPage": page,
            "articlesCount": page_size,
            "articlesSortBy": "date",
            "dateStart": start_date,
            "dateEnd": end_date,
            "includeArticleConcepts": True,
            "includeArticleCategories": True,
            "includeArticleSocialScore": True,
        }

        for attempt in range(config.NEWS_MAX_RETRIES):
            try:
                response = session.get(NewsService.API_URL, params=params, timeout=12)
                if response.status_code in {429, 500, 502, 503, 504}:
                    if attempt == config.NEWS_MAX_RETRIES - 1:
                        response.raise_for_status()
                    backoff = config.NEWS_BACKOFF_SECONDS * (2 ** attempt)
                    logger.warning(
                        f"newsapi.ai returned {response.status_code} for batch {keyword_batch} page {page}; retrying in {backoff:.2f}s"
                    )
                    time.sleep(backoff)
                    continue

                response.raise_for_status()
                payload = response.json()
                return payload.get("articles", {}).get("results", [])
            except (requests.Timeout, requests.ConnectionError) as exc:
                if attempt == config.NEWS_MAX_RETRIES - 1:
                    raise
                backoff = config.NEWS_BACKOFF_SECONDS * (2 ** attempt)
                logger.warning(
                    f"Transient fetch error for batch {keyword_batch} page {page}: {exc}. Retrying in {backoff:.2f}s"
                )
                time.sleep(backoff)

        return []

    @staticmethod
    def _group_articles_by_event(articles: List[NewsArticle], now: Optional[datetime] = None) -> List[List[NewsArticle]]:
        grouped: Dict[str, List[NewsArticle]] = {}
        for article in articles:
            event_key = article.event_key or NewsService._build_event_key(article)
            article.event_key = event_key
            grouped.setdefault(event_key, []).append(article)

        grouped_articles = []
        for article_group in grouped.values():
            ranked_group = sorted(
                article_group,
                key=lambda article: (
                    NewsService._article_priority_score(article, now=now),
                    article.published_at or "",
                ),
                reverse=True,
            )
            grouped_articles.append(ranked_group)

        grouped_articles.sort(
            key=lambda article_group: (
                NewsService._article_priority_score(article_group[0], now=now),
                article_group[0].published_at or "",
            ),
            reverse=True,
        )
        return grouped_articles

    @staticmethod
    def fetch_trending_news_groups(limit: Optional[int] = None) -> List[List[NewsArticle]]:
        """
        Fetch crisis-relevant articles from newsapi.ai in grouped, deduplicated batches.
        We use the API's 100-item page size, batch keywords to avoid redundant calls,
        and fetch across the provider's recent-data window to keep major events visible longer.
        """
        target_count = max(1, min(limit or config.EVENT_TARGET_COUNT, config.MAX_EVENT_LIMIT))
        page_size = max(1, min(config.NEWS_PAGE_SIZE, 100))
        raw_article_target = min(config.MAX_EVENT_LIMIT * 3, max(page_size, target_count * 3))

        now = datetime.now(timezone.utc)
        priority_window_days = max(1, min(config.NEWS_PRIORITY_WINDOW_DAYS, config.NEWS_RECENT_WINDOW_DAYS))
        recent_start = now - timedelta(days=priority_window_days)
        archive_start = now - timedelta(days=config.NEWS_RECENT_WINDOW_DAYS)
        end_date = now.strftime("%Y-%m-%d")

        query_windows = [
            (recent_start.strftime("%Y-%m-%d"), end_date, "recent"),
        ]
        if config.NEWS_RECENT_WINDOW_DAYS > priority_window_days:
            archive_end = (recent_start - timedelta(days=1)).strftime("%Y-%m-%d")
            if archive_end >= archive_start.strftime("%Y-%m-%d"):
                query_windows.append((archive_start.strftime("%Y-%m-%d"), archive_end, "archive"))

        all_articles: List[NewsArticle] = []
        seen_exact_keys = set()
        session = requests.Session()

        try:
            for start_date, current_end_date, window_name in query_windows:
                if len(all_articles) >= raw_article_target:
                    break

                for keyword_batch in NewsService.KEYWORD_BATCHES:
                    if len(all_articles) >= raw_article_target:
                        break

                    for page in range(1, max(1, config.NEWS_MAX_PAGES_PER_QUERY) + 1):
                        logger.info(
                            f"Fetching newsapi.ai {window_name} batch {keyword_batch} page {page} with page size {page_size}"
                        )
                        results = NewsService._request_articles_page(
                            session,
                            keyword_batch,
                            page,
                            start_date,
                            current_end_date,
                            page_size,
                        )
                        if not results:
                            break

                        added_from_page = 0
                        for article in results:
                            if len(all_articles) >= raw_article_target:
                                break

                            normalized = NewsService._normalize_article(article)
                            if not normalized:
                                continue

                            exact_key = (normalized.url or normalized.id).strip().lower()
                            if not exact_key or exact_key in seen_exact_keys:
                                continue

                            if not NewsService._is_quality_article(normalized):
                                continue

                            seen_exact_keys.add(exact_key)
                            all_articles.append(normalized)
                            added_from_page += 1

                        if len(results) < page_size or added_from_page == 0:
                            break

            grouped_articles = NewsService._group_articles_by_event(all_articles, now=now)
            if grouped_articles:
                logger.info(
                    f"✓ Successfully fetched {len(all_articles)} raw articles and grouped them into {len(grouped_articles)} events"
                )
                return grouped_articles[:target_count]

            raise Exception("No articles found from API")
        except requests.Timeout:
            logger.error("newsapi.ai request timed out after retries")
            raise
        except requests.ConnectionError as exc:
            logger.error(f"newsapi.ai connection error: {exc}")
            raise
        except Exception as exc:
            logger.error(f"newsapi.ai error: {exc}", exc_info=True)
            raise
        finally:
            session.close()

    @staticmethod
    def fetch_trending_news(limit: Optional[int] = None) -> List[NewsArticle]:
        grouped_articles = NewsService.fetch_trending_news_groups(limit=limit)
        return [article_group[0] for article_group in grouped_articles if article_group]

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
        content_lower = (article.content or "").lower()
        combined_lower = " ".join(part for part in [title_lower, desc_lower, content_lower] if part)

        sports_types = {
            "golf": ["pga", "golfer", "golf tour", "hole"],
            "rugby": ["rugby league", "rugby union", "dragons", "flanagan"],
            "soccer": ["football", "soccer", "premier league"],
            "basketball": ["basketball", "nba"],
        }

        for sport1, keywords1 in sports_types.items():
            if any(keyword in title_lower for keyword in keywords1):
                for sport2, keywords2 in sports_types.items():
                    if sport1 != sport2 and any(keyword in desc_lower for keyword in keywords2):
                        logger.info(f"Skipping article: '{sport1}' title but '{sport2}' description")
                        return False

        if not any(keyword in combined_lower for keyword in NewsService.CRISIS_KEYWORDS):
            logger.info(f"Skipping non-crisis article with weak signal: {article.title[:70]}")
            return False

        title_tokens = NewsService._tokenize(article.title)
        body_tokens = NewsService._tokenize(f"{article.description} {article.content or ''}")
        shared_tokens = title_tokens.intersection(body_tokens)

        title_has_follow_up = any(keyword in title_lower for keyword in NewsService.FOLLOW_UP_KEYWORDS)
        body_has_crisis = any(keyword in f"{desc_lower} {content_lower}" for keyword in NewsService.CRISIS_KEYWORDS)

        if len(title_tokens) >= 4 and len(body_tokens) >= 8 and len(shared_tokens) == 0 and not (title_has_follow_up and body_has_crisis):
            logger.info(f"Skipping topic-mismatch article: {article.title[:70]}")
            return False

        for topic, keywords in NewsService.NON_CRISIS_TOPICS.items():
            if any(keyword in title_lower for keyword in keywords) and not body_has_crisis:
                logger.info(f"Skipping likely {topic} article: {article.title[:70]}")
                return False

        cyrillic_chars = sum(1 for char in desc_lower if ord(char) > 0x0400 and ord(char) <= 0x04FF)
        if len(desc_lower) > 20 and cyrillic_chars > len(desc_lower) * 0.7:
            logger.info(f"Skipping Cyrillic-heavy article: {article.title[:50]}")
            return False

        return True

news_service = NewsService()

#!/usr/bin/env python3
import sys
sys.path.insert(0, '/c/Users/Matthew/CrisisLens/backend')

from services.news_service import news_service
from config import config
from utils.logger import logger

print(f"Config - USE_MOCK_DATA: {config.USE_MOCK_DATA}")
print(f"Config - NEWS_API_KEY: {config.NEWS_API_KEY[:20]}...")

logger.info("Testing news service directly...")

try:
    articles = news_service.fetch_trending_news()
    print(f"\nGot {len(articles)} articles:")
    for i, article in enumerate(articles[:3], 1):
        print(f"\n{i}. Title: {article.title[:60]}")
        print(f"   URL: {article.url[:80]}")
        print(f"   Source: {article.source_name}")
except Exception as e:
    logger.error(f"Error: {e}", exc_info=True)
    print(f"Exception: {type(e).__name__}: {e}")

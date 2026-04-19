#!/usr/bin/env python3
import sys
sys.path.insert(0, '/c/Users/Matthew/CrisisLens/backend')

from config import config
import requests
import json

api_key = config.NEWS_API_KEY
print(f"API Key: {api_key}")

url = "https://newsapi.ai/api/v1/article/getArticles"
params = {
    "apiKey": api_key,
    "keyword": "crisis OR disaster OR emergency OR breaking",
    "articlesPage": 1,
    "articlesCount": 20,
    "dataType": ["news"],
    "sortBy": "date"
}

print(f"\nURL: {url}")
print(f"Params: {params}\n")

try:
    response = requests.get(url, params=params, timeout=8)
    print(f"Status: {response.status_code}")
    
    data = response.json()
    print(f"Response keys: {list(data.keys())}")
    
    if 'articles' in data:
        articles_wrapper = data['articles']
        print(f"Articles type: {type(articles_wrapper)}")
        
        if isinstance(articles_wrapper, dict):
            print(f"Articles wrapper keys: {list(articles_wrapper.keys())}")
            results = articles_wrapper.get('results', [])
            print(f"Results count: {len(results)}")
            if results:
                print(f"\nFirst result keys: {list(results[0].keys())}")
                print(f"First result title: {results[0].get('title', 'N/A')[:80]}")
        elif isinstance(articles_wrapper, list):
            print(f"Articles is list: {len(articles_wrapper)} items")
    else:
        print(f"Full response: {json.dumps(data, indent=2)[:1000]}")
        
except Exception as e:
    import traceback
    print(f"Error: {e}")
    traceback.print_exc()

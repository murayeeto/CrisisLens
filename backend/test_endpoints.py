#!/usr/bin/env python3
import requests
import os
import json
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("NEWS_API_KEY")
print(f"API Key: {api_key}\n")

endpoints = [
    ("https://newsapi.ai/api/v1/getArticles", {}),
    ("https://newsapi.ai/api/v1/articles", {}),
    ("https://newsapi.ai/api/v1/article/getArticles", {}),
    ("https://newsapi.ai/api/v1/article/search", {"query": "news"}),
    ("https://newsapi.ai/api/v1/search", {"query": "news"}),
]

for url, extra_params in endpoints:
    params = {"apiKey": api_key, "maxArticles": 3}
    params.update(extra_params)
    
    try:
        print(f"\nTesting: {url}")
        print(f"Params: {params}")
        response = requests.get(url, params=params, timeout=8)
        print(f"Status: {response.status_code}")
        data = response.json()
        
        if 'error' in data:
            print(f"Error: {data['error']}")
        else:
            print(f"Response keys: {list(data.keys())}")
            # Check for articles
            for key in ['articles', 'results', 'data', 'hits', 'items']:
                if key in data:
                    print(f"  Found {key}: {len(data[key])} items")
            print(f"Full response (first 500 chars): {json.dumps(data, indent=2)[:500]}")
    except Exception as e:
        print(f"Error: {type(e).__name__}: {e}")

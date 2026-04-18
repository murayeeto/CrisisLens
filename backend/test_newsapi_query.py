#!/usr/bin/env python3
import requests
import os
import json
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("NEWS_API_KEY")
print(f"API Key: {api_key}\n")

# Test different query formats for newsapi.ai
tests = [
    # Try with keyword
    {
        "url": "https://newsapi.ai/api/v1/article/getArticles",
        "params": {
            "apiKey": api_key,
            "keyword": "crisis OR disaster",
            "articlesPage": 1,
            "articlesCount": 5,
            "dataType": ["news"]
        },
        "name": "With keyword"
    },
    # Try with articleLang
    {
        "url": "https://newsapi.ai/api/v1/article/getArticles",
        "params": {
            "apiKey": api_key,
            "keyword": "*",
            "articleLang": "eng",
            "articlesPage": 1,
            "articlesCount": 5
        },
        "name": "With keyword wildcard"
    },
    # Try POST with JSON body
    {
        "url": "https://newsapi.ai/api/v1/article/getArticles",
        "params": {
            "apiKey": api_key
        },
        "data": {
            "query": {
                "keyword": "crisis",
                "articlesPage": 1,
                "articlesCount": 5
            }
        },
        "name": "POST with JSON body",
        "method": "POST"
    },
]

for test in tests:
    url = test["url"]
    params = test["params"]
    method = test.get("method", "GET")
    data = test.get("data")
    name = test["name"]
    
    try:
        print(f"\n{'='*60}")
        print(f"Test: {name}")
        print(f"Method: {method}")
        print(f"URL: {url}")
        print(f"Params: {params}")
        if data:
            print(f"Data: {json.dumps(data, indent=2)}")
        
        if method == "POST":
            response = requests.post(url, params=params, json=data, timeout=8)
        else:
            response = requests.get(url, params=params, timeout=8)
        
        print(f"Status: {response.status_code}")
        resp_data = response.json()
        
        if 'error' in resp_data:
            print(f"Error: {resp_data['error']}")
        else:
            print(f"Response keys: {list(resp_data.keys())}")
            # Check for articles
            for key in ['articles', 'results', 'data', 'hits']:
                if key in resp_data:
                    items = resp_data[key] if isinstance(resp_data[key], list) else resp_data[key].get('results', [])
                    print(f"  ✓ Found {key}: {len(items)} items")
                    if items:
                        print(f"    First item keys: {list(items[0].keys())[:5]}")
                        
    except Exception as e:
        print(f"Error: {type(e).__name__}: {e}")

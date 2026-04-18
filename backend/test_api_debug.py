#!/usr/bin/env python3
import requests
import os
import json
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("NEWS_API_KEY")
print(f"API Key: {api_key}\n")

url = "https://newsapi.ai/api/v1/getArticles"
params = {
    "apiKey": api_key,
    "sortBy": "publishedAt",
    "maxArticles": 5,
    "includeReprintedArticles": False
}

try:
    print("Testing newsapi.ai...")
    response = requests.get(url, params=params, timeout=8)
    print(f"Status Code: {response.status_code}\n")
    
    data = response.json()
    print("Full Response Structure:")
    print(json.dumps(data, indent=2)[:2000])  # Print first 2000 chars
    print("\n...")
    
    # Check different possible article keys
    print("\nChecking for articles in different keys:")
    print(f"  'articles' key exists: {'articles' in data}")
    print(f"  'results' key exists: {'results' in data}")
    print(f"  'articles' count: {len(data.get('articles', []))}")
    print(f"  'results' count: {len(data.get('results', []))}")
    
    # List top-level keys
    print(f"\nTop-level keys: {list(data.keys())}")
    
except Exception as e:
    print(f"Error: {type(e).__name__}: {e}")

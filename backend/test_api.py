#!/usr/bin/env python3
import requests
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("NEWS_API_KEY")
print(f"API Key loaded: {api_key}")
print(f"API Key length: {len(api_key) if api_key else 0}")

if api_key:
    url = "https://newsapi.ai/api/v1/getArticles"
    params = {
        "apiKey": api_key,
        "sortBy": "publishedAt",
        "maxArticles": 5,
        "includeReprintedArticles": False
    }
    
    try:
        print("\nTesting newsapi.ai...")
        response = requests.get(url, params=params, timeout=8)
        print(f"Status Code: {response.status_code}")
        data = response.json()
        
        if response.status_code == 200:
            articles = data.get('articles', [])
            print(f"\n✓ Success! Got {len(articles)} articles")
            for i, article in enumerate(articles[:3], 1):
                title = article.get('title', 'No title')[:70]
                print(f"  {i}. {title}")
        else:
            print(f"\n✗ Error: {data.get('message', 'Unknown error')}")
            print(f"Full response: {data}")
    except requests.Timeout:
        print(f"✗ Request timed out after 8 seconds")
    except requests.ConnectionError as e:
        print(f"✗ Connection error: {e}")
    except Exception as e:
        print(f"✗ Exception: {type(e).__name__}: {e}")
else:
    print("✗ No API key found!")


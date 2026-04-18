#!/usr/bin/env python3
import requests
import os
import json
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("NEWS_API_KEY")

url = "https://newsapi.ai/api/v1/article/getArticles"
params = {
    "apiKey": api_key,
    "keyword": "crisis OR disaster",
    "articlesPage": 1,
    "articlesCount": 2,
    "dataType": ["news"]
}

response = requests.get(url, params=params, timeout=8)
data = response.json()

print("Full response:")
print(json.dumps(data, indent=2)[:2000])

if 'articles' in data:
    print(f"\nArticles type: {type(data['articles'])}")
    print(f"Articles: {data['articles']}")
    
    if isinstance(data['articles'], list) and len(data['articles']) > 0:
        print("\nFirst article structure:")
        print(json.dumps(data['articles'][0], indent=2))

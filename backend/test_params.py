#!/usr/bin/env python3
import sys
sys.path.insert(0, '/c/Users/Matthew/CrisisLens/backend')

from config import config
import requests
import json

api_key = config.NEWS_API_KEY

url = "https://newsapi.ai/api/v1/article/getArticles"

# Test 1: Simple keywords without "OR"
print("Test 1: Simple keyword")
params1 = {
    "apiKey": api_key,
    "keyword": "crisis",
    "articlesPage": 1,
    "articlesCount": 5,
}
resp1 = requests.get(url, params=params1, timeout=8)
data1 = resp1.json()
results1 = data1.get('articles', {}).get('results', [])
print(f"  Results: {len(results1)} articles\n")

# Test 2: With OR
print("Test 2: With OR")
params2 = {
    "apiKey": api_key,
    "keyword": "crisis OR disaster",
    "articlesPage": 1,
    "articlesCount": 5,
}
resp2 = requests.get(url, params=params2, timeout=8)
data2 = resp2.json()
results2 = data2.get('articles', {}).get('results', [])
print(f"  Results: {len(results2)} articles\n")

# Test 3: With dataType as list (might be issue)
print("Test 3: With dataType as list")
params3 = {
    "apiKey": api_key,
    "keyword": "crisis OR disaster",
    "articlesPage": 1,
    "articlesCount": 5,
    "dataType": ["news"]
}
resp3 = requests.get(url, params=params3, timeout=8)
data3 = resp3.json()
results3 = data3.get('articles', {}).get('results', [])
print(f"  Results: {len(results3)} articles\n")

# Test 4: With dataType as string
print("Test 4: With dataType as string")
params4 = {
    "apiKey": api_key,
    "keyword": "crisis OR disaster",
    "articlesPage": 1,
    "articlesCount": 5,
    "dataType": "news"
}
resp4 = requests.get(url, params=params4, timeout=8)
data4 = resp4.json()
results4 = data4.get('articles', {}).get('results', [])
print(f"  Results: {len(results4)} articles\n")

# Test 5: With sortBy
print("Test 5: With sortBy")
params5 = {
    "apiKey": api_key,
    "keyword": "crisis OR disaster",
    "articlesPage": 1,
    "articlesCount": 5,
    "sortBy": "date"
}
resp5 = requests.get(url, params=params5, timeout=8)
data5 = resp5.json()
results5 = data5.get('articles', {}).get('results', [])
print(f"  Results: {len(results5)} articles\n")

# Show first successful result if any
for i, results in enumerate([results1, results2, results3, results4, results5], 1):
    if results:
        print(f"Test {i} SUCCESS - First article:")
        print(f"  Title: {results[0].get('title', 'N/A')[:70]}")
        print()
        break

#!/usr/bin/env python
import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Firebase
creds_path = '../crisislens-8cb5d-firebase-adminsdk-fbsvc-7f045dabe9.json'
try:
    creds = credentials.Certificate(creds_path)
    firebase_admin.initialize_app(creds)
except:
    pass  # Already initialized

db = firestore.client()

# Get events
events_ref = db.collection('events').order_by('updatedAt', direction=firestore.Query.DESCENDING).limit(20)
docs = events_ref.stream()

events = []
for doc in docs:
    data = doc.to_dict()
    events.append({
        'id': doc.id,
        'title': data.get('title', '')[:40],
        'location': data.get('location', '')[:30],
        'lat': data.get('lat'),
        'lng': data.get('lng'),
        'severity': data.get('severity')
    })

print(f'Found {len(events)} events in Firestore\n')

# Check coordinate diversity
coords_set = set()
for i, e in enumerate(events):
    lat, lng = e['lat'], e['lng']
    coords_set.add((lat, lng))
    print(f"[{i:2d}] {e['title']:40s} @ ({lat:9.4f}, {lng:10.4f}) [{e['severity']}]")

print(f'\nUnique coordinates: {len(coords_set)} out of {len(events)}')

#!/usr/bin/env python
"""Clear all events from Firestore."""
import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Firebase
creds_path = '../crisislens-8cb5d-firebase-adminsdk-fbsvc-7f045dabe9.json'
try:
    firebase_admin.initialize_app(credentials.Certificate(creds_path))
except:
    pass  # Already initialized

db = firestore.client()

# Get all events
events_ref = db.collection('events')
docs = events_ref.stream()

count = 0
for doc in docs:
    doc.reference.delete()
    count += 1
    print(f"Deleted {doc.id}")

print(f"\nCleared {count} events from Firestore")

#!/usr/bin/env python3

"""
Populate Firestore with current events from the API
Usage: python scripts/seed_firestore.py
"""

import requests
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime
import os

# Initialize Firebase with Admin SDK
cert_path = os.path.join(os.path.dirname(__file__), '..', '..', 'crisislens-8cb5d-firebase-adminsdk-fbsvc-7f045dabe9.json')
cred = credentials.Certificate(cert_path)
firebase_admin.initialize_app(cred)
db = firestore.client()

def seed_firestore():
    """Fetch events from API and add to Firestore"""
    print('[seed] Fetching events from backend API...')
    
    try:
        # Fetch events from API (increased timeout for multiple articles)
        response = requests.get('http://localhost:8000/api/events', timeout=90)
        response.raise_for_status()
        events = response.json()
        
        if not events:
            print('[seed] No events received from API')
            return False
        
        print(f'[seed] Retrieved {len(events)} events from API')
        
        # Show sample events
        if events:
            print(f'[seed] Sample event: {events[0].get("title", "N/A")[:60]}...')
            print(f'[seed] Location: {events[0].get("location", "N/A")}')
            print(f'[seed] Coordinates: ({events[0].get("lat", "?")}, {events[0].get("lng", "?")})')
        
        print('[seed] Adding events to Firestore...')
        
        # Add events to Firestore
        batch = db.batch()
        for event in events:
            event_ref = db.collection('events').document(event['id'])
            event_data = {
                **event,
                'createdAt': datetime.now(),
                'updatedAt': datetime.now(),
            }
            batch.set(event_ref, event_data)
        
        batch.commit()
        print(f'[seed] ✓ Successfully added {len(events)} events to Firestore')
        return True
        
    except requests.exceptions.RequestException as e:
        print(f'[seed] API Error: {e}')
        return False
    except Exception as e:
        print(f'[seed] Error: {e}')
        return False

if __name__ == '__main__':
    success = seed_firestore()
    exit(0 if success else 1)

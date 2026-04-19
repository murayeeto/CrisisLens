#!/usr/bin/env python
"""
Reseed Firestore with corrected event analyses.
This clears old events with incorrect summaries and regenerates them with the new mock analysis logic.
"""
import sys
import os
import time

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from services.firebase_service import FirebaseService
from utils.logger import logger

def clear_firestore():
    """Clear all events from Firestore."""
    FirebaseService.initialize()
    db = FirebaseService._db
    
    logger.info("Clearing all events from Firestore...")
    docs = db.collection('events').stream()
    count = 0
    for doc in docs:
        db.collection('events').document(doc.id).delete()
        logger.info(f"Deleted {doc.id}")
        count += 1
    
    logger.info(f"Cleared {count} events from Firestore")
    return count

def reseed_from_api():
    """Fetch fresh events from the backend API and store in Firestore."""
    import requests
    
    logger.info("Fetching fresh events from backend API...")
    try:
        response = requests.get('http://localhost:8000/api/events', timeout=90)
        response.raise_for_status()
        events = response.json()
        
        logger.info(f"Retrieved {len(events)} events from API")
        
        FirebaseService.initialize()
        db = FirebaseService._db
        
        for event in events:
            event_id = event['id']
            logger.info(f"Adding event: {event['title'][:50]}...")
            
            db.collection('events').document(event_id).set({
                'id': event_id,
                'title': event['title'],
                'description': event['description'],
                'category': event.get('category', 'other'),
                'severity': event['severity'],
                'location': event['location'],
                'lat': event['lat'],
                'lng': event['lng'],
                'previewImage': event.get('previewImage', ''),
                'aiSummary': event.get('aiSummary', event['description']),
                'affectedGroups': event.get('affectedGroups', []),
                'impactAnalysis': event.get('impactAnalysis', ''),
                'howToHelp': event.get('howToHelp', ''),
                'watchGuidance': event.get('watchGuidance', ''),
                'sources': event.get('sources', []),
                'createdAt': event.get('createdAt'),
                'updatedAt': event.get('updatedAt'),
            })
        
        logger.info(f"✓ Successfully added {len(events)} events to Firestore")
        return len(events)
    
    except Exception as e:
        logger.error(f"Error reseeding from API: {e}")
        raise

if __name__ == '__main__':
    try:
        logger.info("Starting Firestore reseed...")
        
        # Clear old events
        cleared = clear_firestore()
        time.sleep(2)
        
        # Reseed with fresh data
        added = reseed_from_api()
        
        logger.info(f"✓ Reseed complete: Cleared {cleared}, Added {added}")
    
    except Exception as e:
        logger.error(f"Reseed failed: {e}")
        sys.exit(1)

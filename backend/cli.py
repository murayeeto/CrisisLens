#!/usr/bin/env python
"""
CrisisLens CLI Test Script
Run this to test the backend without the frontend.

Usage:
    python cli.py trending       # Fetch trending news
    python cli.py generate       # Generate events from news
    python cli.py events         # List all events
    python cli.py event <id>     # Get specific event
    python cli.py save <id>      # Save event
    python cli.py saved          # List saved events
    python cli.py auth           # Check auth
"""

import sys
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

def print_json(data):
    """Pretty print JSON."""
    print(json.dumps(data, indent=2, default=str))

def cmd_health():
    """Check backend health."""
    print("[HEALTH] Checking backend health...")
    try:
        resp = requests.get(f"{BASE_URL}/health", timeout=5)
        resp.raise_for_status()
        print("[OK] Backend is running!")
        print_json(resp.json())
    except Exception as e:
        print(f"[ERROR] Backend not running: {e}")
        sys.exit(1)

def cmd_trending():
    """Fetch trending news."""
    print("[NEWS] Fetching trending news...")
    try:
        resp = requests.get(f"{BASE_URL}/api/news/trending", timeout=10)
        resp.raise_for_status()
        articles = resp.json()
        print(f"[OK] Found {len(articles)} articles\n")
        for i, art in enumerate(articles[:3], 1):
            print(f"{i}. {art['title']}")
            print(f"   Source: {art['source_name']}")
            print(f"   {art['description'][:100]}...\n")
    except Exception as e:
        print(f"[ERROR] Error: {e}")
        sys.exit(1)

def cmd_generate():
    """Generate events from trending news."""
    print("[PROCESS] Generating events from trending news...")
    try:
        resp = requests.post(f"{BASE_URL}/api/events/generate?limit=3", timeout=30)
        resp.raise_for_status()
        events = resp.json()
        print(f"[OK] Generated {len(events)} events\n")
        for event in events:
            print(f"Event: {event['title']}")
            print(f"Description: {event['description']}")
            print(f"Location: {event['location']['name']} ({event['location']['latitude']}, {event['location']['longitude']})")
            print(f"Category: {event['ai_analysis']['category']}")
            print(f"Summary: {event['ai_analysis']['summary']}")
            print(f"Affected Groups: {', '.join(event['ai_analysis']['affected_groups'])}")
            print(f"Impact Analysis: {event['ai_analysis']['impact_analysis']}")
            print(f"How to Help: {event['ai_analysis']['how_to_help']}")
            print(f"Watch Guidance: {event['ai_analysis']['watch_guidance']}\n")
    except Exception as e:
        print(f"[ERROR] Error: {e}")
        sys.exit(1)

def cmd_events():
    """List all events."""
    print("[EVENTS] Listing all events...")
    try:
        resp = requests.get(f"{BASE_URL}/api/events", timeout=10)
        resp.raise_for_status()
        events = resp.json()
        print(f"[OK] Found {len(events)} events\n")
        for event in events:
            print(f"ID: {event['id']}")
            print(f"Title: {event['title']}")
            print(f"Location: {event['location']['name']}")
            print()
    except Exception as e:
        print(f"[ERROR] Error: {e}")
        sys.exit(1)

def cmd_event(event_id):
    """Get specific event."""
    print(f"[EVENT] Getting event {event_id}...")
    try:
        resp = requests.get(f"{BASE_URL}/api/events/{event_id}", timeout=10)
        resp.raise_for_status()
        event = resp.json()
        print("[OK] Event found:\n")
        print_json(event)
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
            print("[ERROR] Event not found")
        else:
            print(f"[ERROR] Error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"[ERROR] Error: {e}")
        sys.exit(1)

def cmd_auth():
    """Check current auth."""
    print("[AUTH] Checking auth...")
    try:
        resp = requests.get(f"{BASE_URL}/api/auth/me", timeout=10)
        resp.raise_for_status()
        user = resp.json()
        print("[OK] Authenticated as:\n")
        print_json(user)
    except Exception as e:
        print(f"[ERROR] Error: {e}")
        sys.exit(1)

def cmd_saved():
    """List saved events."""
    print("[SAVED] Listing saved events...")
    try:
        resp = requests.get(f"{BASE_URL}/api/users/saved-events", timeout=10)
        resp.raise_for_status()
        events = resp.json()
        print(f"[OK] Found {len(events)} saved events\n")
        for event in events:
            print(f"ID: {event['id']}")
            print(f"Title: {event['title']}")
            print()
    except Exception as e:
        print(f"[ERROR] Error: {e}")
        sys.exit(1)

def cmd_save(event_id):
    """Save an event."""
    print(f"[SAVED] Saving event {event_id}...")
    try:
        resp = requests.post(f"{BASE_URL}/api/users/saved-events/{event_id}", timeout=10)
        resp.raise_for_status()
        result = resp.json()
        print("[OK] Event saved!\n")
        print_json(result)
    except Exception as e:
        print(f"[ERROR] Error: {e}")
        sys.exit(1)

def main():
    """Main CLI."""
    print("[CLI] CrisisLens CLI Test Client\n")
    
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python cli.py health       - Check backend status")
        print("  python cli.py trending     - Fetch trending news")
        print("  python cli.py generate     - Generate events from news")
        print("  python cli.py events       - List all events")
        print("  python cli.py event <id>   - Get specific event")
        print("  python cli.py saved        - List saved events")
        print("  python cli.py save <id>    - Save an event")
        print("  python cli.py auth         - Check authentication")
        return
    
    cmd = sys.argv[1]
    
    # First check health
    if cmd != "health":
        cmd_health()
        print()
    
    if cmd == "health":
        cmd_health()
    elif cmd == "trending":
        cmd_trending()
    elif cmd == "generate":
        cmd_generate()
    elif cmd == "events":
        cmd_events()
    elif cmd == "event" and len(sys.argv) > 2:
        cmd_event(sys.argv[2])
    elif cmd == "saved":
        cmd_saved()
    elif cmd == "save" and len(sys.argv) > 2:
        cmd_save(sys.argv[2])
    elif cmd == "auth":
        cmd_auth()
    else:
        print(f"Unknown command: {cmd}")
        sys.exit(1)

if __name__ == "__main__":
    main()

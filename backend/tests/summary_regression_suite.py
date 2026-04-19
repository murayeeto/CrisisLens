import os
import sys
import unittest
import hashlib
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch


BACKEND_DIR = Path(__file__).resolve().parents[1]
DEPS_DIR = BACKEND_DIR / ".deps"

os.environ.setdefault("USE_MOCK_DATA", "true")
os.environ.setdefault("OPENAI_API_KEY", "")
os.environ.setdefault("MAPS_API_KEY", "")

sys.path.insert(0, str(DEPS_DIR))
sys.path.insert(0, str(BACKEND_DIR))

import main as app_module
from models import NewsArticle
from services.event_service import event_service
from services.news_service import NewsService
from services.openai_service import analysis_needs_refresh, generate_mock_analysis_from_text


class FakeDoc:
    def __init__(self, payload):
        self._payload = payload

    def to_dict(self):
        return dict(self._payload)


class FakeCollection:
    def __init__(self, payloads):
        self._payloads = payloads

    def stream(self):
        return [FakeDoc(payload) for payload in self._payloads]


class FakeDB:
    def __init__(self, payloads):
        self._payloads = payloads

    def collection(self, _name):
        return FakeCollection(self._payloads)


class SummaryRegressionSuite(unittest.TestCase):
    def setUp(self):
        event_service.clear_events()
        self.client = app_module.app.test_client()

    def tearDown(self):
        event_service.clear_events()

    def test_followup_summary_stays_grounded_to_the_story(self):
        analysis = generate_mock_analysis_from_text(
            (
                "Title: State of Texas: Lawmakers to visit Camp Mystic after tense court hearing\n"
                "Description: Texas lawmakers are planning a visit to Camp Mystic after a tense court hearing "
                "as questions continue over the deadly flood response and recovery effort.\n"
            ),
            "Texas, USA",
        )

        self.assertIn("court hearing", analysis.summary.lower())
        self.assertNotIn("flooding has been reported", analysis.summary.lower())
        self.assertIn("recovery", analysis.watch_guidance.lower())

    def test_refresh_detector_flags_generic_summary_but_not_grounded_one(self):
        title = "State of Texas: Lawmakers to visit Camp Mystic after tense court hearing"
        description = (
            "Texas lawmakers are planning a visit to Camp Mystic after a tense court hearing "
            "as questions continue over the deadly flood response and recovery effort."
        )
        generic_summary = (
            "Flooding has been reported in Texas, USA. Local authorities are monitoring water levels "
            "and coordinating emergency response efforts. Residents in affected areas are advised to "
            "follow official evacuation orders and take necessary precautions."
        )

        grounded_summary = generate_mock_analysis_from_text(
            f"Title: {title}\nDescription: {description}\n",
            "Texas, USA",
        ).summary

        self.assertTrue(analysis_needs_refresh(title, description, generic_summary))
        self.assertFalse(analysis_needs_refresh(title, description, grounded_summary))

    def test_disaster_summary_is_specific_instead_of_reused_boilerplate(self):
        analysis = generate_mock_analysis_from_text(
            (
                "Title: Devastating Floods Hit Pakistan - Thousands Evacuated\n"
                "Description: International humanitarian organizations mobilize as unprecedented monsoon "
                "flooding affects Sindh province, displacing over 20,000 families.\n"
                "Content: Rescue teams are conducting emergency operations as catastrophic flooding along "
                "the Indus River threatens communities.\n"
            ),
            "Sindh, Pakistan",
        )

        self.assertIn("sindh", analysis.summary.lower())
        self.assertTrue("20,000" in analysis.summary or "indus" in analysis.summary.lower())
        self.assertNotIn("authorities are monitoring", analysis.summary.lower())

    def test_quality_filter_keeps_followup_crisis_story_and_rejects_bad_articles(self):
        followup_story = NewsArticle(
            id="1",
            title="State of Texas: Lawmakers to visit Camp Mystic after tense court hearing",
            description=(
                "Texas lawmakers are planning a visit to Camp Mystic after a tense court hearing "
                "as questions continue over the deadly flood response."
            ),
            source_name="Reuters",
            published_at="2026-04-19T07:00:00Z",
            url="https://example.com/followup",
            content="The visit follows scrutiny of the flooding response and recovery operations.",
        )
        mismatch_story = NewsArticle(
            id="2",
            title="Golfer fights through injury in PGA return",
            description="Rugby league coaches reacted after the Dragons loss in a wet-weather match.",
            source_name="Bad Feed",
            published_at="2026-04-19T07:00:00Z",
            url="https://example.com/mismatch",
            content="",
        )
        finance_story = NewsArticle(
            id="3",
            title="Nasdaq earnings preview lifts chip stocks",
            description="Investors are watching forecasts ahead of the next earnings cycle.",
            source_name="Finance Feed",
            published_at="2026-04-19T07:00:00Z",
            url="https://example.com/finance",
            content="",
        )

        self.assertTrue(NewsService._is_quality_article(followup_story))
        self.assertFalse(NewsService._is_quality_article(mismatch_story))
        self.assertFalse(NewsService._is_quality_article(finance_story))

    def test_grouping_prefers_recent_articles_even_with_broader_window(self):
        now = datetime(2026, 4, 19, 12, 0, tzinfo=timezone.utc)
        recent_story = NewsArticle(
            id="recent_story",
            title="New flood evacuations ordered in Sindh",
            description="Officials ordered new evacuations after heavy flooding worsened overnight.",
            source_name="Reuters",
            published_at="2026-04-19T10:00:00Z",
            url="https://example.com/recent-flood",
            content="Fresh overnight flooding forced new evacuations and relief operations.",
            event_key="event:sindh-flooding",
        )
        older_story = NewsArticle(
            id="older_story",
            title="Flood response continues in Sindh after earlier storms",
            description="Aid organizations continued relief work after earlier flooding in Sindh.",
            source_name="AP",
            published_at="2026-04-05T10:00:00Z",
            url="https://example.com/older-flood",
            content="Older flood coverage " * 200,
            event_key="event:sindh-flooding",
        )

        grouped = NewsService._group_articles_by_event([older_story, recent_story], now=now)

        self.assertEqual(len(grouped), 1)
        self.assertEqual(grouped[0][0].url, recent_story.url)

    def test_grouping_handles_mixed_naive_and_aware_timestamps(self):
        now = datetime(2026, 4, 19, 12, 0, tzinfo=timezone.utc)
        aware_story = NewsArticle(
            id="aware_story",
            title="Earthquake response continues near Lima",
            description="Emergency crews continued response operations after a major earthquake.",
            source_name="Reuters",
            published_at="2026-04-19T10:00:00Z",
            url="https://example.com/aware-quake",
            content="Aftershocks and emergency response efforts continued through the morning.",
            event_key="event:lima-earthquake",
        )
        naive_story = NewsArticle(
            id="naive_story",
            title="Earthquake response continues near Lima",
            description="Officials said earthquake recovery work remained active across Lima.",
            source_name="AP",
            published_at="2026-04-18T08:00:00",
            url="https://example.com/naive-quake",
            content="Recovery crews remained deployed in affected districts.",
            event_key="event:lima-earthquake",
        )

        grouped = NewsService._group_articles_by_event([naive_story, aware_story], now=now)

        self.assertEqual(len(grouped), 1)
        self.assertEqual(grouped[0][0].url, aware_story.url)

    def test_events_endpoint_repairs_cached_generic_summary(self):
        cached_event = {
            "id": "evt_cached_texas",
            "title": "State of Texas: Lawmakers to visit Camp Mystic after tense court hearing",
            "description": (
                "Texas lawmakers are planning a visit to Camp Mystic after a tense court hearing "
                "as questions continue over the deadly flood response and recovery effort."
            ),
            "severity": "medium",
            "category": "storm",
            "region": "Texas",
            "location": "Texas, USA",
            "lat": 31.0,
            "lng": -99.0,
            "createdAt": "2026-04-19T07:00:00Z",
            "updatedAt": "2026-04-19T07:00:00Z",
            "previewImage": "",
            "aiSummary": (
                "Flooding has been reported in Texas, USA. Local authorities are monitoring water "
                "levels and coordinating emergency response efforts. Residents in affected areas are "
                "advised to follow official evacuation orders and take necessary precautions."
            ),
            "affectedGroups": ["residents"],
            "impactAnalysis": "",
            "howToHelp": "",
            "watchGuidance": "",
            "sources": [],
        }
        captured_writes = []

        def capture_write(collection_name, document_id, data, merge=True):
            captured_writes.append((collection_name, document_id, data, merge))
            return True

        with patch.object(app_module.firebase_service, "_db", FakeDB([cached_event])), patch.object(
            app_module.news_service,
            "fetch_trending_news_groups",
            return_value=[],
        ), patch.object(
            app_module.firebase_service,
            "set_document",
            side_effect=capture_write,
        ):
            response = self.client.get("/api/events")

        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(len(payload), 1)
        self.assertIn("court hearing", payload[0]["aiSummary"].lower())
        self.assertNotIn("flooding has been reported", payload[0]["aiSummary"].lower())
        self.assertEqual(len(captured_writes), 1)

    def test_event_detail_endpoint_repairs_persisted_generic_summary(self):
        cached_event = {
            "id": "evt_detail_texas",
            "title": "State of Texas: Lawmakers to visit Camp Mystic after tense court hearing",
            "description": (
                "Texas lawmakers are planning a visit to Camp Mystic after a tense court hearing "
                "as questions continue over the deadly flood response and recovery effort."
            ),
            "severity": "medium",
            "category": "storm",
            "region": "Texas",
            "location": "Texas, USA",
            "lat": 31.0,
            "lng": -99.0,
            "startedAt": "2026-04-19T07:00:00Z",
            "updatedAt": "2026-04-19T07:00:00Z",
            "previewImage": "",
            "aiSummary": (
                "Flooding has been reported in Texas, USA. Local authorities are monitoring water "
                "levels and coordinating emergency response efforts. Residents in affected areas are "
                "advised to follow official evacuation orders and take necessary precautions."
            ),
            "affectedGroups": ["residents"],
            "impactAnalysis": "",
            "howToHelp": "",
            "watchGuidance": "",
            "sources": [],
            "sourcesCount": 0,
            "tags": ["storm", "medium"],
        }

        with patch.object(app_module.event_service, "get_event", return_value=None), patch.object(
            app_module.firebase_service,
            "get_document",
            return_value=cached_event,
        ), patch.object(app_module.firebase_service, "list_documents", return_value=[]), patch.object(
            app_module.firebase_service,
            "set_document",
            return_value=True,
        ):
            response = self.client.get("/api/events/evt_detail_texas")

        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertIn("court hearing", payload["aiSummary"].lower())
        self.assertNotIn("flooding has been reported", payload["aiSummary"].lower())

    def test_events_endpoint_generates_grounded_summary_for_new_articles(self):
        followup_story = NewsArticle(
            id="fresh_followup",
            title="State of Texas: Lawmakers to visit Camp Mystic after tense court hearing",
            description=(
                "Texas lawmakers are planning a visit to Camp Mystic after a tense court hearing "
                "as questions continue over the deadly flood response and recovery effort."
            ),
            image_url="",
            source_name="Reuters",
            published_at="2026-04-19T07:00:00Z",
            url="https://example.com/fresh-followup",
            content="The visit follows scrutiny of the flooding response and recovery operations.",
        )

        with patch.object(app_module.firebase_service, "_db", None), patch.object(
            app_module.news_service,
            "fetch_trending_news_groups",
            return_value=[[followup_story]],
        ), patch.object(
            app_module.news_service,
            "fetch_trending_news",
            return_value=[followup_story],
        ), patch.object(app_module.firebase_service, "set_document", return_value=True):
            response = self.client.get("/api/events")

        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(len(payload), 1)
        self.assertEqual(payload[0]["title"], followup_story.title)
        self.assertIn("court hearing", payload[0]["aiSummary"].lower())
        self.assertNotIn("flooding has been reported", payload[0]["aiSummary"].lower())
        self.assertEqual(payload[0]["location"], "Texas, United States")
        self.assertEqual(payload[0]["region"], "Texas")
        self.assertEqual(payload[0]["lat"], 31.0)
        self.assertEqual(payload[0]["lng"], -99.0)
        self.assertEqual(payload[0]["articleCount"], 1)
        self.assertEqual(len(payload[0]["sourceArticles"]), 1)
        self.assertEqual(payload[0]["sourceArticles"][0]["url"], followup_story.url)

    def test_events_endpoint_tops_up_firestore_when_cache_is_below_limit(self):
        cached_event = {
            "id": "evt_cached_grounded",
            "title": "State of Texas: Lawmakers to visit Camp Mystic after tense court hearing",
            "description": (
                "Texas lawmakers are planning a visit to Camp Mystic after a tense court hearing "
                "as questions continue over the deadly flood response and recovery effort."
            ),
            "severity": "medium",
            "category": "storm",
            "region": "Texas",
            "location": "Texas, USA",
            "lat": 31.0,
            "lng": -99.0,
            "createdAt": "2026-04-19T07:00:00Z",
            "updatedAt": "2026-04-19T07:00:00Z",
            "previewImage": "",
            "aiSummary": (
                "Texas lawmakers are planning a visit to Camp Mystic after a tense court hearing. "
                "The coverage is centered on accountability and recovery decisions tied to the event."
            ),
            "affectedGroups": ["residents"],
            "impactAnalysis": "",
            "howToHelp": "",
            "watchGuidance": "",
            "sources": [],
            "sourcesCount": 0,
            "tags": ["storm", "medium"],
        }
        fresh_story = NewsArticle(
            id="fresh_pakistan",
            title="Devastating Floods Hit Pakistan - Thousands Evacuated",
            description=(
                "International humanitarian organizations mobilize as unprecedented monsoon flooding "
                "affects Sindh province, displacing over 20,000 families."
            ),
            image_url="",
            source_name="Reuters",
            published_at="2026-04-19T08:00:00Z",
            url="https://example.com/fresh-pakistan",
            content="Rescue teams are conducting emergency operations as catastrophic flooding along the Indus River threatens communities.",
            event_key="event:pakistan-floods-april",
        )
        corroborating_story = NewsArticle(
            id="fresh_pakistan_2",
            title="Sindh flood response expands as thousands remain displaced",
            description="Aid organizations say evacuation and relief operations are expanding across Sindh after severe flooding.",
            image_url="",
            source_name="AP",
            published_at="2026-04-19T08:30:00Z",
            url="https://example.com/fresh-pakistan-2",
            content="Authorities and aid groups are coordinating relief across Sindh as flooding continues to affect families and transport links.",
            event_key="event:pakistan-floods-april",
        )
        captured_writes = []

        def capture_write(collection_name, document_id, data, merge=True):
            captured_writes.append((collection_name, document_id, data, merge))
            return True

        expected_new_id = hashlib.md5(fresh_story.event_key.encode()).hexdigest()

        with patch.object(app_module.firebase_service, "_db", FakeDB([cached_event])), patch.object(
            app_module.news_service,
            "fetch_trending_news_groups",
            return_value=[[fresh_story, corroborating_story]],
        ), patch.object(
            app_module.firebase_service,
            "set_document",
            side_effect=capture_write,
        ):
            response = self.client.get("/api/events?limit=2")

        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(len(payload), 2)
        returned_ids = {event["id"] for event in payload}
        self.assertIn(cached_event["id"], returned_ids)
        self.assertIn(expected_new_id, returned_ids)
        self.assertTrue(any(document_id == expected_new_id for _, document_id, _, _ in captured_writes))
        new_event = next(event for event in payload if event["id"] == expected_new_id)
        self.assertEqual(new_event["sourcesCount"], 2)
        self.assertEqual(new_event["articleCount"], 2)
        self.assertEqual(len(new_event["sourceArticles"]), 2)
        self.assertEqual(new_event["eventKey"], fresh_story.event_key)
        self.assertEqual(new_event["sourceArticles"][0]["eventKey"], fresh_story.event_key)


if __name__ == "__main__":
    unittest.main(verbosity=2)

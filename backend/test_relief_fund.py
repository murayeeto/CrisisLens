import unittest
from unittest.mock import patch

from services.relief_fund_service import (
    ReliefFundError,
    ReliefFundService,
    relief_fund_service,
)
from services.stripe_service import StripeService


class FakeSnapshot:
    def __init__(self, document_id, data):
        self.id = document_id
        self._data = data
        self.exists = data is not None

    def to_dict(self):
        return dict(self._data) if self._data is not None else None


class FakeDocumentRef:
    def __init__(self, fake_service, collection_name, document_id):
        self.fake_service = fake_service
        self.collection_name = collection_name
        self.document_id = document_id

    def get(self, transaction=None):
        data = self.fake_service.get_document(self.collection_name, self.document_id)
        return FakeSnapshot(self.document_id, data)


class FakeCollectionRef:
    def __init__(self, fake_service, collection_name):
        self.fake_service = fake_service
        self.collection_name = collection_name

    def document(self, document_id):
        return FakeDocumentRef(self.fake_service, self.collection_name, document_id)


class FakeTransaction:
    def __init__(self, fake_service):
        self.fake_service = fake_service

    def set(self, document_ref, data, merge=False):
        self.fake_service.set_document(
            document_ref.collection_name,
            document_ref.document_id,
            data,
            merge=merge,
        )


class FakeDB:
    def __init__(self, fake_service):
        self.fake_service = fake_service

    def collection(self, collection_name):
        return FakeCollectionRef(self.fake_service, collection_name)

    def transaction(self):
        return FakeTransaction(self.fake_service)


class FakeFirebaseService:
    def __init__(self):
        self.documents = {}
        self.db = FakeDB(self)

    def _collection(self, collection_name):
        return self.documents.setdefault(collection_name, {})

    def get_document(self, collection_name, document_id):
        data = self._collection(collection_name).get(document_id)
        return dict(data) if data is not None else None

    def set_document(self, collection_name, document_id, data, merge=True):
        collection = self._collection(collection_name)
        current = dict(collection.get(document_id, {})) if merge else {}
        current.update(data)
        collection[document_id] = current
        return True

    def list_documents(self, collection_name, filters=None):
        rows = []
        for document_id, data in self._collection(collection_name).items():
            row = {"id": document_id, **data}
            match = True
            for field_name, operator, value in filters or []:
                if operator != "==" or row.get(field_name) != value:
                    match = False
                    break
            if match:
                rows.append(row)
        return rows

    def get_db(self):
        return self.db


class ReliefFundServiceTests(unittest.TestCase):
    def setUp(self):
        self.fake_firebase = FakeFirebaseService()
        self.service = ReliefFundService()
        self.firebase_patch = patch("services.relief_fund_service.firebase_service", self.fake_firebase)
        self.transactional_patch = patch("services.relief_fund_service.firestore.transactional", lambda fn: fn)
        self.firebase_patch.start()
        self.transactional_patch.start()
        self.addCleanup(self.firebase_patch.stop)
        self.addCleanup(self.transactional_patch.stop)

        self.event_snapshot = {
            "id": "evt_1",
            "title": "Major flooding in River County",
            "location": "River County",
            "region": "East",
            "country": "US",
            "severity": "high",
            "previewImage": "",
            "category": "storm",
            "startedAt": "2026-04-18T10:00:00",
            "updatedAt": "2026-04-18T12:00:00",
        }

    def build_review_payload(self, **overrides):
        payload = {
            "campaignId": "relief_verified_001",
            "type": "family",
            "title": "Emergency move",
            "description": "Need help relocating family members quickly.",
            "requestedAmount": 1200,
            "impactStatement": "Flooding displaced our household and we need temporary lodging and transport.",
            "identityDocumentType": "driver_license",
            "proofOfImpactFiles": [
                {
                    "name": "hotel-letter.pdf",
                    "storagePath": "campaign-proof/user_1/relief_verified_001/impact/hotel-letter.pdf",
                    "downloadUrl": "https://example.com/impact",
                    "contentType": "application/pdf",
                    "size": 1024,
                }
            ],
            "identityFiles": [
                {
                    "name": "license.png",
                    "storagePath": "campaign-proof/user_1/relief_verified_001/identity/license.png",
                    "downloadUrl": "https://example.com/license",
                    "contentType": "image/png",
                    "size": 2048,
                }
            ],
        }
        payload.update(overrides)
        return payload

    def test_create_basic_campaign_under_500(self):
        campaign = self.service.create_campaign(
            owner_uid="user_1",
            owner_name="Alex",
            owner_email="alex@example.com",
            event_snapshot=self.event_snapshot,
            payload={
                "campaignId": "relief_basic_001",
                "type": "personal",
                "title": "Temporary stay",
                "description": "Need help with two nights of housing.",
                "requestedAmount": 300,
            },
        )

        self.assertEqual(campaign["capTier"], "basic")
        self.assertEqual(campaign["requestedAmountCents"], 30000)
        self.assertEqual(campaign["status"], "active")
        self.assertEqual(campaign["reviewStatus"], "not_required")

    def test_rejects_goal_above_500_without_review_packet(self):
        with self.assertRaises(ReliefFundError) as error:
            self.service.create_campaign(
                owner_uid="user_1",
                owner_name="Alex",
                owner_email="alex@example.com",
                event_snapshot=self.event_snapshot,
                payload=self.build_review_payload(
                    impactStatement="",
                ),
            )

        self.assertEqual(error.exception.status_code, 400)
        self.assertEqual(error.exception.message, "Impact statement is required for review.")

    def test_create_verified_campaign_enters_pending_review(self):
        campaign = self.service.create_campaign(
            owner_uid="user_1",
            owner_name="Alex",
            owner_email="alex@example.com",
            event_snapshot=self.event_snapshot,
            payload=self.build_review_payload(),
        )

        self.assertEqual(campaign["capTier"], "verified")
        self.assertEqual(campaign["status"], "pending_review")
        self.assertEqual(campaign["reviewStatus"], "pending")
        self.assertEqual(campaign["identityDocumentType"], "driver_license")
        self.assertEqual(len(campaign["proofOfImpactFiles"]), 1)
        self.assertEqual(len(campaign["identityFiles"]), 1)

    def test_pending_review_campaign_cannot_accept_checkout(self):
        campaign = self.service.create_campaign(
            owner_uid="user_1",
            owner_name="Alex",
            owner_email="alex@example.com",
            event_snapshot=self.event_snapshot,
            payload=self.build_review_payload(),
        )

        with self.assertRaises(ReliefFundError) as error:
            self.service.validate_checkout(campaign, 25)

        self.assertEqual(error.exception.status_code, 400)
        self.assertEqual(error.exception.message, "Campaign is still under review.")

    def test_reviewer_can_approve_pending_campaign(self):
        self.service.create_campaign(
            owner_uid="user_1",
            owner_name="Alex",
            owner_email="alex@example.com",
            event_snapshot=self.event_snapshot,
            payload=self.build_review_payload(),
        )

        reviewed = self.service.review_campaign(
            campaign_id="relief_verified_001",
            reviewer_uid="reviewer_1",
            reviewer_email="reviewer@example.com",
            decision="approve",
            notes="Docs look consistent.",
        )

        self.assertEqual(reviewed["status"], "active")
        self.assertEqual(reviewed["reviewStatus"], "approved")
        self.assertEqual(reviewed["reviewer"]["uid"], "reviewer_1")
        self.assertEqual(reviewed["reviewNotes"], "Docs look consistent.")

    def test_reviewer_can_deny_pending_campaign(self):
        self.service.create_campaign(
            owner_uid="user_1",
            owner_name="Alex",
            owner_email="alex@example.com",
            event_snapshot=self.event_snapshot,
            payload=self.build_review_payload(),
        )

        reviewed = self.service.review_campaign(
            campaign_id="relief_verified_001",
            reviewer_uid="reviewer_1",
            reviewer_email="reviewer@example.com",
            decision="deny",
            notes="Need stronger documentation.",
        )

        self.assertEqual(reviewed["status"], "denied")
        self.assertEqual(reviewed["reviewStatus"], "denied")
        self.assertEqual(reviewed["reviewNotes"], "Need stronger documentation.")

    def test_completed_webhook_is_idempotent(self):
        campaign = self.service.create_campaign(
            owner_uid="user_1",
            owner_name="Alex",
            owner_email="alex@example.com",
            event_snapshot=self.event_snapshot,
            payload={
                "campaignId": "relief_basic_002",
                "type": "personal",
                "title": "Hotel tonight",
                "description": "Need one safe room for tonight.",
                "requestedAmount": 500,
            },
        )
        self.service.create_pending_donation(
            campaign=campaign,
            session_id="cs_test_123",
            payment_intent_id=None,
            amount_cents=2500,
            donor_name="Jamie",
            donor_email="jamie@example.com",
        )

        session = {
            "id": "cs_test_123",
            "payment_status": "paid",
            "payment_intent": "pi_test_123",
            "amount_total": 2500,
            "customer_details": {
                "email": "jamie@example.com",
                "name": "Jamie",
            },
            "metadata": {
                "campaignId": "relief_basic_002",
                "eventId": "evt_1",
                "ownerUid": "user_1",
            },
        }

        first_donation, first_campaign = self.service.mark_donation_completed(session)
        second_donation, second_campaign = self.service.mark_donation_completed(session)

        self.assertEqual(first_donation["status"], "completed")
        self.assertEqual(first_campaign["amountRaisedCents"], 2500)
        self.assertEqual(first_campaign["donorCount"], 1)
        self.assertEqual(second_donation["status"], "completed")
        self.assertEqual(second_campaign["amountRaisedCents"], 2500)
        self.assertEqual(second_campaign["donorCount"], 1)


class StripeServiceTests(unittest.TestCase):
    def test_checkout_session_contains_campaign_metadata(self):
        captured = {}

        class FakeCheckoutSession:
            @staticmethod
            def create(**kwargs):
                captured.update(kwargs)

                class Session:
                    id = "cs_test_checkout"
                    url = "https://checkout.stripe.dev/test"
                    payment_intent = None

                return Session()

        class FakeStripeClient:
            class checkout:
                Session = FakeCheckoutSession

        campaign = {
            "id": "relief_checkout_001",
            "title": "Short stay",
            "eventId": "evt_1",
            "event": {"title": "Major flooding in River County"},
            "owner": {"uid": "user_1"},
        }

        service = StripeService()
        with patch.object(StripeService, "_get_client", return_value=FakeStripeClient()):
            session = service.create_checkout_session(
                campaign=campaign,
                amount_cents=5000,
                donor_name="Jamie",
                donor_email="jamie@example.com",
            )

        self.assertEqual(session.id, "cs_test_checkout")
        self.assertEqual(captured["metadata"]["campaignId"], "relief_checkout_001")
        self.assertEqual(captured["metadata"]["eventId"], "evt_1")
        self.assertEqual(captured["metadata"]["ownerUid"], "user_1")
        self.assertEqual(captured["line_items"][0]["price_data"]["unit_amount"], 5000)
        self.assertIn("/relief/relief_checkout_001", captured["success_url"])


if __name__ == "__main__":
    unittest.main()

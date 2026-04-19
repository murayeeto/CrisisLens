import re
import uuid
from datetime import datetime, timezone

from firebase_admin import firestore

from services.firebase_service import firebase_service


CAMPAIGNS_COLLECTION = "campaigns"
DONATIONS_COLLECTION = "donations"
BASIC_CAP_CENTS = 50000
VERIFIED_CAP_CENTS = 150000
ACTIVE_CAMPAIGN_STATUSES = {"active"}
CAMPAIGN_ID_PATTERN = re.compile(r"^[a-zA-Z0-9_-]{8,80}$")
IDENTITY_DOCUMENT_TYPES = {"driver_license", "state_id", "passport", "government_id", "other"}


class ReliefFundError(Exception):
    def __init__(self, message, status_code=400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def _now():
    return datetime.now(timezone.utc).isoformat()


def _cents_to_amount(value):
    return round(int(value) / 100, 2)


def _normalize_amount_to_cents(value):
    if value is None:
        raise ReliefFundError("Amount is required.", 400)

    try:
        normalized = round(float(value) * 100)
    except (TypeError, ValueError):
        raise ReliefFundError("Amount must be a valid number.", 400)

    if normalized <= 0:
        raise ReliefFundError("Amount must be greater than zero.", 400)

    return int(normalized)


def _sanitize_text(value, field_name, max_length):
    if not isinstance(value, str):
        raise ReliefFundError(f"{field_name} is required.", 400)

    cleaned = value.strip()
    if not cleaned:
        raise ReliefFundError(f"{field_name} is required.", 400)

    if len(cleaned) > max_length:
        raise ReliefFundError(f"{field_name} is too long.", 400)

    return cleaned


def _sanitize_optional_text(value, max_length):
    if value is None:
        return ""

    if not isinstance(value, str):
        raise ReliefFundError("Invalid text field.", 400)

    cleaned = value.strip()
    if len(cleaned) > max_length:
        raise ReliefFundError("Text field is too long.", 400)

    return cleaned


def _sanitize_campaign_type(value):
    if value not in {"personal", "family"}:
        raise ReliefFundError("Campaign type must be personal or family.", 400)
    return value


def _sanitize_identity_document_type(value):
    if value not in IDENTITY_DOCUMENT_TYPES:
        raise ReliefFundError("Identity document type is required.", 400)
    return value


def _sanitize_campaign_id(value):
    if value is None:
        return f"relief_{uuid.uuid4().hex}"

    if not isinstance(value, str) or not CAMPAIGN_ID_PATTERN.match(value):
        raise ReliefFundError("Invalid campaign ID.", 400)

    return value


def _sanitize_proof_files(files):
    normalized = []
    for file_item in files or []:
        if not isinstance(file_item, dict):
            raise ReliefFundError("Proof files must be objects.", 400)

        storage_path = _sanitize_text(file_item.get("storagePath", ""), "Proof storage path", 240)
        normalized.append(
            {
                "name": _sanitize_text(file_item.get("name", ""), "Proof file name", 140),
                "storagePath": storage_path,
                "downloadUrl": _sanitize_optional_text(file_item.get("downloadUrl"), 500),
                "contentType": _sanitize_optional_text(file_item.get("contentType"), 120),
                "size": max(0, int(file_item.get("size", 0) or 0)),
                "uploadedAt": file_item.get("uploadedAt") or _now(),
            }
        )

    return normalized


def _sort_by_created_desc(documents):
    return sorted(documents, key=lambda item: item.get("createdAt") or "", reverse=True)


class ReliefFundService:
    def serialize_campaign(self, campaign):
        if not campaign:
            return None

        requested_amount_cents = int(campaign.get("requestedAmountCents", 0) or 0)
        amount_raised_cents = int(campaign.get("amountRaisedCents", 0) or 0)
        remaining_cents = max(0, requested_amount_cents - amount_raised_cents)

        return {
            "id": campaign.get("id"),
            "type": campaign.get("type"),
            "title": campaign.get("title"),
            "description": campaign.get("description"),
            "status": campaign.get("status", "active"),
            "reviewStatus": campaign.get("reviewStatus", "not_required"),
            "currency": campaign.get("currency", "usd"),
            "capTier": campaign.get("capTier", "basic"),
            "requestedAmount": _cents_to_amount(requested_amount_cents),
            "requestedAmountCents": requested_amount_cents,
            "amountRaised": _cents_to_amount(amount_raised_cents),
            "amountRaisedCents": amount_raised_cents,
            "remainingAmount": _cents_to_amount(remaining_cents),
            "remainingAmountCents": remaining_cents,
            "donorCount": int(campaign.get("donorCount", 0) or 0),
            "proofFiles": campaign.get("proofFiles", []),
            "proofCount": int(campaign.get("proofCount", 0) or 0),
            "hasProof": bool(campaign.get("hasProof", False)),
            "impactStatement": campaign.get("impactStatement", ""),
            "identityDocumentType": campaign.get("identityDocumentType", ""),
            "proofOfImpactFiles": campaign.get("proofOfImpactFiles", []),
            "identityFiles": campaign.get("identityFiles", []),
            "reviewRequestedAt": campaign.get("reviewRequestedAt"),
            "reviewedAt": campaign.get("reviewedAt"),
            "reviewNotes": campaign.get("reviewNotes", ""),
            "reviewer": {
                "uid": campaign.get("reviewerUid", ""),
                "email": campaign.get("reviewerEmail", ""),
            },
            "goalReached": remaining_cents <= 0,
            "owner": {
                "uid": campaign.get("ownerUid"),
                "displayName": campaign.get("ownerName", ""),
                "email": campaign.get("ownerEmail", ""),
            },
            "eventId": campaign.get("eventId"),
            "event": campaign.get("event") or {},
            "createdAt": campaign.get("createdAt"),
            "updatedAt": campaign.get("updatedAt"),
        }

    def serialize_donation(self, donation):
        if not donation:
            return None

        amount_cents = int(donation.get("amountCents", 0) or 0)

        return {
            "id": donation.get("id"),
            "campaignId": donation.get("campaignId"),
            "eventId": donation.get("eventId"),
            "ownerUid": donation.get("ownerUid"),
            "currency": donation.get("currency", "usd"),
            "amount": _cents_to_amount(amount_cents),
            "amountCents": amount_cents,
            "status": donation.get("status", "pending"),
            "sessionId": donation.get("sessionId"),
            "paymentIntentId": donation.get("paymentIntentId"),
            "donorName": donation.get("donorName", ""),
            "donorEmail": donation.get("donorEmail", ""),
            "createdAt": donation.get("createdAt"),
            "updatedAt": donation.get("updatedAt"),
        }

    def list_campaigns(self, event_id=None, owner_uid=None, include_inactive=False):
        filters = []
        if event_id:
            filters.append(("eventId", "==", event_id))
        if owner_uid:
            filters.append(("ownerUid", "==", owner_uid))

        campaigns = _sort_by_created_desc(firebase_service.list_documents(CAMPAIGNS_COLLECTION, filters=filters))
        if not include_inactive:
            campaigns = [campaign for campaign in campaigns if campaign.get("status", "active") in ACTIVE_CAMPAIGN_STATUSES]

        return [self.serialize_campaign(campaign) for campaign in campaigns]

    def list_review_queue(self):
        campaigns = _sort_by_created_desc(
            firebase_service.list_documents(CAMPAIGNS_COLLECTION, filters=[("reviewStatus", "==", "pending")])
        )
        return [self.serialize_campaign(campaign) for campaign in campaigns]

    def get_campaign(self, campaign_id):
        campaign = firebase_service.get_document(CAMPAIGNS_COLLECTION, campaign_id)
        if not campaign:
            return None
        return self.serialize_campaign({"id": campaign_id, **campaign})

    def get_donation_by_session(self, session_id):
        donation = firebase_service.get_document(DONATIONS_COLLECTION, session_id)
        if not donation:
            return None
        return self.serialize_donation({"id": session_id, **donation})

    def create_campaign(self, owner_uid, owner_name, owner_email, event_snapshot, payload):
        campaign_id = _sanitize_campaign_id(payload.get("campaignId"))
        if firebase_service.get_document(CAMPAIGNS_COLLECTION, campaign_id):
            raise ReliefFundError("Campaign ID already exists.", 409)

        event_id = event_snapshot.get("id")
        if not event_id:
            raise ReliefFundError("Campaign must be linked to an event.", 400)

        for existing_campaign in self.list_campaigns(owner_uid=owner_uid, include_inactive=False):
            if existing_campaign.get("eventId") == event_id:
                raise ReliefFundError("You already have an active campaign for this event.", 409)

        requested_amount_cents = _normalize_amount_to_cents(payload.get("requestedAmount"))
        review_required = requested_amount_cents > BASIC_CAP_CENTS
        proof_of_impact_files = _sanitize_proof_files(payload.get("proofOfImpactFiles"))
        identity_files = _sanitize_proof_files(payload.get("identityFiles"))
        impact_statement = _sanitize_optional_text(payload.get("impactStatement"), 1200)
        identity_document_type = (
            _sanitize_identity_document_type(payload.get("identityDocumentType"))
            if review_required or payload.get("identityDocumentType")
            else ""
        )
        proof_files = [*proof_of_impact_files, *identity_files]
        cap_tier = "verified" if review_required else "basic"
        max_allowed = VERIFIED_CAP_CENTS if review_required else BASIC_CAP_CENTS

        if requested_amount_cents > VERIFIED_CAP_CENTS:
            raise ReliefFundError("Campaign goal cannot exceed $1500.", 400)

        if review_required:
            if not impact_statement:
                raise ReliefFundError("Impact statement is required for review.", 400)
            if not proof_of_impact_files:
                raise ReliefFundError("Proof of impact is required for review.", 400)
            if not identity_files:
                raise ReliefFundError("License or equivalent ID is required for review.", 400)

        if requested_amount_cents > max_allowed:
            raise ReliefFundError("Campaign goal exceeds the allowed cap.", 400)

        created_at = _now()
        campaign = {
            "id": campaign_id,
            "ownerUid": owner_uid,
            "ownerName": owner_name or "",
            "ownerEmail": owner_email or "",
            "eventId": event_id,
            "event": {
                "id": event_id,
                "title": event_snapshot.get("title", ""),
                "location": event_snapshot.get("location", ""),
                "region": event_snapshot.get("region", ""),
                "country": event_snapshot.get("country", ""),
                "severity": event_snapshot.get("severity", ""),
                "previewImage": event_snapshot.get("previewImage", ""),
                "category": event_snapshot.get("category", ""),
                "startedAt": event_snapshot.get("startedAt"),
                "updatedAt": event_snapshot.get("updatedAt"),
            },
            "type": _sanitize_campaign_type(payload.get("type")),
            "title": _sanitize_text(payload.get("title"), "Title", 90),
            "description": _sanitize_text(payload.get("description"), "Description", 280),
            "status": "pending_review" if review_required else "active",
            "reviewStatus": "pending" if review_required else "not_required",
            "currency": "usd",
            "capTier": cap_tier,
            "impactStatement": impact_statement,
            "identityDocumentType": identity_document_type,
            "proofOfImpactFiles": proof_of_impact_files,
            "identityFiles": identity_files,
            "proofFiles": proof_files,
            "proofCount": len(proof_files),
            "hasProof": bool(proof_files),
            "reviewRequestedAt": created_at if review_required else None,
            "reviewedAt": None,
            "reviewNotes": "",
            "reviewerUid": "",
            "reviewerEmail": "",
            "requestedAmountCents": requested_amount_cents,
            "requestedAmount": _cents_to_amount(requested_amount_cents),
            "amountRaisedCents": 0,
            "amountRaised": 0,
            "remainingAmountCents": requested_amount_cents,
            "remainingAmount": _cents_to_amount(requested_amount_cents),
            "donorCount": 0,
            "createdAt": created_at,
            "updatedAt": created_at,
        }

        success = firebase_service.set_document(CAMPAIGNS_COLLECTION, campaign_id, campaign, merge=False)
        if not success:
            raise ReliefFundError("Unable to create campaign.", 500)

        return self.serialize_campaign(campaign)

    def update_campaign(self, campaign_id, owner_uid, payload):
        existing = firebase_service.get_document(CAMPAIGNS_COLLECTION, campaign_id)
        if not existing:
            raise ReliefFundError("Campaign not found.", 404)

        if existing.get("ownerUid") != owner_uid:
            raise ReliefFundError("You can only update your own campaign.", 403)

        updates = {}
        if "title" in payload:
            updates["title"] = _sanitize_text(payload.get("title"), "Title", 90)
        if "description" in payload:
            updates["description"] = _sanitize_text(payload.get("description"), "Description", 280)
        if "type" in payload:
            updates["type"] = _sanitize_campaign_type(payload.get("type"))
        if "status" in payload:
            status = payload.get("status")
            if status not in {"active", "closed", "pending_review", "denied"}:
                raise ReliefFundError("Status is invalid.", 400)
            updates["status"] = status

        impact_statement = existing.get("impactStatement", "")
        if "impactStatement" in payload:
            impact_statement = _sanitize_optional_text(payload.get("impactStatement"), 1200)
            updates["impactStatement"] = impact_statement

        identity_document_type = existing.get("identityDocumentType", "")
        if "identityDocumentType" in payload and payload.get("identityDocumentType"):
            identity_document_type = _sanitize_identity_document_type(payload.get("identityDocumentType"))
            updates["identityDocumentType"] = identity_document_type

        proof_of_impact_files = existing.get("proofOfImpactFiles", [])
        if "proofOfImpactFiles" in payload:
            proof_of_impact_files = _sanitize_proof_files(payload.get("proofOfImpactFiles"))
            updates["proofOfImpactFiles"] = proof_of_impact_files

        identity_files = existing.get("identityFiles", [])
        if "identityFiles" in payload:
            identity_files = _sanitize_proof_files(payload.get("identityFiles"))
            updates["identityFiles"] = identity_files

        proof_files = [*proof_of_impact_files, *identity_files]
        updates["proofFiles"] = proof_files
        updates["proofCount"] = len(proof_files)
        updates["hasProof"] = bool(proof_files)

        requested_amount_cents = int(existing.get("requestedAmountCents", 0) or 0)
        if "requestedAmount" in payload:
            requested_amount_cents = _normalize_amount_to_cents(payload.get("requestedAmount"))

        amount_raised_cents = int(existing.get("amountRaisedCents", 0) or 0)
        if requested_amount_cents < amount_raised_cents:
            raise ReliefFundError("Goal cannot be lower than the amount already raised.", 400)

        review_required = requested_amount_cents > BASIC_CAP_CENTS

        if requested_amount_cents > VERIFIED_CAP_CENTS:
            raise ReliefFundError("Campaign goal cannot exceed $1500.", 400)

        cap_tier = "verified" if review_required else "basic"
        max_allowed = VERIFIED_CAP_CENTS if review_required else BASIC_CAP_CENTS
        if review_required:
            if not impact_statement:
                raise ReliefFundError("Impact statement is required for review.", 400)
            if not proof_of_impact_files:
                raise ReliefFundError("Proof of impact is required for review.", 400)
            if not identity_files:
                raise ReliefFundError("License or equivalent ID is required for review.", 400)
            if not identity_document_type:
                raise ReliefFundError("Identity document type is required.", 400)
        if requested_amount_cents > max_allowed:
            raise ReliefFundError("Campaign goal exceeds the allowed cap.", 400)

        updates["capTier"] = cap_tier
        updates["requestedAmountCents"] = requested_amount_cents
        updates["requestedAmount"] = _cents_to_amount(requested_amount_cents)
        updates["remainingAmountCents"] = max(0, requested_amount_cents - amount_raised_cents)
        updates["remainingAmount"] = _cents_to_amount(updates["remainingAmountCents"])
        if review_required:
            updates["reviewStatus"] = "pending"
            updates["status"] = "pending_review"
            updates["reviewRequestedAt"] = _now()
            updates["reviewedAt"] = None
            updates["reviewNotes"] = ""
            updates["reviewerUid"] = ""
            updates["reviewerEmail"] = ""
        elif existing.get("status") != "closed":
            updates["reviewStatus"] = "not_required"
            updates["status"] = "active"
        updates["updatedAt"] = _now()

        success = firebase_service.set_document(CAMPAIGNS_COLLECTION, campaign_id, updates, merge=True)
        if not success:
            raise ReliefFundError("Unable to update campaign.", 500)

        return self.get_campaign(campaign_id)

    def create_pending_donation(self, campaign, session_id, payment_intent_id, amount_cents, donor_name, donor_email):
        created_at = _now()
        donation = {
            "campaignId": campaign.get("id"),
            "eventId": campaign.get("eventId"),
            "ownerUid": campaign.get("owner", {}).get("uid"),
            "currency": "usd",
            "amountCents": int(amount_cents),
            "amount": _cents_to_amount(amount_cents),
            "status": "pending",
            "sessionId": session_id,
            "paymentIntentId": payment_intent_id,
            "donorName": donor_name or "",
            "donorEmail": donor_email or "",
            "createdAt": created_at,
            "updatedAt": created_at,
        }

        success = firebase_service.set_document(DONATIONS_COLLECTION, session_id, donation, merge=False)
        if not success:
            raise ReliefFundError("Unable to create donation session.", 500)

        return self.serialize_donation({"id": session_id, **donation})

    def validate_checkout(self, campaign, amount):
        if not campaign:
            raise ReliefFundError("Campaign not found.", 404)

        if campaign.get("status") != "active":
            if campaign.get("status") == "pending_review":
                raise ReliefFundError("Campaign is still under review.", 400)
            if campaign.get("status") == "denied":
                raise ReliefFundError("Campaign was not approved.", 400)
            raise ReliefFundError("Campaign is not accepting support.", 400)

        amount_cents = _normalize_amount_to_cents(amount)
        if campaign.get("currency") != "usd":
            raise ReliefFundError("Only USD is supported for now.", 400)

        remaining_cents = int(campaign.get("remainingAmountCents", 0) or 0)
        if remaining_cents <= 0:
            raise ReliefFundError("This campaign has already reached its goal.", 400)
        if amount_cents > remaining_cents:
            raise ReliefFundError("Donation exceeds the remaining goal.", 400)

        return amount_cents

    def mark_donation_completed(self, session):
        session_id = session.get("id")
        if not session_id:
            raise ReliefFundError("Missing Stripe session ID.", 400)

        db = firebase_service.get_db()
        donation_ref = db.collection(DONATIONS_COLLECTION).document(session_id)
        transaction = db.transaction()

        @firestore.transactional
        def apply(transaction):
            donation_snapshot = donation_ref.get(transaction=transaction)
            donation = donation_snapshot.to_dict() if donation_snapshot.exists else None

            metadata = session.get("metadata") or {}
            campaign_id = (donation or {}).get("campaignId") or metadata.get("campaignId")
            if not campaign_id:
                raise ReliefFundError("Stripe session is missing a campaign link.", 400)

            campaign_ref = db.collection(CAMPAIGNS_COLLECTION).document(campaign_id)
            campaign_snapshot = campaign_ref.get(transaction=transaction)
            if not campaign_snapshot.exists:
                raise ReliefFundError("Campaign not found for this Stripe session.", 404)

            campaign = campaign_snapshot.to_dict()
            current_amount_raised = int(campaign.get("amountRaisedCents", 0) or 0)
            goal_cents = int(campaign.get("requestedAmountCents", 0) or 0)

            if donation and donation.get("status") == "completed":
                return self.serialize_donation({"id": session_id, **donation}), self.serialize_campaign({"id": campaign_id, **campaign})

            amount_cents = int((donation or {}).get("amountCents") or session.get("amount_total") or 0)
            if amount_cents <= 0:
                raise ReliefFundError("Stripe session amount is invalid.", 400)

            completed_at = _now()
            payment_intent_id = session.get("payment_intent") or (donation or {}).get("paymentIntentId")
            donor_email = ((session.get("customer_details") or {}).get("email")) or (donation or {}).get("donorEmail", "")
            donor_name = ((session.get("customer_details") or {}).get("name")) or (donation or {}).get("donorName", "")

            donation_updates = {
                "campaignId": campaign_id,
                "eventId": campaign.get("eventId"),
                "ownerUid": campaign.get("ownerUid"),
                "currency": "usd",
                "amountCents": amount_cents,
                "amount": _cents_to_amount(amount_cents),
                "status": "completed",
                "sessionId": session_id,
                "paymentIntentId": payment_intent_id,
                "donorName": donor_name or "",
                "donorEmail": donor_email or "",
                "createdAt": (donation or {}).get("createdAt") or completed_at,
                "updatedAt": completed_at,
            }
            transaction.set(donation_ref, donation_updates, merge=True)

            next_amount_raised = min(goal_cents, current_amount_raised + amount_cents)
            campaign_updates = {
                "amountRaisedCents": next_amount_raised,
                "amountRaised": _cents_to_amount(next_amount_raised),
                "remainingAmountCents": max(0, goal_cents - next_amount_raised),
                "remainingAmount": _cents_to_amount(max(0, goal_cents - next_amount_raised)),
                "donorCount": int(campaign.get("donorCount", 0) or 0) + 1,
                "updatedAt": completed_at,
            }
            transaction.set(campaign_ref, campaign_updates, merge=True)

            merged_campaign = {"id": campaign_id, **campaign, **campaign_updates}
            merged_donation = {"id": session_id, **(donation or {}), **donation_updates}
            return self.serialize_donation(merged_donation), self.serialize_campaign(merged_campaign)

        return apply(transaction)

    def mark_donation_expired(self, session_id):
        donation = firebase_service.get_document(DONATIONS_COLLECTION, session_id)
        if not donation or donation.get("status") == "completed":
            return self.serialize_donation({"id": session_id, **donation}) if donation else None

        firebase_service.set_document(
            DONATIONS_COLLECTION,
            session_id,
            {
                "status": "expired",
                "updatedAt": _now(),
            },
            merge=True,
        )
        return self.get_donation_by_session(session_id)

    def review_campaign(self, campaign_id, reviewer_uid, reviewer_email, decision, notes=""):
        existing = firebase_service.get_document(CAMPAIGNS_COLLECTION, campaign_id)
        if not existing:
            raise ReliefFundError("Campaign not found.", 404)

        normalized_decision = (decision or "").strip().lower()
        if normalized_decision not in {"approve", "deny"}:
            raise ReliefFundError("Decision must be approve or deny.", 400)

        if existing.get("reviewStatus") != "pending":
            raise ReliefFundError("Campaign is not awaiting review.", 400)

        reviewed_at = _now()
        if normalized_decision == "approve":
            updates = {
                "status": "active",
                "reviewStatus": "approved",
                "reviewedAt": reviewed_at,
                "reviewNotes": _sanitize_optional_text(notes, 600),
                "reviewerUid": reviewer_uid,
                "reviewerEmail": reviewer_email or "",
                "updatedAt": reviewed_at,
            }
        else:
            updates = {
                "status": "denied",
                "reviewStatus": "denied",
                "reviewedAt": reviewed_at,
                "reviewNotes": _sanitize_optional_text(notes, 600),
                "reviewerUid": reviewer_uid,
                "reviewerEmail": reviewer_email or "",
                "updatedAt": reviewed_at,
            }

        success = firebase_service.set_document(CAMPAIGNS_COLLECTION, campaign_id, updates, merge=True)
        if not success:
            raise ReliefFundError("Unable to store review decision.", 500)
        return self.get_campaign(campaign_id)


relief_fund_service = ReliefFundService()

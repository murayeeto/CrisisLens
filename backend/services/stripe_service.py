from config import config
from services.relief_fund_service import ReliefFundError


class StripeService:
    def _get_client(self):
        if not config.STRIPE_SECRET_KEY:
            raise ReliefFundError("Stripe is not configured yet.", 500)

        try:
            import stripe
        except ImportError as exc:
            raise ReliefFundError("Stripe SDK is not installed.", 500) from exc

        stripe.api_key = config.STRIPE_SECRET_KEY
        return stripe

    def create_checkout_session(self, campaign, amount_cents, base_url=None, donor_name="", donor_email=""):
        stripe = self._get_client()
        metadata = {
            "campaignId": campaign.get("id"),
            "eventId": campaign.get("eventId"),
            "ownerUid": campaign.get("owner", {}).get("uid") or "",
        }
        base_url = (base_url or config.APP_BASE_URL).rstrip("/")
        success_url = f"{base_url}/relief/{campaign.get('id')}?checkout=success&session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{base_url}/relief/{campaign.get('id')}?checkout=cancelled"

        session = stripe.checkout.Session.create(
            mode="payment",
            client_reference_id=campaign.get("id"),
            success_url=success_url,
            cancel_url=cancel_url,
            submit_type="donate",
            customer_email=donor_email or None,
            line_items=[
                {
                    "quantity": 1,
                    "price_data": {
                        "currency": "usd",
                        "unit_amount": amount_cents,
                        "product_data": {
                            "name": f"Support {campaign.get('title')}",
                            "description": f"CrisisLens Relief Fund · {campaign.get('event', {}).get('title', '')[:80]}",
                        },
                    },
                }
            ],
            payment_intent_data={
                "metadata": {
                    **metadata,
                    "donorName": donor_name or "",
                }
            },
            metadata={
                **metadata,
                "donorName": donor_name or "",
            },
        )

        return session

    def construct_webhook_event(self, payload, signature):
        stripe = self._get_client()
        if not config.STRIPE_WEBHOOK_SECRET:
            raise ReliefFundError("Stripe webhook secret is not configured yet.", 500)

        try:
            return stripe.Webhook.construct_event(payload, signature, config.STRIPE_WEBHOOK_SECRET)
        except stripe.error.SignatureVerificationError as exc:
            raise ReliefFundError("Invalid Stripe signature.", 400) from exc
        except ValueError as exc:
            raise ReliefFundError("Invalid Stripe payload.", 400) from exc


stripe_service = StripeService()

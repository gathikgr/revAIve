"""
revAIve — Razorpay Event Normalizer
Converts raw Razorpay webhook payloads into internal NormalizedDomainEvent objects.
Prevents Razorpay-specific JSON payload structures from leaking into core application code.
"""

import hashlib
from datetime import datetime, timezone
from typing import Dict, Any
from packages.razorpay.types import NormalizedDomainEvent


class EventNormalizer:
    @staticmethod
    def normalize_webhook(raw_body: bytes, payload_json: Dict[str, Any]) -> NormalizedDomainEvent:
        """Transforms raw Razorpay webhook JSON into NormalizedDomainEvent."""
        payload_hash = hashlib.sha256(raw_body).hexdigest()
        
        event_id = payload_json.get("event_id") or payload_json.get("id", f"evt_generated_{payload_hash[:12]}")
        event_type = payload_json.get("event", "payment.failed")
        
        # Extract entity dictionary safely
        entity_payload = {}
        payload_root = payload_json.get("payload", {})
        
        if "payment" in payload_root:
            entity_payload = payload_root.get("payment", {}).get("entity", {})
        elif "subscription" in payload_root:
            entity_payload = payload_root.get("subscription", {}).get("entity", {})
        elif "payment_link" in payload_root:
            entity_payload = payload_root.get("payment_link", {}).get("entity", {})
        else:
            entity_payload = payload_json

        # Parse timestamp
        created_ts = payload_json.get("created_at") or entity_payload.get("created_at")
        occurred_at = datetime.fromtimestamp(created_ts, timezone.utc) if created_ts else datetime.now(timezone.utc)

        amount = int(entity_payload.get("amount", 0))
        currency = entity_payload.get("currency", "INR")

        razorpay_payment_id = None
        if event_type.startswith("payment") or entity_payload.get("entity") == "payment":
            razorpay_payment_id = entity_payload.get("id") or entity_payload.get("payment_id")
        else:
            razorpay_payment_id = entity_payload.get("payment_id")

        razorpay_sub_id = None
        if event_type.startswith("subscription") or entity_payload.get("entity") == "subscription":
            razorpay_sub_id = entity_payload.get("id") or entity_payload.get("subscription_id")
        else:
            razorpay_sub_id = entity_payload.get("subscription_id")

        return NormalizedDomainEvent(
            event_id=event_id,
            provider="razorpay",
            event_type=event_type,
            razorpay_payment_id=razorpay_payment_id,
            razorpay_order_id=entity_payload.get("order_id"),
            razorpay_customer_id=entity_payload.get("customer_id"),
            razorpay_subscription_id=razorpay_sub_id,
            amount_in_minor=amount,
            currency=currency,
            error_code=entity_payload.get("error_code"),
            error_description=entity_payload.get("error_description"),
            issuer_bank=entity_payload.get("bank"),
            payment_method=entity_payload.get("method", "card"),
            occurred_at=occurred_at,
            raw_payload_hash=payload_hash
        )

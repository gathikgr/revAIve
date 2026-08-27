"""
revAIve — Razorpay Payment Links API Adapter
Official Endpoints:
- POST /v1/payment_links
- GET /v1/payment_links/{payment_link_id}
- POST /v1/payment_links/{payment_link_id}/cancel
"""

from typing import Optional
from packages.razorpay.client import RazorpayClient
from packages.razorpay.simulator import RazorpaySimulator
from packages.razorpay.types import RazorpayPaymentLinkEntity
from packages.shared.currency import assert_valid_currency


class PaymentLinksAdapter:
    def __init__(self, client: Optional[RazorpayClient] = None):
        self.client = client or RazorpayClient()

    async def create_payment_link(
        self,
        amount_in_minor: int,
        currency: str,
        description: str,
        customer_id: str,
        idempotency_key: str
    ) -> RazorpayPaymentLinkEntity:
        """Creates a Razorpay Payment Link for SMS/WhatsApp dunning re-engagement."""
        assert_valid_currency(currency)
        if not isinstance(amount_in_minor, int) or amount_in_minor <= 0:
            raise ValueError("amount_in_minor must be a positive integer in minor units (paise).")

        if self.client.config.is_demo:
            return RazorpaySimulator.create_payment_link(
                amount_in_minor=amount_in_minor,
                currency=currency,
                description=description,
                customer_id=customer_id,
                idempotency_key=idempotency_key
            )

        payload = {
            "amount": amount_in_minor,
            "currency": currency,
            "description": description,
            "customer": {"id": customer_id}
        }

        data = await self.client._request("POST", "/payment_links", json_data=payload, idempotency_key=idempotency_key)
        return RazorpayPaymentLinkEntity(**data)

    async def get_payment_link(self, payment_link_id: str) -> RazorpayPaymentLinkEntity:
        """Retrieves payment link status by ID."""
        if self.client.config.is_demo:
            return RazorpaySimulator.get_payment_link(payment_link_id)

        data = await self.client._request("GET", f"/payment_links/{payment_link_id}")
        return RazorpayPaymentLinkEntity(**data)

    async def cancel_payment_link(self, payment_link_id: str) -> RazorpayPaymentLinkEntity:
        """Cancels an active payment link."""
        if self.client.config.is_demo:
            return RazorpaySimulator.cancel_payment_link(payment_link_id)

        data = await self.client._request("POST", f"/payment_links/{payment_link_id}/cancel")
        return RazorpayPaymentLinkEntity(**data)

"""
revAIve — Razorpay Payments API Adapter
Official Endpoint: GET /v1/payments/{payment_id}
"""

from typing import Optional
from packages.razorpay.client import RazorpayClient
from packages.razorpay.simulator import RazorpaySimulator
from packages.razorpay.types import RazorpayPaymentEntity


class PaymentsAdapter:
    def __init__(self, client: Optional[RazorpayClient] = None):
        self.client = client or RazorpayClient()

    async def get_payment(self, payment_id: str) -> RazorpayPaymentEntity:
        """Retrieves payment details by ID."""
        if self.client.config.is_demo:
            return RazorpaySimulator.get_payment(payment_id)

        data = await self.client._request("GET", f"/payments/{payment_id}")
        return RazorpayPaymentEntity(**data)

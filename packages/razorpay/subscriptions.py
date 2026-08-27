"""
revAIve — Razorpay Subscriptions API Adapter
Official Endpoint: GET /v1/subscriptions/{subscription_id}
"""

from typing import Optional
from packages.razorpay.client import RazorpayClient
from packages.razorpay.simulator import RazorpaySimulator
from packages.razorpay.types import RazorpaySubscriptionEntity


class SubscriptionsAdapter:
    def __init__(self, client: Optional[RazorpayClient] = None):
        self.client = client or RazorpayClient()

    async def get_subscription(self, subscription_id: str) -> RazorpaySubscriptionEntity:
        """Retrieves subscription details by ID."""
        if self.client.config.is_demo:
            return RazorpaySimulator.get_subscription(subscription_id)

        data = await self.client._request("GET", f"/subscriptions/{subscription_id}")
        return RazorpaySubscriptionEntity(**data)

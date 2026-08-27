"""
revAIve — Razorpay Orders API Adapter
Official Endpoint: GET /v1/orders/{order_id}
"""

from typing import Optional
from packages.razorpay.client import RazorpayClient
from packages.razorpay.simulator import RazorpaySimulator
from packages.razorpay.types import RazorpayOrderEntity


class OrdersAdapter:
    def __init__(self, client: Optional[RazorpayClient] = None):
        self.client = client or RazorpayClient()

    async def get_order(self, order_id: str) -> RazorpayOrderEntity:
        """Retrieves order details by ID."""
        if self.client.config.is_demo:
            return RazorpaySimulator.get_order(order_id)

        data = await self.client._request("GET", f"/orders/{order_id}")
        return RazorpayOrderEntity(**data)

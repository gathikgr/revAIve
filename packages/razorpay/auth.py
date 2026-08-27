"""
revAIve — Razorpay Credentials & Mode Configuration
Loads and validates environment variables for Razorpay integration.
"""

import os


class RazorpayConfig:
    def __init__(self):
        self.key_id = os.environ.get("RAZORPAY_KEY_ID", "rzp_test_mock12345")
        self.key_secret = os.environ.get("RAZORPAY_KEY_SECRET", "mock_secret_67890")
        self.webhook_secret = os.environ.get("RAZORPAY_WEBHOOK_SECRET", "test_webhook_secret_12345")
        self.mode = os.environ.get("RAZORPAY_MODE", "DEMO").upper()

    @property
    def is_demo(self) -> bool:
        return self.mode == "DEMO"

    @property
    def is_test_mode(self) -> bool:
        return self.mode == "RAZORPAY_TEST"

    def get_basic_auth_tuple(self) -> tuple[str, str]:
        if not self.key_id or not self.key_secret:
            raise ValueError("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be configured.")
        return (self.key_id, self.key_secret)

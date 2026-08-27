"""
revAIve Razorpay Adapter Package
"""

from packages.razorpay.auth import RazorpayConfig
from packages.razorpay.client import RazorpayClient
from packages.razorpay.simulator import RazorpaySimulator
from packages.razorpay.payments import PaymentsAdapter
from packages.razorpay.orders import OrdersAdapter
from packages.razorpay.payment_links import PaymentLinksAdapter
from packages.razorpay.subscriptions import SubscriptionsAdapter
from packages.razorpay.webhooks import verify_webhook_signature, assert_valid_webhook_signature
from packages.razorpay.normalization import EventNormalizer
from packages.razorpay.errors import (
    RazorpayError,
    RazorpayAuthError,
    RazorpayBadRequestError,
    RazorpayRateLimitError,
    RazorpayNetworkError,
    RazorpayProviderError,
    RazorpayInvalidSignatureError
)
from packages.razorpay.types import (
    RazorpayPaymentEntity,
    RazorpayPaymentLinkEntity,
    RazorpaySubscriptionEntity,
    RazorpayOrderEntity,
    NormalizedDomainEvent
)

__all__ = [
    "RazorpayConfig",
    "RazorpayClient",
    "RazorpaySimulator",
    "PaymentsAdapter",
    "OrdersAdapter",
    "PaymentLinksAdapter",
    "SubscriptionsAdapter",
    "verify_webhook_signature",
    "assert_valid_webhook_signature",
    "EventNormalizer",
    "RazorpayError",
    "RazorpayAuthError",
    "RazorpayBadRequestError",
    "RazorpayRateLimitError",
    "RazorpayNetworkError",
    "RazorpayProviderError",
    "RazorpayInvalidSignatureError",
    "RazorpayPaymentEntity",
    "RazorpayPaymentLinkEntity",
    "RazorpaySubscriptionEntity",
    "RazorpayOrderEntity",
    "NormalizedDomainEvent",
]

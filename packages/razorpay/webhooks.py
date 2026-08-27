"""
revAIve — Razorpay Webhook Ingestion & Signature Verifier
Verifies X-Razorpay-Signature header using HMAC-SHA256 and constant-time comparison.
"""

import hmac
import hashlib
from packages.razorpay.errors import RazorpayInvalidSignatureError


def verify_webhook_signature(raw_body: bytes, signature: str, secret: str) -> bool:
    """
    Verifies Razorpay X-Razorpay-Signature HMAC-SHA256 signature against raw HTTP byte payload.
    Uses constant-time comparison (hmac.compare_digest) to eliminate timing attacks.
    """
    if not signature or not secret or not raw_body:
        return False

    computed_hmac = hmac.new(
        key=secret.encode("utf-8"),
        msg=raw_body,
        digestmod=hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(computed_hmac, signature)


def assert_valid_webhook_signature(raw_body: bytes, signature: str, secret: str) -> None:
    """Raises RazorpayInvalidSignatureError if HMAC-SHA256 signature does not match."""
    if not verify_webhook_signature(raw_body, signature, secret):
        raise RazorpayInvalidSignatureError("Razorpay webhook HMAC-SHA256 signature verification failed.")

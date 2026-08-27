"""
revAIve — Razorpay Webhook Signature Verification
Guarantees raw HTTP body HMAC-SHA256 validation to prevent payload spoofing.
"""

import hmac
import hashlib


def verify_razorpay_signature(raw_body: bytes, signature: str, secret: str) -> bool:
    """
    Verifies Razorpay X-Razorpay-Signature HMAC-SHA256 signature against raw byte payload.
    Uses constant-time comparison to prevent timing attacks.
    """
    if not signature or not secret or not raw_body:
        return False

    computed_hmac = hmac.new(
        key=secret.encode("utf-8"),
        msg=raw_body,
        digestmod=hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(computed_hmac, signature)

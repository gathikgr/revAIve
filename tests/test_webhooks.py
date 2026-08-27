"""
Unit and integration tests for Razorpay signature verification and Webhook routes.
"""

import hmac
import hashlib
import json
import pytest
from packages.razorpay.signature import verify_razorpay_signature


def test_signature_verification_success():
    secret = "test_secret_123"
    raw_body = b'{"event":"payment.failed"}'
    signature = hmac.new(secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()

    assert verify_razorpay_signature(raw_body, signature, secret) is True


def test_signature_verification_failure():
    secret = "test_secret_123"
    raw_body = b'{"event":"payment.failed"}'
    invalid_signature = "0" * 64

    assert verify_razorpay_signature(raw_body, invalid_signature, secret) is False

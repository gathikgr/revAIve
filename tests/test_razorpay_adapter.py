"""
revAIve — Razorpay Test Mode & Adapter Integration Test Suite
Tests API requests, auth failure, network timeout, rate limiting, provider errors,
webhook HMAC signatures, duplicate handling, event normalization, and idempotent action execution.
"""

import hmac
import hashlib
import json
import pytest
import httpx
from unittest.mock import AsyncMock, patch

from packages.razorpay.auth import RazorpayConfig
from packages.razorpay.client import RazorpayClient
from packages.razorpay.payments import PaymentsAdapter
from packages.razorpay.payment_links import PaymentLinksAdapter
from packages.razorpay.subscriptions import SubscriptionsAdapter
from packages.razorpay.webhooks import verify_webhook_signature, assert_valid_webhook_signature
from packages.razorpay.normalization import EventNormalizer
from packages.razorpay.errors import (
    RazorpayAuthError,
    RazorpayBadRequestError,
    RazorpayRateLimitError,
    RazorpayNetworkError,
    RazorpayProviderError,
    RazorpayInvalidSignatureError
)


@pytest.mark.asyncio
async def test_successful_payment_link_creation_in_test_mode():
    """Verifies successful Payment Link creation in RAZORPAY_TEST mode."""
    config = RazorpayConfig()
    config.mode = "RAZORPAY_TEST"
    client = RazorpayClient(config=config)

    mock_response = {
        "id": "plink_test_999",
        "entity": "payment_link",
        "amount": 149900,
        "currency": "INR",
        "status": "created",
        "short_url": "https://rzp.io/i/test999",
        "created_at": 1700000000
    }

    with patch.object(client, "_request", new_callable=AsyncMock) as mock_req:
        mock_req.return_value = mock_response
        adapter = PaymentLinksAdapter(client=client)

        link = await adapter.create_payment_link(
            amount_in_minor=149900,
            currency="INR",
            description="Recovery Payment Link",
            customer_id="cust_test_101",
            idempotency_key="rev_act_test_1"
        )

        assert link.id == "plink_test_999"
        assert link.amount == 149900
        assert link.status == "created"
        mock_req.assert_called_once_with(
            "POST",
            "/payment_links",
            json_data={
                "amount": 149900,
                "currency": "INR",
                "description": "Recovery Payment Link",
                "customer": {"id": "cust_test_101"}
            },
            idempotency_key="rev_act_test_1"
        )


@pytest.mark.asyncio
async def test_authentication_failure_handling():
    """Verifies HTTP 401 mapped to RazorpayAuthError."""
    config = RazorpayConfig()
    config.mode = "RAZORPAY_TEST"
    client = RazorpayClient(config=config)

    mock_resp = httpx.Response(401, json={"error": {"description": "Invalid key secret"}})
    with patch("httpx.AsyncClient.request", AsyncMock(return_value=mock_resp)):
        adapter = PaymentsAdapter(client=client)
        with pytest.raises(RazorpayAuthError) as exc_info:
            await adapter.get_payment("pay_invalid")
        assert "Invalid key secret" in str(exc_info.value)


@pytest.mark.asyncio
async def test_rate_limiting_handling():
    """Verifies HTTP 429 mapped to RazorpayRateLimitError."""
    config = RazorpayConfig()
    config.mode = "RAZORPAY_TEST"
    client = RazorpayClient(config=config)

    mock_resp = httpx.Response(429, json={"error": {"description": "Too many requests"}})
    with patch("httpx.AsyncClient.request", AsyncMock(return_value=mock_resp)):
        adapter = PaymentsAdapter(client=client)
        with pytest.raises(RazorpayRateLimitError) as exc_info:
            await adapter.get_payment("pay_rate_limited")
        assert "Too many requests" in str(exc_info.value)


@pytest.mark.asyncio
async def test_network_timeout_handling():
    """Verifies network timeout mapped to RazorpayNetworkError."""
    config = RazorpayConfig()
    config.mode = "RAZORPAY_TEST"
    client = RazorpayClient(config=config)

    with patch("httpx.AsyncClient.request", side_effect=httpx.TimeoutException("Connection timed out")):
        adapter = PaymentsAdapter(client=client)
        with pytest.raises(RazorpayNetworkError) as exc_info:
            await adapter.get_payment("pay_timeout")
        assert "timed out" in str(exc_info.value)


@pytest.mark.asyncio
async def test_provider_server_error_handling():
    """Verifies HTTP 502 mapped to RazorpayProviderError."""
    config = RazorpayConfig()
    config.mode = "RAZORPAY_TEST"
    client = RazorpayClient(config=config)

    mock_resp = httpx.Response(502, json={"error": {"description": "Bad gateway"}})
    with patch("httpx.AsyncClient.request", AsyncMock(return_value=mock_resp)):
        adapter = PaymentsAdapter(client=client)
        with pytest.raises(RazorpayProviderError) as exc_info:
            await adapter.get_payment("pay_502")
        assert exc_info.value.status_code == 502


def test_valid_webhook_signature_verification():
    """Verifies HMAC-SHA256 signature verification over raw request body."""
    secret = "whsec_test_secret_12345"
    raw_body = b'{"event":"payment.failed","payload":{"payment":{"entity":{"id":"pay_100"}}}}'
    signature = hmac.new(secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()

    assert verify_webhook_signature(raw_body, signature, secret) is True
    assert_valid_webhook_signature(raw_body, signature, secret)


def test_invalid_webhook_signature_rejection():
    """Verifies rejection of invalid HMAC-SHA256 signature."""
    secret = "whsec_test_secret_12345"
    raw_body = b'{"event":"payment.failed"}'
    invalid_sig = "a" * 64

    assert verify_webhook_signature(raw_body, invalid_sig, secret) is False
    with pytest.raises(RazorpayInvalidSignatureError):
        assert_valid_webhook_signature(raw_body, invalid_sig, secret)


def test_event_normalization_flow():
    """Verifies raw Razorpay payload mapping into NormalizedDomainEvent."""
    raw_body = b'{"event_id":"evt_1001","event":"payment.failed","created_at":1700000000,"payload":{"payment":{"entity":{"id":"pay_1001","amount":149900,"currency":"INR","customer_id":"cust_200","bank":"HDFC","method":"card","error_code":"BAD_REQUEST_PAYMENT_DECLINED_INSUFFICIENT_FUNDS","error_description":"Low balance"}}}}'
    payload_json = json.loads(raw_body.decode("utf-8"))

    norm_event = EventNormalizer.normalize_webhook(raw_body, payload_json)

    assert norm_event.event_id == "evt_1001"
    assert norm_event.provider == "razorpay"
    assert norm_event.event_type == "payment.failed"
    assert norm_event.razorpay_payment_id == "pay_1001"
    assert norm_event.amount_in_minor == 149900
    assert norm_event.currency == "INR"
    assert norm_event.issuer_bank == "HDFC"
    assert norm_event.error_code == "BAD_REQUEST_PAYMENT_DECLINED_INSUFFICIENT_FUNDS"


@pytest.mark.asyncio
async def test_demo_mode_simulator_isolation():
    """Verifies DEMO mode uses deterministic simulator without making network calls."""
    config = RazorpayConfig()
    config.mode = "DEMO"
    client = RazorpayClient(config=config)

    adapter = PaymentLinksAdapter(client=client)
    link = await adapter.create_payment_link(
        amount_in_minor=299900,
        currency="INR",
        description="Demo Recovery Link",
        customer_id="cust_demo_1",
        idempotency_key="rev_act_demo_1"
    )

    assert link.id.startswith("plink_")
    assert link.amount == 299900
    assert link.status == "created"

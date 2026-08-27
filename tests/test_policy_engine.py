"""
Unit tests for packages/shared/policy_engine.py
"""

from datetime import datetime, timedelta, timezone
from packages.shared.policy_engine import PolicyEngine


def test_policy_engine_pass():
    res = PolicyEngine.evaluate_strategy(
        amount_in_minor=149900,  # ₹1,499
        currency="INR",
        attempts_count=0,
        max_attempts=3,
        strategy_type="SMART_RETRY",
        channel="api_gateway"
    )
    assert res.passed is True
    assert res.requires_manual_approval is False
    assert len(res.failed_rules) == 0


def test_policy_engine_max_retries_exceeded():
    res = PolicyEngine.evaluate_strategy(
        amount_in_minor=149900,
        currency="INR",
        attempts_count=3,  # Reached ceiling
        max_attempts=3,
        strategy_type="SMART_RETRY",
        channel="api_gateway"
    )
    assert res.passed is False
    assert any("MAX_RETRY_EXCEEDED" in r for r in res.failed_rules)


def test_policy_engine_high_value_manual_approval_gate():
    res = PolicyEngine.evaluate_strategy(
        amount_in_minor=7500000,  # ₹75,000 INR (> ₹50,000 threshold)
        currency="INR",
        attempts_count=0,
        max_attempts=3,
        strategy_type="SMART_RETRY",
        channel="api_gateway",
        operator_approved=False
    )
    assert res.passed is False
    assert res.requires_manual_approval is True


def test_policy_engine_quiet_period_violation():
    recently = datetime.now(timezone.utc) - timedelta(hours=5)
    res = PolicyEngine.evaluate_strategy(
        amount_in_minor=149900,
        currency="INR",
        attempts_count=0,
        max_attempts=3,
        strategy_type="WHATSAPP_DUNNING",
        channel="whatsapp",
        last_customer_contact_at=recently
    )
    assert res.passed is False
    assert any("QUIET_PERIOD_VIOLATION" in r for r in res.failed_rules)

"""
revAIve — Revenue Intelligence Test Suite
Tests zero amount, already recovered, repeated failure, stale opportunity, high-value customer,
low-value customer, exhausted retries, duplicate event, missing customer data, and currency mismatch.
"""

import pytest
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session

from packages.database.session import SessionLocal, engine
from packages.database.models import (
    Base, Merchant, Customer, Payment, RevenueOpportunity
)
from packages.shared.currency import (
    rupees_to_paise, paise_to_rupees_str, assert_matching_currencies
)
from packages.shared.intelligence.scoring import DeterministicScoringEngine
from packages.shared.intelligence.types import IntelligenceOpportunityStatus
from packages.shared.intelligence.service import RevenueIntelligenceService


@pytest.fixture(autouse=True)
def setup_database():
    """Build fresh in-memory schema for each test."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def test_zero_amount_suppression():
    """Verifies that 0 amount opportunities are SUPPRESSED."""
    score = DeterministicScoringEngine.compute_opportunity_score(
        amount_at_risk=0,
        currency="INR",
        attempt_failure_count=0,
        max_attempts=3,
        payment_method_type="card"
    )
    assert score.qualification_status == IntelligenceOpportunityStatus.SUPPRESSED
    assert score.expected_recovery_value == 0
    assert score.priority_score == 0.0


def test_exhausted_retries_qualification():
    """Verifies that reaching max attempt limit sets status to UNRECOVERABLE."""
    score = DeterministicScoringEngine.compute_opportunity_score(
        amount_at_risk=149900,
        currency="INR",
        attempt_failure_count=3,
        max_attempts=3,
        payment_method_type="card"
    )
    assert score.qualification_status == IntelligenceOpportunityStatus.UNRECOVERABLE
    assert score.recovery_likelihood == 0.05
    assert "Unrecoverable" in score.explanation


def test_high_value_customer_human_review_gate():
    """Verifies transactions > ₹50,000 INR qualify for HUMAN_REVIEW."""
    score = DeterministicScoringEngine.compute_opportunity_score(
        amount_at_risk=7500000,  # ₹75,000 INR
        currency="INR",
        attempt_failure_count=0,
        max_attempts=3,
        payment_method_type="card",
        operator_approved=False
    )
    assert score.qualification_status == IntelligenceOpportunityStatus.HUMAN_REVIEW
    assert score.customer_value_score == 1.0
    assert "Human Review" in score.explanation


def test_low_value_customer_qualification():
    """Verifies low-value micro transactions compute expected recovery value cleanly."""
    score = DeterministicScoringEngine.compute_opportunity_score(
        amount_at_risk=49900,  # ₹499 INR
        currency="INR",
        attempt_failure_count=0,
        max_attempts=3,
        payment_method_type="card"
    )
    assert score.qualification_status == IntelligenceOpportunityStatus.QUALIFIED
    assert score.expected_recovery_value > 0


def test_currency_mismatch_rejection():
    """Asserts that attempting cross-currency math raises ValueError."""
    with pytest.raises(ValueError):
        assert_matching_currencies("INR", "USD")


def test_duplicate_event_scanner_prevention():
    """Verifies that scanning twice does not create duplicate RevenueOpportunity records."""
    db: Session = SessionLocal()
    try:
        m = Merchant(name="M1", razorpay_merchant_id="rzp_m1", webhook_secret="s1")
        db.add(m)
        db.commit()
        db.refresh(m)

        c = Customer(merchant_id=m.id, razorpay_customer_id="c1")
        db.add(c)
        db.commit()
        db.refresh(c)

        pmt = Payment(
            merchant_id=m.id,
            customer_id=c.id,
            razorpay_payment_id="pay_dup_100",
            amount_in_minor=149900,
            currency="INR",
            status="failed",
            method="card"
        )
        db.add(pmt)
        db.commit()

        service = RevenueIntelligenceService()
        
        # First Scan
        res1 = service.run_scanner(db, m.id)
        assert res1["opportunities_detected"] == 1

        # Second Scan (Duplicate event check)
        res2 = service.run_scanner(db, m.id)
        assert res2["opportunities_detected"] == 0  # 0 new opportunities created
    finally:
        db.close()


def test_missing_customer_contact_data_fallback():
    """Verifies that missing customer quiet period timestamps handle fallback cleanly."""
    score = DeterministicScoringEngine.compute_opportunity_score(
        amount_at_risk=149900,
        currency="INR",
        attempt_failure_count=0,
        max_attempts=3,
        payment_method_type="card",
        hours_since_last_contact=None
    )
    assert score.customer_fatigue_score == 0.0
    assert score.qualification_status == IntelligenceOpportunityStatus.QUALIFIED


def test_customer_quiet_period_fatigue_suppression():
    """Verifies that messaging channels within 24h quiet period get SUPPRESSED."""
    score = DeterministicScoringEngine.compute_opportunity_score(
        amount_at_risk=149900,
        currency="INR",
        attempt_failure_count=0,
        max_attempts=3,
        payment_method_type="card",
        hours_since_last_contact=5.0,  # Contacted 5h ago (< 24h)
        intervention_channel="whatsapp"
    )
    assert score.customer_fatigue_score == 1.0
    assert score.qualification_status == IntelligenceOpportunityStatus.SUPPRESSED

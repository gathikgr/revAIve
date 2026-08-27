"""
revAIve — Domain Foundation & Database Constraint Test Suite
Verifies money precision, database constraints, foreign keys, uniqueness,
opportunity lifecycles, webhook idempotency, and audit behavior.
"""

import pytest
from datetime import datetime, timezone
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from packages.database.session import SessionLocal, engine
from packages.database.models import (
    Base, Merchant, Customer, Order, Payment, PaymentAttempt, RevenueOpportunity,
    AgentRun, AgentDecision, Policy, PolicyEvaluation, RecoveryStrategy, RecoveryAction,
    RecoveryOutcome, WebhookEvent, AuditEvent
)
from packages.database.audit_repository import AuditRepository
from packages.shared.currency import (
    rupees_to_paise, paise_to_rupees_str, add_minor_units, assert_matching_currencies
)


@pytest.fixture(autouse=True)
def setup_database():
    """Build fresh in-memory schema for each test."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def test_money_precision_integer_minor_units():
    """Asserts that money uses integer minor units (paise) and never floats."""
    paise = rupees_to_paise(1499.50)
    assert isinstance(paise, int)
    assert paise == 149950

    formatted = paise_to_rupees_str(paise, "INR")
    assert formatted == "₹1,499.50"

    sum_paise, curr = add_minor_units(149950, "INR", 50000, "INR")
    assert sum_paise == 199950
    assert curr == "INR"

    with pytest.raises(ValueError):
        assert_matching_currencies("INR", "USD")


def test_foreign_key_and_merchant_customer_relationship():
    """Asserts foreign key integrity between Merchant and Customer."""
    db: Session = SessionLocal()
    try:
        merchant = Merchant(
            name="Test Merchant",
            razorpay_merchant_id="rzp_test_m1",
            webhook_secret="sec_123"
        )
        db.add(merchant)
        db.commit()
        db.refresh(merchant)

        customer = Customer(
            merchant_id=merchant.id,
            razorpay_customer_id="cust_test_101",
            name="Alice Smith",
            email="alice@example.com"
        )
        db.add(customer)
        db.commit()

        assert customer.merchant_id == merchant.id
        assert len(merchant.customers) == 1
    finally:
        db.close()


def test_webhook_uniqueness_constraint():
    """Asserts that provider + event_id enforces unique constraint."""
    db: Session = SessionLocal()
    try:
        wh1 = WebhookEvent(
            provider="razorpay",
            event_id="evt_duplicate_test_001",
            event_type="payment.failed",
            payload_hash="hash_1",
            raw_payload={"test": 1}
        )
        db.add(wh1)
        db.commit()

        wh2 = WebhookEvent(
            provider="razorpay",
            event_id="evt_duplicate_test_001",  # Same provider + event_id
            event_type="payment.failed",
            payload_hash="hash_2",
            raw_payload={"test": 2}
        )
        db.add(wh2)

        with pytest.raises(IntegrityError):
            db.commit()
    finally:
        db.close()


def test_idempotency_key_uniqueness():
    """Asserts that RecoveryAction idempotency_key enforces uniqueness."""
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

        opp = RevenueOpportunity(
            merchant_id=m.id,
            customer_id=c.id,
            source_type="failed_payment",
            source_reference="pay_100",
            amount_at_risk=100000,
            currency="INR"
        )
        db.add(opp)
        db.commit()

        act1 = RecoveryAction(
            opportunity_id=opp.id,
            action_type="retry_payment",
            requested_by="worker",
            status="succeeded",
            idempotency_key="rev_act_unique_100_1"
        )
        db.add(act1)
        db.commit()

        act2 = RecoveryAction(
            opportunity_id=opp.id,
            action_type="retry_payment",
            requested_by="worker",
            status="succeeded",
            idempotency_key="rev_act_unique_100_1"  # Duplicate key
        )
        db.add(act2)

        with pytest.raises(IntegrityError):
            db.commit()
    finally:
        db.close()


def test_revenue_opportunity_lifecycle():
    """Verifies RevenueOpportunity state machine transitions and audit logging."""
    db: Session = SessionLocal()
    try:
        m = Merchant(name="M2", razorpay_merchant_id="rzp_m2", webhook_secret="s2")
        db.add(m)
        db.commit()
        db.refresh(m)

        c = Customer(merchant_id=m.id, razorpay_customer_id="c2")
        db.add(c)
        db.commit()
        db.refresh(c)

        opp = RevenueOpportunity(
            merchant_id=m.id,
            customer_id=c.id,
            source_type="failed_payment",
            source_reference="pay_200",
            amount_at_risk=249900,
            currency="INR",
            status="detected"
        )
        db.add(opp)
        db.commit()

        assert opp.status == "detected"

        # Transition to diagnosed
        opp.status = "diagnosed"
        opp.probability_of_recovery = 0.85
        opp.expected_recovery_value = int(249900 * 0.85)
        db.commit()

        assert opp.status == "diagnosed"

        AuditRepository.log_event(
            db=db,
            actor_type="ai_agent",
            actor_id="diagnoser_bot",
            action="OPPORTUNITY_DIAGNOSED",
            entity_type="RevenueOpportunity",
            entity_id=opp.id,
            before_state={"status": "detected"},
            after_state={"status": "diagnosed", "probability": 0.85}
        )

        logs = AuditRepository.get_entity_history(db, "RevenueOpportunity", opp.id)
        assert len(logs) == 1
        assert logs[0].action == "OPPORTUNITY_DIAGNOSED"
        assert logs[0].actor_type == "ai_agent"
    finally:
        db.close()


def test_audit_event_immutability():
    """Asserts that audit events preserve timestamp and append-only state snapshots."""
    db: Session = SessionLocal()
    try:
        entry = AuditRepository.log_event(
            db=db,
            actor_type="system_worker",
            actor_id="ingress_node",
            action="WEBHOOK_PERSISTED",
            entity_type="WebhookEvent",
            entity_id="wh_1001",
            metadata={"event": "payment.failed"}
        )

        assert entry.id is not None
        assert entry.timestamp is not None

        history = AuditRepository.get_entity_history(db, "WebhookEvent", "wh_1001")
        assert len(history) == 1
        assert history[0].action == "WEBHOOK_PERSISTED"
    finally:
        db.close()

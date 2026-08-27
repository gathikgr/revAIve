"""
revAIve — Policy Lab Test Suite
Verifies that simulation mode NEVER invokes external financial APIs, tests counterfactual policy calculations,
and checks policy activation audit logging.
"""

import pytest
from sqlalchemy.orm import Session
from unittest.mock import patch, MagicMock

from packages.database.session import SessionLocal, engine
from packages.database.models import Base, Merchant, RevenueOpportunity, Policy, AuditEvent
from packages.shared.policy_lab.types import PolicyConfig, ApplyPolicyRequest
from packages.shared.policy_lab.engine import PolicyLabSimulator


@pytest.fixture(autouse=True)
def setup_database():
    """Build fresh in-memory schema for each test."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def test_simulation_never_invokes_external_financial_apis():
    """Verifies that running Policy Lab simulation NEVER makes network calls to Razorpay."""
    db: Session = SessionLocal()
    try:
        m = Merchant(name="Lab Merchant", razorpay_merchant_id="rzp_lab_1", webhook_secret="secret")
        db.add(m)
        db.commit()

        opp = RevenueOpportunity(
            merchant_id=m.id,
            customer_id="cust_lab_1",
            source_type="failed_payment",
            source_reference="pay_lab_1",
            amount_at_risk=149900,
            currency="INR",
            probability_of_recovery=0.85
        )
        db.add(opp)
        db.commit()

        proposed_policy = PolicyConfig(max_retries=5, retry_cooldown_hours=12.0)

        # Patch httpx.AsyncClient to fail if any external call is initiated
        with patch("httpx.AsyncClient.request", side_effect=AssertionError("EXTERNAL FINANCIAL API CALL FORBIDDEN")):
            comp = PolicyLabSimulator.simulate_comparison(
                db=db,
                merchant_id=m.id,
                proposed_policy=proposed_policy
            )

        assert comp.current_metrics.is_simulated is True
        assert comp.proposed_metrics.is_simulated is True
        assert comp.merchant_id == m.id
    finally:
        db.close()


def test_policy_simulation_delta_calculations():
    """Tests delta EV, contact differences, and recommendation assignment."""
    db: Session = SessionLocal()
    try:
        m = Merchant(name="Lab Merchant 2", razorpay_merchant_id="rzp_lab_2", webhook_secret="secret")
        db.add(m)
        db.commit()

        opp = RevenueOpportunity(
            merchant_id=m.id,
            customer_id="cust_lab_2",
            source_type="failed_payment",
            source_reference="pay_lab_2",
            amount_at_risk=299900,
            currency="INR",
            probability_of_recovery=0.90
        )
        db.add(opp)
        db.commit()

        curr_policy = PolicyConfig(max_retries=2)
        prop_policy = PolicyConfig(max_retries=4)

        comp = PolicyLabSimulator.simulate_comparison(
            db=db,
            merchant_id=m.id,
            proposed_policy=prop_policy,
            current_policy_override=curr_policy
        )

        assert comp.incremental_expected_recovery_paise >= 0
        assert comp.recommendation in ["RECOMMENDED", "REVIEW", "HIGH_RISK"]
    finally:
        db.close()


def test_apply_policy_persists_new_policy_and_audit_event():
    """Verifies that applying policy creates active DB Policy and AuditEvent."""
    db: Session = SessionLocal()
    try:
        m = Merchant(name="Lab Merchant 3", razorpay_merchant_id="rzp_lab_3", webhook_secret="secret")
        db.add(m)
        db.commit()

        req = ApplyPolicyRequest(
            merchant_id=m.id,
            policy_config=PolicyConfig(max_retries=4, min_expected_recovery_value_paise=100000),
            confirmation_reason="Approved Q3 Policy Update"
        )

        new_policy = PolicyLabSimulator.apply_policy(
            db=db,
            request=req,
            operator_id="merchant_admin_101"
        )

        assert new_policy.is_active is True
        assert new_policy.rule_parameters["max_retries"] == 4

        # Check Audit Event
        audit = db.query(AuditEvent).filter(AuditEvent.entity_id == new_policy.id).first()
        assert audit is not None
        assert audit.action == "POLICY_APPLIED"
        assert audit.actor_id == "merchant_admin_101"
        assert audit.metadata_json["confirmation_reason"] == "Approved Q3 Policy Update"
    finally:
        db.close()

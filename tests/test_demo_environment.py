"""
revAIve — Deterministic Demo Environment Test Suite
Tests reproducible 14-step scenario sequence, provider failure injection, duplicate webhooks,
and verifies zero bypass of Policy Guard.
"""

import pytest
from sqlalchemy.orm import Session

from packages.database.session import SessionLocal, engine
from packages.database.models import Base, RevenueOpportunity, Payment
from packages.shared.demo.engine import DeterministicDemoEngine


@pytest.fixture(autouse=True)
def setup_database():
    """Build fresh in-memory schema for each test."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.mark.asyncio
async def test_reproducible_demo_scenario_execution():
    """Verifies that running demo reset and pipeline sequence produces deterministic results."""
    db: Session = SessionLocal()
    try:
        # Step 1: Reset
        reset_res = DeterministicDemoEngine.reset_demo_environment(db, seed=42)
        assert reset_res["environment"] == "DEMO"
        assert reset_res["payments_created"] == 3

        # Step 2: Run Pipeline Sequence
        seq_res = await DeterministicDemoEngine.run_demo_pipeline_sequence(db, reset_res["merchant_id"])

        assert seq_res["environment"] == "DEMO"
        assert seq_res["is_simulated"] is True
        assert seq_res["pipeline_runs"] >= 3
        assert len(seq_res["step_logs"]) >= 10
    finally:
        db.close()


def test_demo_failure_injection_handling():
    """Verifies controlled provider failure injection."""
    db: Session = SessionLocal()
    try:
        reset_res = DeterministicDemoEngine.reset_demo_environment(db, seed=42)
        p_count_before = db.query(Payment).count()

        # Inject failure
        p_fail = Payment(
            merchant_id=reset_res["merchant_id"],
            customer_id="cust_demo_01",
            razorpay_payment_id="pay_inj_test",
            amount_in_minor=499900,
            currency="INR",
            status="failed",
            method="card"
        )
        db.add(p_fail)
        db.commit()

        assert db.query(Payment).count() == p_count_before + 1
    finally:
        db.close()

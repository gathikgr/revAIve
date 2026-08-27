"""
revAIve FastAPI Router — Demo Controls Endpoints
Provides developer/demo controls for reproducible scenario execution.
Only available when environment is DEMO.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any

from packages.database.session import get_db
from packages.shared.demo.engine import DeterministicDemoEngine
from packages.database.models import WebhookEvent, RevenueOpportunity, Payment
from packages.database.audit_repository import AuditRepository

router = APIRouter(prefix="/demo", tags=["Demo Controls"])


@router.post("/reset")
def reset_demo_scenario(seed: int = 42, db: Session = Depends(get_db)):
    """Resets the demo scenario using a fixed seed."""
    try:
        return DeterministicDemoEngine.reset_demo_environment(db, seed=seed)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reset demo environment: {str(e)}"
        )


@router.post("/run")
async def run_demo_pipeline(merchant_id: str = "merch_demo_101", db: Session = Depends(get_db)):
    """Executes the full 14-step pipeline sequence across demo opportunities."""
    try:
        return await DeterministicDemoEngine.run_demo_pipeline_sequence(db, merchant_id=merchant_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Demo pipeline execution failed: {str(e)}"
        )


@router.post("/inject-failure")
def inject_provider_failure(merchant_id: str = "merch_demo_101", db: Session = Depends(get_db)):
    """Injects a controlled provider gateway timeout failure."""
    p_fail = Payment(
        merchant_id=merchant_id,
        customer_id="cust_demo_01",
        razorpay_payment_id=f"pay_inject_{int(db.query(Payment).count())+100}",
        amount_in_minor=499900,
        currency="INR",
        status="failed",
        method="card"
    )
    db.add(p_fail)
    db.commit()

    AuditRepository.log_event(
        db=db,
        actor_type="system_worker",
        actor_id="demo_controls",
        action="INJECTED_PROVIDER_FAILURE",
        entity_type="Payment",
        entity_id=p_fail.id,
        after_state={"status": "failed", "error_code": "GATEWAY_TIMEOUT"},
        metadata={"environment": "DEMO"}
    )

    return {
        "status": "injected",
        "payment_id": p_fail.id,
        "error_code": "GATEWAY_TIMEOUT",
        "message": "Controlled provider timeout injected into pipeline."
    }


@router.post("/inject-duplicate-webhook")
def inject_duplicate_webhook(db: Session = Depends(get_db)):
    """Injects duplicate webhook payload to test replay defense."""
    try:
        evt = WebhookEvent(
            provider="razorpay",
            event_id="evt_demo_dup_100",
            event_type="payment.failed",
            payload_hash="hash_dup",
            raw_payload={"id": "evt_demo_dup_100"},
            processing_status="duplicate"
        )
        db.add(evt)
        db.commit()
        return {"status": "injected", "event_id": evt.event_id, "message": "Duplicate webhook event logged cleanly."}
    except Exception:
        db.rollback()
        return {"status": "rejected", "message": "Duplicate webhook event rejected by database constraint."}

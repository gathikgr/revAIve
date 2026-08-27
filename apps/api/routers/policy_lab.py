"""
revAIve FastAPI Router — Policy Lab Endpoints
Provides simulation endpoint for counterfactual policy testing and apply endpoint with audit logging.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any

from packages.database.session import get_db
from packages.shared.policy_lab.types import (
    PolicyConfig,
    PolicySimulationComparison,
    ApplyPolicyRequest
)
from packages.shared.policy_lab.engine import PolicyLabSimulator

router = APIRouter(prefix="/policy-lab", tags=["Policy Lab"])


@router.post("/simulate", response_model=PolicySimulationComparison)
def simulate_policy_change(
    merchant_id: str,
    proposed_policy: PolicyConfig,
    db: Session = Depends(get_db)
):
    """
    Runs counterfactual simulation comparing current merchant policy vs proposed policy.
    MUST NEVER INVOKE REAL RAZORPAY APIS OR EXECUTE FINANCIAL ACTIONS.
    All outputs are explicitly labeled SIMULATED.
    """
    try:
        return PolicyLabSimulator.simulate_comparison(
            db=db,
            merchant_id=merchant_id,
            proposed_policy=proposed_policy
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Policy simulation error: {str(e)}"
        )


@router.post("/apply", status_code=status.HTTP_200_OK)
def apply_policy_change(
    request: ApplyPolicyRequest,
    db: Session = Depends(get_db)
):
    """
    Applies proposed policy to production DB after explicit operator confirmation.
    Generates immutable AuditEvent record.
    """
    try:
        new_policy = PolicyLabSimulator.apply_policy(
            db=db,
            request=request
        )
        return {
            "status": "applied",
            "policy_id": new_policy.id,
            "merchant_id": new_policy.merchant_id,
            "message": "Policy change applied successfully and recorded in audit log."
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to apply policy: {str(e)}"
        )

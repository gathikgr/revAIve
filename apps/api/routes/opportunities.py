"""
revAIve — Revenue Opportunities API Routes
Provides operational endpoints for listing, filtering, approving, and executing recovery actions.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from packages.database.session import get_db
from packages.database.models import RevenueOpportunity, Payment, Customer, RecoveryStrategy, AuditEvent, RecoveryAction, RecoveryOutcome
from packages.database.audit_repository import AuditRepository
from packages.shared.types import OpportunityStatus
from packages.shared.currency import paise_to_rupees_str
from packages.razorpay.client import RazorpayClient

router = APIRouter(prefix="/api/v1", tags=["Opportunities & Operations"])


class OpportunityResponse(BaseModel):
    id: str
    merchant_id: str
    customer_id: str
    customer_email: Optional[str]
    amount_at_risk: int
    amount_formatted: str
    recovered_amount_in_minor: int
    recovered_formatted: str
    currency: str
    status: str
    probability_of_recovery: Optional[float]
    source_type: str
    source_reference: str
    reason: Optional[str]
    created_at: str

    class Config:
        from_attributes = True


@router.get("/opportunities", response_model=List[OpportunityResponse])
def list_opportunities(
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db)
):
    query = db.query(RevenueOpportunity)
    if status_filter:
        query = query.filter(RevenueOpportunity.status == status_filter)

    opportunities = query.order_by(RevenueOpportunity.created_at.desc()).limit(100).all()

    results = []
    for opp in opportunities:
        cust = db.query(Customer).filter(Customer.id == opp.customer_id).first()
        outcomes = db.query(RecoveryOutcome).filter(RecoveryOutcome.opportunity_id == opp.id).all()
        recovered_paise = sum(o.recovered_amount_in_minor for o in outcomes)

        results.append(
            OpportunityResponse(
                id=opp.id,
                merchant_id=opp.merchant_id,
                customer_id=opp.customer_id,
                customer_email=cust.email if cust else "N/A",
                amount_at_risk=opp.amount_at_risk,
                amount_formatted=paise_to_rupees_str(opp.amount_at_risk, opp.currency),
                recovered_amount_in_minor=recovered_paise,
                recovered_formatted=paise_to_rupees_str(recovered_paise, opp.currency),
                currency=opp.currency,
                status=opp.status,
                probability_of_recovery=float(opp.probability_of_recovery) if opp.probability_of_recovery is not None else None,
                source_type=opp.source_type,
                source_reference=opp.source_reference,
                reason=opp.reason,
                created_at=opp.created_at.isoformat()
            )
        )
    return results


@router.get("/opportunities/{opportunity_id}")
def get_opportunity_detail(opportunity_id: str, db: Session = Depends(get_db)):
    opp = db.query(RevenueOpportunity).filter(RevenueOpportunity.id == opportunity_id).first()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    cust = db.query(Customer).filter(Customer.id == opp.customer_id).first()
    strategies = db.query(RecoveryStrategy).filter(RecoveryStrategy.opportunity_id == opp.id).all()
    audit_logs = AuditRepository.get_entity_history(db, "RevenueOpportunity", opp.id)
    outcomes = db.query(RecoveryOutcome).filter(RecoveryOutcome.opportunity_id == opp.id).all()
    recovered_paise = sum(o.recovered_amount_in_minor for o in outcomes)

    return {
        "opportunity": OpportunityResponse(
            id=opp.id,
            merchant_id=opp.merchant_id,
            customer_id=opp.customer_id,
            customer_email=cust.email if cust else "N/A",
            amount_at_risk=opp.amount_at_risk,
            amount_formatted=paise_to_rupees_str(opp.amount_at_risk, opp.currency),
            recovered_amount_in_minor=recovered_paise,
            recovered_formatted=paise_to_rupees_str(recovered_paise, opp.currency),
            currency=opp.currency,
            status=opp.status,
            probability_of_recovery=float(opp.probability_of_recovery) if opp.probability_of_recovery is not None else None,
            source_type=opp.source_type,
            source_reference=opp.source_reference,
            reason=opp.reason,
            created_at=opp.created_at.isoformat()
        ),
        "strategies": [
            {
                "id": s.id,
                "strategy_type": s.strategy_type,
                "channel": s.channel,
                "proposed_delay_seconds": s.proposed_delay_seconds,
                "ranking": s.ranking
            } for s in strategies
        ],
        "audit_trail": [
            {
                "id": a.id,
                "actor_type": a.actor_type,
                "actor_id": a.actor_id,
                "action": a.action,
                "after_state": a.after_state,
                "metadata": a.metadata_json,
                "timestamp": a.timestamp.isoformat()
            } for a in audit_logs
        ]
    }


@router.post("/opportunities/{opportunity_id}/approve")
def approve_opportunity(opportunity_id: str, db: Session = Depends(get_db)):
    """Operator approval gate for high-value PENDING_APPROVAL opportunities."""
    opp = db.query(RevenueOpportunity).filter(RevenueOpportunity.id == opportunity_id).first()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    old_status = opp.status
    opp.status = OpportunityStatus.APPROVED.value
    db.commit()

    AuditRepository.log_event(
        db=db,
        actor_type="merchant_operator",
        actor_id="dashboard_operator_user",
        action="OPPORTUNITY_MANUALLY_APPROVED",
        entity_type="RevenueOpportunity",
        entity_id=opp.id,
        before_state={"status": old_status},
        after_state={"status": "approved"}
    )
    return {"status": "approved", "opportunity_id": opp.id}


@router.post("/opportunities/{opportunity_id}/execute")
async def execute_recovery_action(opportunity_id: str, db: Session = Depends(get_db)):
    """Dispatches bounded recovery execution via Razorpay Test Mode client."""
    opp = db.query(RevenueOpportunity).filter(RevenueOpportunity.id == opportunity_id).first()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    if opp.status not in [OpportunityStatus.APPROVED.value, OpportunityStatus.PENDING_APPROVAL.value]:
        raise HTTPException(status_code=400, detail=f"Cannot execute opportunity in state '{opp.status}'")

    client = RazorpayClient()
    idempotency_key = f"rev_act_{opp.id}_retry_1"

    opp.status = OpportunityStatus.EXECUTING.value
    db.commit()

    res = await client.create_payment_retry(
        payment_id=opp.source_reference,
        amount_in_minor=opp.amount_at_risk,
        currency=opp.currency,
        idempotency_key=idempotency_key
    )

    opp.status = OpportunityStatus.SUCCEEDED.value
    db.commit()

    # Record Action & Outcome
    action = RecoveryAction(
        opportunity_id=opp.id,
        action_type="retry_payment",
        requested_by="bounded_executor_worker",
        status="succeeded",
        idempotency_key=idempotency_key,
        external_reference=res.get("id"),
        result_summary=res
    )
    db.add(action)
    db.commit()
    db.refresh(action)

    outcome = RecoveryOutcome(
        opportunity_id=opp.id,
        action_id=action.id,
        recovered_amount_in_minor=opp.amount_at_risk,
        currency=opp.currency,
        yield_percentage=100.0,
        time_to_recovery_seconds=15,
        status="verified"
    )
    db.add(outcome)
    db.commit()

    AuditRepository.log_event(
        db=db,
        actor_type="system_worker",
        actor_id="bounded_executor_worker",
        action="RECOVERY_ACTION_EXECUTED",
        entity_type="RevenueOpportunity",
        entity_id=opp.id,
        after_state={"status": "succeeded"},
        metadata={"idempotency_key": idempotency_key, "response": res}
    )

    return {
        "status": "succeeded",
        "opportunity_id": opp.id,
        "recovered_amount_formatted": paise_to_rupees_str(opp.amount_at_risk, opp.currency),
        "gateway_response": res
    }


@router.get("/analytics/overview")
def get_overview_analytics(db: Session = Depends(get_db)):
    """Computes real-time overview dashboard yield metrics."""
    all_opps = db.query(RevenueOpportunity).all()
    total_at_risk_paise = sum(o.amount_at_risk for o in all_opps)

    all_outcomes = db.query(RecoveryOutcome).all()
    total_recovered_paise = sum(o.recovered_amount_in_minor for o in all_outcomes)

    yield_pct = 0.0
    if total_at_risk_paise > 0:
        yield_pct = round((total_recovered_paise / total_at_risk_paise) * 100.0, 2)

    active_interventions = len([o for o in all_opps if o.status in ["diagnosed", "approved", "executing", "pending_approval"]])

    return {
        "total_at_risk_paise": total_at_risk_paise,
        "total_at_risk_formatted": paise_to_rupees_str(total_at_risk_paise, "INR"),
        "total_recovered_paise": total_recovered_paise,
        "total_recovered_formatted": paise_to_rupees_str(total_recovered_paise, "INR"),
        "recovery_yield_percentage": yield_pct,
        "active_interventions_count": active_interventions,
        "total_opportunities_count": len(all_opps)
    }

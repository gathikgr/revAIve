"""
revAIve Executor — Idempotent Action Dispatcher
Only executes actions that have received explicit GuardVerdict.ALLOW from revAIve Guard.
Attaches unique idempotency keys and appends immutable AuditEvents.
"""

from datetime import datetime, timezone
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from packages.agent.types import CandidateStrategy, CandidateActionType, GuardVerdict, GuardResult
from packages.database.models import RevenueOpportunity, RecoveryAction
from packages.database.audit_repository import AuditRepository
from packages.razorpay.client import RazorpayClient
from packages.razorpay.payment_links import PaymentLinksAdapter


class RevAiVeExecutor:
    """revAIve Executor dispatches cleared actions with strict idempotency guarantees."""

    @staticmethod
    async def execute(
        db: Session,
        opportunity: RevenueOpportunity,
        strategy: CandidateStrategy,
        guard_result: GuardResult,
        idempotency_key: str
    ) -> Dict[str, Any]:
        """
        Dispatches action to Razorpay client adapter IF guard verdict is ALLOW.
        Raises PermissionError if guard verdict is not ALLOW.
        """
        if guard_result.verdict != GuardVerdict.ALLOW:
            raise PermissionError(
                f"Cannot execute action. revAIve Guard verdict is '{guard_result.verdict.value}'. "
                f"Reasons: {guard_result.reason_codes}"
            )

        client = RazorpayClient()
        links_adapter = PaymentLinksAdapter(client=client)
        action_type = strategy.action.value
        requested_by = "revaive_agent_executor"

        try:
            if strategy.action in [CandidateActionType.RETRY, CandidateActionType.DELAYED_RETRY]:
                # Simulated payment retry dispatch
                result_payload = {
                    "id": f"pay_retry_{opportunity.id[:8]}",
                    "status": "captured",
                    "amount": opportunity.amount_at_risk,
                    "currency": opportunity.currency,
                    "idempotency_key": idempotency_key
                }
            elif strategy.action == CandidateActionType.PAYMENT_LINK:
                link_entity = await links_adapter.create_payment_link(
                    amount_in_minor=opportunity.amount_at_risk,
                    currency=opportunity.currency,
                    description=f"Recovery Link for {opportunity.id}",
                    customer_id=opportunity.customer_id,
                    idempotency_key=idempotency_key
                )
                result_payload = link_entity.dict() if hasattr(link_entity, 'dict') else link_entity.model_dump()
            else:
                result_payload = {"action": strategy.action.value, "status": "executed", "mock": True}

            # Create RecoveryAction DB Record
            action_rec = RecoveryAction(
                opportunity_id=opportunity.id,
                action_type=action_type,
                requested_by=requested_by,
                policy_id=guard_result.policy_id,
                policy_evaluation_id=guard_result.policy_evaluation_id,
                status="succeeded",
                idempotency_key=idempotency_key,
                external_reference=result_payload.get("id"),
                requested_at=datetime.now(timezone.utc),
                executed_at=datetime.now(timezone.utc),
                result_summary=result_payload
            )
            db.add(action_rec)
            db.commit()
            db.refresh(action_rec)

            # Update Opportunity Status
            opportunity.status = "executing"
            db.commit()

            # Append Immutable Audit Event
            AuditRepository.log_event(
                db=db,
                actor_type="ai_agent",
                actor_id="revaive_agent_executor",
                action="ACTION_EXECUTED",
                entity_type="RevenueOpportunity",
                entity_id=opportunity.id,
                after_state={"status": "executing", "action_id": action_rec.id},
                metadata={
                    "idempotency_key": idempotency_key,
                    "action_type": action_type,
                    "external_reference": action_rec.external_reference
                }
            )

            return {
                "success": True,
                "action_id": action_rec.id,
                "idempotency_key": idempotency_key,
                "result_payload": result_payload
            }

        except Exception as e:
            # Handle failure safely without un-audited state mutation
            action_rec = RecoveryAction(
                opportunity_id=opportunity.id,
                action_type=action_type,
                requested_by=requested_by,
                policy_id=guard_result.policy_id,
                policy_evaluation_id=guard_result.policy_evaluation_id,
                status="failed",
                idempotency_key=idempotency_key,
                requested_at=datetime.now(timezone.utc),
                failure_reason=str(e)
            )
            db.add(action_rec)
            opportunity.status = "failed"
            db.commit()

            AuditRepository.log_event(
                db=db,
                actor_type="ai_agent",
                actor_id="revaive_agent_executor",
                action="ACTION_FAILED",
                entity_type="RevenueOpportunity",
                entity_id=opportunity.id,
                after_state={"status": "failed"},
                metadata={"error": str(e), "idempotency_key": idempotency_key}
            )

            return {
                "success": False,
                "action_id": action_rec.id,
                "error": str(e)
            }

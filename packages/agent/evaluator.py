"""
revAIve Evaluator — Outcome Verification Engine
After action execution, determines final outcome (SUCCESS, FAILURE, PARTIAL, PENDING)
and updates/persists RecoveryOutcome.
"""

from datetime import datetime, timezone
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from packages.agent.types import EvaluatedOutcomeStatus
from packages.database.models import RevenueOpportunity, RecoveryAction, RecoveryOutcome
from packages.database.audit_repository import AuditRepository


class RevAiVeEvaluator:
    """revAIve Evaluator measures financial recovery yields and records verified outcomes."""

    @staticmethod
    def evaluate_action_outcome(
        db: Session,
        opportunity: RevenueOpportunity,
        action_id: str,
        is_success: bool,
        recovered_amount_in_minor: Optional[int] = None
    ) -> RecoveryOutcome:
        """
        Evaluates execution results and records RecoveryOutcome.
        """
        action = db.query(RecoveryAction).filter(RecoveryAction.id == action_id).first()
        actual_recovered = recovered_amount_in_minor if (is_success and recovered_amount_in_minor is not None) else (opportunity.amount_at_risk if is_success else 0)

        if is_success and actual_recovered >= opportunity.amount_at_risk:
            status_enum = EvaluatedOutcomeStatus.SUCCESS
            opp_status = "succeeded"
        elif is_success and actual_recovered > 0:
            status_enum = EvaluatedOutcomeStatus.PARTIAL
            opp_status = "partially_recovered"
        elif not is_success:
            status_enum = EvaluatedOutcomeStatus.FAILURE
            opp_status = "failed"
        else:
            status_enum = EvaluatedOutcomeStatus.PENDING
            opp_status = "executing"

        yield_pct = round((actual_recovered / opportunity.amount_at_risk) * 100.0, 2) if opportunity.amount_at_risk > 0 else 0.0

        outcome = RecoveryOutcome(
            opportunity_id=opportunity.id,
            action_id=action.id if action else "act_unknown",
            recovered_amount_in_minor=actual_recovered,
            currency=opportunity.currency,
            yield_percentage=yield_pct,
            time_to_recovery_seconds=300,
            status=status_enum.value.lower(),
            verified_at=datetime.now(timezone.utc)
        )
        db.add(outcome)

        opportunity.status = opp_status
        db.commit()
        db.refresh(outcome)

        AuditRepository.log_event(
            db=db,
            actor_type="ai_agent",
            actor_id="revaive_agent_evaluator",
            action="OUTCOME_EVALUATED",
            entity_type="RevenueOpportunity",
            entity_id=opportunity.id,
            after_state={"status": opp_status, "recovered_amount": actual_recovered},
            metadata={
                "outcome_id": outcome.id,
                "yield_percentage": yield_pct,
                "status": status_enum.value
            }
        )

        return outcome

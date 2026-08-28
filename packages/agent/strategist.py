"""
revAIve Strategist — Strategy Proposal Generator
Generates candidate actions (RETRY, DELAYED_RETRY, PAYMENT_LINK, REMINDER, ESCALATE, NO_ACTION)
and computes expected value, risk, and fatigue metrics for each proposal.
Must NOT execute actions.
"""

from typing import List
from sqlalchemy.orm import Session

from packages.agent.types import CandidateActionType, CandidateStrategy, DiagnosticOutput
from packages.database.models import RevenueOpportunity, Strategy
from packages.shared.intelligence.scoring import DeterministicScoringEngine
from packages.agent.tools import get_customer_context, get_recovery_history, get_policy
from packages.agent.recovery_twin import RecoveryTwin


class RevAiVeStrategist:
    """revAIve Strategist synthesizes diagnostic findings into ranked candidate strategy proposals."""

    @staticmethod
    def propose_strategies(
        db: Session,
        opportunity: RevenueOpportunity,
        diagnosis: DiagnosticOutput
    ) -> List[CandidateStrategy]:
        """
        Generates candidate recovery strategies ranked by expected net recovery using Recovery Twin.
        """
        # Run Recovery Twin evaluation
        twin_res = RecoveryTwin.evaluate_candidates(
            db=db,
            opportunity=opportunity,
            cause_code=diagnosis.cause_code,
            confidence=diagnosis.confidence
        )

        candidates: List[CandidateStrategy] = []

        action_map = {
            "do_nothing": CandidateActionType.NO_ACTION,
            "retry_now": CandidateActionType.RETRY,
            "retry_later": CandidateActionType.DELAYED_RETRY,
            "payment_request": CandidateActionType.PAYMENT_LINK,
            "human_review": CandidateActionType.ESCALATE
        }

        for c in twin_res["candidates"]:
            # If not eligible by policy, exclude or skip
            if not c["policy_eligible"]:
                continue

            action_enum = action_map.get(c["action_type"], CandidateActionType.NO_ACTION)
            candidates.append(
                CandidateStrategy(
                    action=action_enum,
                    expected_value=c["expected_net_recovery"],
                    risk="high" if c["risk_score"] > 0.10 else ("medium" if c["risk_score"] > 0.04 else "low"),
                    customer_fatigue=c["customer_fatigue"],
                    proposed_delay_seconds=c["time_to_recovery_seconds"],
                    reason=f"Recovery Twin counterfactual evaluation ranked this action with expected net recovery: {c['expected_net_recovery']} paise."
                )
            )

        # Sort candidates by expected value (net recovery) descending
        candidates.sort(key=lambda c: c.expected_value, reverse=True)

        # Ensure we always have at least one fallback strategy
        if not candidates:
            candidates.append(
                CandidateStrategy(
                    action=CandidateActionType.NO_ACTION,
                    expected_value=0,
                    risk="low",
                    customer_fatigue=0.0,
                    proposed_delay_seconds=0,
                    reason="No eligible strategy determined by policy."
                )
            )

        # Persist Strategy proposals in DB
        for rank, cand in enumerate(candidates, start=1):
            strat_rec = Strategy(
                opportunity_id=opportunity.id,
                strategy_type=cand.action.value,
                channel="api_gateway" if cand.action in [CandidateActionType.RETRY, CandidateActionType.DELAYED_RETRY] else "sms",
                proposed_delay_seconds=cand.proposed_delay_seconds,
                ranking=rank,
                payload_draft={
                    "expected_value": cand.expected_value,
                    "risk": cand.risk,
                    "reason": cand.reason
                }
            )
            db.add(strat_rec)
        db.commit()

        return candidates


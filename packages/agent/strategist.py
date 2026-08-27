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


class RevAiVeStrategist:
    """revAIve Strategist synthesizes diagnostic findings into ranked candidate strategy proposals."""

    @staticmethod
    def propose_strategies(
        db: Session,
        opportunity: RevenueOpportunity,
        diagnosis: DiagnosticOutput
    ) -> List[CandidateStrategy]:
        """
        Generates non-executing candidate recovery strategies ranked by expected recovery value.
        """
        cust_ctx = get_customer_context(db, opportunity.customer_id)
        hist_ctx = get_recovery_history(db, opportunity.customer_id)
        policy_ctx = get_policy(db, opportunity.merchant_id, "max_retry_budget")

        candidates: List[CandidateStrategy] = []

        # Candidate 1: Smart Delayed Retry (API Gateway)
        if diagnosis.confidence > 0.50 and opportunity.amount_at_risk < 5000000:
            ev_retry = DeterministicScoringEngine.calculate_expected_recovery_value(
                amount_at_risk=opportunity.amount_at_risk,
                recovery_likelihood=diagnosis.confidence,
                intervention_channel="api_gateway",
                currency=opportunity.currency
            )
            candidates.append(
                CandidateStrategy(
                    action=CandidateActionType.DELAYED_RETRY,
                    expected_value=ev_retry,
                    risk="low",
                    customer_fatigue=0.0,
                    proposed_delay_seconds=14400,  # 4 hour delay
                    reason="Delayed API retry aligns with bank recovery and incurs zero customer fatigue."
                )
            )

        # Candidate 2: Payment Link via SMS/WhatsApp
        ev_link = DeterministicScoringEngine.calculate_expected_recovery_value(
            amount_at_risk=opportunity.amount_at_risk,
            recovery_likelihood=min(0.85, diagnosis.confidence + 0.05),
            intervention_channel="sms",
            currency=opportunity.currency
        )
        candidates.append(
            CandidateStrategy(
                action=CandidateActionType.PAYMENT_LINK,
                expected_value=ev_link,
                risk="medium" if opportunity.amount_at_risk > 5000000 else "low",
                customer_fatigue=0.50,
                proposed_delay_seconds=3600,
                reason="Issue payment link to re-engage customer across messaging channels."
            )
        )

        # Candidate 3: Escalate for Manual Review (High-Value or Expired Instrument)
        if opportunity.amount_at_risk >= 5000000 or diagnosis.cause_code == "EXPIRED_CARD":
            candidates.append(
                CandidateStrategy(
                    action=CandidateActionType.ESCALATE,
                    expected_value=opportunity.amount_at_risk,
                    risk="high" if opportunity.amount_at_risk >= 5000000 else "medium",
                    customer_fatigue=0.10,
                    proposed_delay_seconds=0,
                    reason="High-value transaction or card expiry requires operator review."
                )
            )

        # Sort candidates by expected value descending
        candidates.sort(key=lambda c: c.expected_value, reverse=True)

        # Persist Strategy proposals in DB
        for rank, cand in enumerate(candidates, start=1):
            strat_rec = Strategy(
                opportunity_id=opportunity.id,
                strategy_type=cand.action.value,
                channel="api_gateway" if cand.action == CandidateActionType.DELAYED_RETRY else "sms",
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

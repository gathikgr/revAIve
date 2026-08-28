"""
revAIve Recovery Twin — Counterfactual Decision Layer
Evaluates candidate actions: Do Nothing, Retry Now, Retry Later, Payment Request, Human Review.
Calculates Expected Net Recovery using strict deterministic math.
"AI proposes. Deterministic systems control execution."
"""

from typing import List, Dict, Any
from decimal import Decimal
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from packages.database.models import (
    RevenueOpportunity, RecoveryTwinEvaluation, RecoveryCandidate, Customer, PaymentAttempt
)
from packages.agent.types import CandidateActionType


class RecoveryTwin:
    """Computes counterfactual outcomes for alternative recovery interventions."""

    @staticmethod
    def evaluate_candidates(
        db: Session,
        opportunity: RevenueOpportunity,
        cause_code: str,
        confidence: float
    ) -> Dict[str, Any]:
        amount = opportunity.amount_at_risk
        currency = opportunity.currency

        # Fetch customer context to tune recovery likelihood
        cust = db.query(Customer).filter(Customer.id == opportunity.customer_id).first()
        risk_score = float(cust.risk_score) if cust else 0.15

        # Base likelihood estimations dependent on Cause Category
        # 1. Do Nothing
        prob_do_nothing = max(0.02, 0.15 - risk_score)
        
        # 2. Retry Now
        if cause_code in ["TRANSIENT_NETWORK_TIMEOUT"]:
            prob_retry_now = max(0.20, confidence - 0.10)
        elif cause_code in ["BANK_MAINTENANCE_OUTAGE", "INSUFFICIENT_FUNDS"]:
            prob_retry_now = 0.05  # Immediate retries almost certainly fail
        else:
            prob_retry_now = 0.10

        # 3. Retry Later
        if cause_code in ["BANK_MAINTENANCE_OUTAGE", "INSUFFICIENT_FUNDS", "TRANSIENT_NETWORK_TIMEOUT"]:
            prob_retry_later = max(0.60, confidence)
        else:
            prob_retry_later = 0.15

        # 4. Payment Request (SMS/WhatsApp Link)
        if cause_code in ["INSTRUMENT_EXPIRED", "MANDATE_CANCELLED"]:
            prob_payment_request = max(0.65, confidence)
        else:
            prob_payment_request = 0.50

        # 5. Human Review (Escalation)
        prob_human_review = 0.85

        # Setup standard cost variables in paise (integer units)
        cost_do_nothing = 0
        cost_retry_now = 500       # ₹5 gateway charge
        cost_retry_later = 500     # ₹5 gateway charge
        cost_payment_request = 1500 # ₹15 messaging/outbound charge
        cost_human_review = 5000   # ₹50 operational staff cost

        # Fatigue coefficients (0.0 to 1.0)
        fatigue_do_nothing = 0.0
        fatigue_retry_now = 0.0
        fatigue_retry_later = 0.0
        fatigue_payment_request = 0.40
        fatigue_human_review = 0.10

        # Risk score estimations
        risk_do_nothing = 0.0
        risk_retry_now = 0.10
        risk_retry_later = 0.05
        risk_payment_request = 0.15
        risk_human_review = 0.02

        # Define delay profiles (seconds)
        time_do_nothing = 259200   # 3 days
        time_retry_now = 10        # immediate
        time_retry_later = 14400   # 4 hours
        time_payment_request = 86400  # 24 hours
        time_human_review = 172800  # 48 hours

        candidates_config = [
            ("do_nothing", prob_do_nothing, cost_do_nothing, fatigue_do_nothing, risk_do_nothing, time_do_nothing),
            ("retry_now", prob_retry_now, cost_retry_now, fatigue_retry_now, risk_retry_now, time_retry_now),
            ("retry_later", prob_retry_later, cost_retry_later, fatigue_retry_later, risk_retry_later, time_retry_later),
            ("payment_request", prob_payment_request, cost_payment_request, fatigue_payment_request, risk_payment_request, time_payment_request),
            ("human_review", prob_human_review, cost_human_review, fatigue_human_review, risk_human_review, time_human_review),
        ]

        # Calculate Expected Net Recovery:
        # Net Recovery = (Amount * Likelihood) - Cost - (Fatigue * 1000 paise penalty)
        eval_record = RecoveryTwinEvaluation(
            opportunity_id=opportunity.id,
            recommended_action="retry_later",  # temporary placeholder, will update below
            evaluated_at=datetime.now(timezone.utc)
        )
        db.add(eval_record)
        db.commit()
        db.refresh(eval_record)

        candidates_list = []
        best_action = "do_nothing"
        max_net_recovery = -999999999

        for action_type, prob, cost, fatigue, r_score, delay_sec in candidates_config:
            expected_gross = int(amount * prob)
            fatigue_penalty = int(fatigue * 1000)  # ₹10 penalty per unit
            expected_net = expected_gross - cost - fatigue_penalty

            # Enforce eligibility logic: e.g. retry_now is not eligible for expired cards
            eligible = True
            if cause_code == "INSTRUMENT_EXPIRED" and action_type in ["retry_now", "retry_later"]:
                eligible = False

            # Disallow human review for low value transactions (not cost effective)
            if action_type == "human_review" and amount < 1000000:
                eligible = False

            # Don't allow retry if attempts count already at budget ceiling
            if action_type in ["retry_now", "retry_later"]:
                attempts = db.query(PaymentAttempt).filter(PaymentAttempt.payment_id == opportunity.source_reference).count()
                if attempts >= 3:
                    eligible = False

            cand = RecoveryCandidate(
                evaluation_id=eval_record.id,
                action_type=action_type,
                recovery_likelihood=Decimal(str(round(prob, 2))),
                expected_recovery=expected_gross,
                intervention_cost=cost,
                customer_fatigue=Decimal(str(round(fatigue, 2))),
                risk_score=Decimal(str(round(r_score, 2))),
                time_to_recovery_seconds=delay_sec,
                policy_eligible=eligible,
                expected_net_recovery=expected_net
            )
            db.add(cand)
            candidates_list.append(cand)

            if eligible and expected_net > max_net_recovery:
                max_net_recovery = expected_net
                best_action = action_type

        # Update recommended action on the evaluation record
        eval_record.recommended_action = best_action
        db.commit()

        # Format candidates output for representation
        return {
            "evaluation_id": eval_record.id,
            "recommended_action": best_action,
            "candidates": [
                {
                    "action_type": c.action_type,
                    "recovery_likelihood": float(c.recovery_likelihood),
                    "expected_recovery": c.expected_recovery,
                    "expected_net_recovery": c.expected_net_recovery,
                    "intervention_cost": c.intervention_cost,
                    "customer_fatigue": float(c.customer_fatigue),
                    "risk_score": float(c.risk_score),
                    "policy_eligible": c.policy_eligible,
                    "time_to_recovery_seconds": c.time_to_recovery_seconds
                }
                for c in candidates_list
            ]
        }

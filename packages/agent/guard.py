"""
revAIve Guard — Deterministic Policy Safety Enforcer
MUST BE 100% DETERMINISTIC. The LLM CANNOT override or bypass revAIve Guard.
Checks retry budgets, quiet periods, high-value thresholds, idempotency keys, and expiry dates.
Returns exactly ALLOW, DENY, or REQUIRE_HUMAN_APPROVAL with explicit reason codes.
"""

from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session

from packages.agent.types import CandidateStrategy, CandidateActionType, GuardVerdict, GuardResult
from packages.database.models import RevenueOpportunity, Customer, RecoveryAction, PolicyEvaluation, Policy
from packages.shared.currency import assert_valid_currency


HIGH_VALUE_APPROVAL_THRESHOLD_PAISE = 5_000_000  # ₹50,000 INR
MAX_RETRY_BUDGET = 3
QUIET_PERIOD_HOURS = 24.0


class RevAiVeGuard:
    """revAIve Guard enforces deterministic policy invariants before any execution."""

    @staticmethod
    def evaluate(
        db: Session,
        opportunity: RevenueOpportunity,
        strategy: CandidateStrategy,
        idempotency_key: str,
        operator_approved: bool = False
    ) -> GuardResult:
        reason_codes: List[str] = []
        requires_approval = False

        # 1. Currency & Amount Validation
        try:
            assert_valid_currency(opportunity.currency)
        except ValueError as e:
            reason_codes.append(f"INVALID_CURRENCY: {str(e)}")

        if opportunity.amount_at_risk <= 0:
            reason_codes.append("ZERO_AMOUNT: Amount at risk must be greater than zero paise.")

        # 2. Opportunity Expiry Check
        if opportunity.expires_at:
            now = datetime.now(timezone.utc)
            exp_dt = opportunity.expires_at if opportunity.expires_at.tzinfo else opportunity.expires_at.replace(tzinfo=timezone.utc)
            if now > exp_dt:
                reason_codes.append("OPPORTUNITY_EXPIRED: Opportunity window has elapsed.")

        # 3. Duplicate Action Execution Check (Idempotency Key)
        existing_action = db.query(RecoveryAction).filter(RecoveryAction.idempotency_key == idempotency_key).first()
        if existing_action:
            reason_codes.append(f"DUPLICATE_ACTION_KEY: Action with idempotency key '{idempotency_key}' already exists.")

        # 4. Max Retry Budget Ceiling Check
        executed_actions_count = (
            db.query(RecoveryAction)
            .filter(RecoveryAction.opportunity_id == opportunity.id, RecoveryAction.status == "succeeded")
            .count()
        )
        if executed_actions_count >= MAX_RETRY_BUDGET:
            reason_codes.append(f"MAX_RETRY_EXCEEDED: Maximum retry budget ({MAX_RETRY_BUDGET}) reached.")

        # 5. Customer Quiet Period Check (for messaging actions)
        if strategy.action in [CandidateActionType.PAYMENT_LINK, CandidateActionType.REMINDER]:
            cust = db.query(Customer).filter(Customer.id == opportunity.customer_id).first()
            if cust and cust.last_contacted_at:
                now = datetime.now(timezone.utc)
                contact_dt = cust.last_contacted_at if cust.last_contacted_at.tzinfo else cust.last_contacted_at.replace(tzinfo=timezone.utc)
                hours_since = (now - contact_dt).total_seconds() / 3600.0
                if hours_since < QUIET_PERIOD_HOURS:
                    reason_codes.append(
                        f"QUIET_PERIOD_VIOLATION: Customer contacted {hours_since:.1f}h ago. "
                        f"Minimum quiet period is {QUIET_PERIOD_HOURS}h."
                    )

        # 6. High-Value Threshold Approval Gate Check
        if opportunity.amount_at_risk >= HIGH_VALUE_APPROVAL_THRESHOLD_PAISE and not operator_approved:
            requires_approval = True
            reason_codes.append("HIGH_VALUE_THRESHOLD_TRIGGERED: Amount >= ₹50,000 INR requires human approval.")

        # Determine Final Verdict
        if len(reason_codes) > 0 and not requires_approval:
            verdict = GuardVerdict.DENY
        elif requires_approval:
            verdict = GuardVerdict.REQUIRE_HUMAN_APPROVAL
        else:
            verdict = GuardVerdict.ALLOW

        # Find matching DB policy
        policy = db.query(Policy).filter(Policy.merchant_id == opportunity.merchant_id).first()
        policy_id = policy.id if policy else None

        # Persist PolicyEvaluation record in DB
        eval_rec = PolicyEvaluation(
            policy_id=policy_id or "policy_default",
            opportunity_id=opportunity.id,
            passed=(verdict == GuardVerdict.ALLOW),
            requires_manual_approval=requires_approval,
            failed_rules=reason_codes
        )
        if policy_id:
            db.add(eval_rec)
            db.commit()
            db.refresh(eval_rec)

        return GuardResult(
            verdict=verdict,
            reason_codes=reason_codes,
            policy_id=policy_id,
            policy_evaluation_id=eval_rec.id if policy_id else None
        )

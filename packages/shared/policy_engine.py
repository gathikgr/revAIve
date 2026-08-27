"""
revAIve — Deterministic Policy Engine
Strict non-LLM safety enforcement gate controlling financial recovery actions.
"AI proposes. Deterministic systems control execution."
"""

from datetime import datetime, timedelta, timezone
from typing import List, Optional
from pydantic import BaseModel
from packages.shared.currency import assert_valid_currency
from packages.shared.types import StrategyType, ExecutionChannel


HIGH_VALUE_THRESHOLD_PAISE = 5_000_000  # ₹50,000 INR
MAX_RETRY_BUDGET = 3
QUIET_PERIOD_HOURS = 24


class PolicyEvaluationResult(BaseModel):
    passed: bool
    requires_manual_approval: bool
    failed_rules: List[str]
    approved_channel: str
    evaluated_at: datetime


class PolicyEngine:
    @staticmethod
    def evaluate_strategy(
        amount_in_minor: int,
        currency: str,
        attempts_count: int,
        max_attempts: int,
        strategy_type: str,
        channel: str,
        last_customer_contact_at: Optional[datetime] = None,
        operator_approved: bool = False
    ) -> PolicyEvaluationResult:
        failed_rules: List[str] = []
        requires_manual_approval = False

        # 1. Financial Math & Currency Validation
        if not isinstance(amount_in_minor, int) or amount_in_minor <= 0:
            failed_rules.append("INVALID_MONETARY_AMOUNT: Amount must be an integer minor unit > 0")

        try:
            assert_valid_currency(currency)
        except ValueError as e:
            failed_rules.append(f"INVALID_CURRENCY: {str(e)}")

        # 2. Retry Ceiling Enforcer
        effective_max = min(max_attempts, MAX_RETRY_BUDGET)
        if attempts_count >= effective_max:
            failed_rules.append(f"MAX_RETRY_EXCEEDED: Current attempts ({attempts_count}) reached policy ceiling ({effective_max})")

        # 3. Customer Quiet Period Enforcer (for messaging channels)
        if channel in [ExecutionChannel.SMS, ExecutionChannel.WHATSAPP, ExecutionChannel.EMAIL]:
            if last_customer_contact_at is not None:
                # Ensure timezone aware comparison
                now = datetime.now(timezone.utc)
                contact_time = last_customer_contact_at if last_customer_contact_at.tzinfo else last_customer_contact_at.replace(tzinfo=timezone.utc)
                hours_since_contact = (now - contact_time).total_seconds() / 3600.0
                if hours_since_contact < QUIET_PERIOD_HOURS:
                    failed_rules.append(
                        f"QUIET_PERIOD_VIOLATION: Customer contacted {hours_since_contact:.1f}h ago. "
                        f"Minimum quiet period is {QUIET_PERIOD_HOURS}h."
                    )

        # 4. High-Value Transaction Manual Approval Threshold Gate
        if amount_in_minor >= HIGH_VALUE_THRESHOLD_PAISE and not operator_approved:
            requires_manual_approval = True

        # Final Verdict
        passed = len(failed_rules) == 0 and not requires_manual_approval

        return PolicyEvaluationResult(
            passed=passed,
            requires_manual_approval=requires_manual_approval,
            failed_rules=failed_rules,
            approved_channel=channel,
            evaluated_at=datetime.now(timezone.utc)
        )

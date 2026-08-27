"""
revAIve — Deterministic Recovery Intelligence & Scoring Engine
Strict non-LLM mathematical calculations for Recovery Likelihood, Expected Value, and Priority Score.
"AI proposes. Deterministic systems control execution."
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from packages.shared.currency import assert_valid_currency, assert_matching_currencies
from packages.shared.intelligence.types import (
    RecoveryLikelihoodResult,
    FeatureContribution,
    OpportunityScoreBreakdown,
    IntelligenceOpportunityStatus
)

# Standard Intervention Costs in Paise (Integer Minor Units)
INTERVENTION_COST_API_RETRY_PAISE = 500   # ₹5.00 INR
INTERVENTION_COST_MSG_LINK_PAISE = 2000   # ₹20.00 INR
HIGH_VALUE_THRESHOLD_PAISE = 5_000_000    # ₹50,000 INR


class DeterministicScoringEngine:
    @staticmethod
    def calculate_recovery_likelihood(
        previous_successful_payments: int,
        attempt_failure_count: int,
        payment_method_type: str,
        gateway_error_code: Optional[str] = None,
        hours_since_last_contact: Optional[float] = None,
        customer_risk_score: float = 0.0
    ) -> RecoveryLikelihoodResult:
        """
        Computes deterministic baseline 'Recovery Likelihood' P_recover in [0.05, 0.95].
        Does NOT claim causality; provides explicit feature contributions.
        """
        baseline = 0.50
        contributions: List[FeatureContribution] = []

        # Signal 1: Previous Payment Success History
        if previous_successful_payments > 0:
            boost = min(0.20, previous_successful_payments * 0.04)
            baseline += boost
            contributions.append(FeatureContribution(
                feature_name="previous_success_history",
                delta=round(boost, 2),
                description=f"+{boost:.2f} boost for {previous_successful_payments} past successful payments"
            ))

        # Signal 2: Failure Attempt Penalties
        if attempt_failure_count >= 3:
            penalty = -0.35
            baseline += penalty
            contributions.append(FeatureContribution(
                feature_name="repeated_failure_exhaustion",
                delta=penalty,
                description="-0.35 penalty for reaching 3+ failed attempt ceiling"
            ))
        elif attempt_failure_count == 2:
            penalty = -0.15
            baseline += penalty
            contributions.append(FeatureContribution(
                feature_name="second_attempt_failure",
                delta=penalty,
                description="-0.15 penalty for 2 failed attempts"
            ))

        # Signal 3: Error Code Dynamics (Bank Maintenance vs Hard Decline)
        code_upper = (gateway_error_code or "").upper()
        if "BANK_MAINTENANCE" in code_upper or "GATEWAY_TIMEOUT" in code_upper:
            boost = 0.30
            baseline += boost
            contributions.append(FeatureContribution(
                feature_name="transient_bank_outage_recoupling",
                delta=boost,
                description="+0.30 boost for transient bank outage failure"
            ))
        elif "EXPIRED_CARD" in code_upper or "MANDATE_CANCELLED" in code_upper:
            penalty = -0.25
            baseline += penalty
            contributions.append(FeatureContribution(
                feature_name="hard_instrument_decline",
                delta=penalty,
                description="-0.25 penalty for expired instrument or cancelled mandate"
            ))

        # Signal 4: Payment Method Capabilities
        if payment_method_type == "mandate":
            boost = 0.10
            baseline += boost
            contributions.append(FeatureContribution(
                feature_name="e_mandate_auto_debit",
                delta=boost,
                description="+0.10 boost for auto-debit recurring mandate"
            ))

        # Signal 5: Customer Fatigue Penalty
        if hours_since_last_contact is not None and hours_since_last_contact < 24.0:
            penalty = -0.20
            baseline += penalty
            contributions.append(FeatureContribution(
                feature_name="recent_customer_contact_fatigue",
                delta=penalty,
                description="-0.20 penalty for customer contact within 24h quiet period"
            ))

        # Clamp between 0.05 and 0.95
        final_probability = max(0.05, min(0.95, round(baseline, 2)))
        confidence = 0.90 if len(contributions) >= 2 else 0.70

        return RecoveryLikelihoodResult(
            recovery_likelihood=final_probability,
            confidence=confidence,
            feature_contributions=contributions
        )

    @staticmethod
    def calculate_expected_recovery_value(
        amount_at_risk: int,
        recovery_likelihood: float,
        intervention_channel: str = "api_gateway",
        currency: str = "INR"
    ) -> int:
        """
        Formula: EV = max(0, round(Amount_at_risk * Recovery_likelihood - Intervention_cost))
        All monetary values in integer minor units (paise). Zero floating point math leakage.
        """
        assert_valid_currency(currency)
        if not isinstance(amount_at_risk, int) or amount_at_risk < 0:
            raise ValueError("amount_at_risk must be a non-negative integer minor unit (paise).")

        cost = (
            INTERVENTION_COST_MSG_LINK_PAISE
            if intervention_channel in ["sms", "whatsapp", "email"]
            else INTERVENTION_COST_API_RETRY_PAISE
        )

        raw_ev = (amount_at_risk * recovery_likelihood) - cost
        return max(0, int(round(raw_ev)))

    @staticmethod
    def compute_opportunity_score(
        amount_at_risk: int,
        currency: str,
        attempt_failure_count: int,
        max_attempts: int,
        payment_method_type: str,
        gateway_error_code: Optional[str] = None,
        previous_successful_payments: int = 0,
        hours_since_last_contact: Optional[float] = None,
        hours_since_detection: float = 0.0,
        intervention_channel: str = "api_gateway",
        operator_approved: bool = False
    ) -> OpportunityScoreBreakdown:
        """
        Computes complete deterministic opportunity score, qualification status, and priority score.
        """
        assert_valid_currency(currency)

        # Zero amount edge case -> SUPPRESSED
        if amount_at_risk <= 0:
            return OpportunityScoreBreakdown(
                amount_at_risk=0,
                recovery_likelihood=0.0,
                intervention_cost_estimate=0,
                expected_recovery_value=0,
                urgency=0.0,
                customer_value_score=0.0,
                customer_fatigue_score=0.0,
                priority_score=0.0,
                qualification_status=IntelligenceOpportunityStatus.SUPPRESSED,
                explanation="Suppressed: Zero or negative amount at risk."
            )

        # Exhausted retries edge case
        if attempt_failure_count >= max_attempts:
            return OpportunityScoreBreakdown(
                amount_at_risk=amount_at_risk,
                recovery_likelihood=0.05,
                intervention_cost_estimate=INTERVENTION_COST_API_RETRY_PAISE,
                expected_recovery_value=0,
                urgency=0.0,
                customer_value_score=0.5,
                customer_fatigue_score=1.0,
                priority_score=0.0,
                qualification_status=IntelligenceOpportunityStatus.UNRECOVERABLE,
                explanation=f"Unrecoverable: Attempt count ({attempt_failure_count}) reached policy cap ({max_attempts})."
            )

        # Calculate Recovery Likelihood
        likelihood_res = DeterministicScoringEngine.calculate_recovery_likelihood(
            previous_successful_payments=previous_successful_payments,
            attempt_failure_count=attempt_failure_count,
            payment_method_type=payment_method_type,
            gateway_error_code=gateway_error_code,
            hours_since_last_contact=hours_since_last_contact
        )

        p_recover = likelihood_res.recovery_likelihood
        cost_estimate = (
            INTERVENTION_COST_MSG_LINK_PAISE
            if intervention_channel in ["sms", "whatsapp", "email"]
            else INTERVENTION_COST_API_RETRY_PAISE
        )

        expected_val = DeterministicScoringEngine.calculate_expected_recovery_value(
            amount_at_risk=amount_at_risk,
            recovery_likelihood=p_recover,
            intervention_channel=intervention_channel,
            currency=currency
        )

        # Urgency Score: Higher urgency if detected recently (< 48 hours)
        urgency = max(0.1, min(1.0, round(1.0 - (hours_since_detection / 168.0), 2)))

        # Customer Value Score: Ratio relative to ₹50,000 threshold
        cust_val_score = min(1.0, round(amount_at_risk / HIGH_VALUE_THRESHOLD_PAISE, 2))

        # Customer Fatigue Score: 1.0 if contacted recently (< 24h), 0.0 otherwise
        fatigue_score = 1.0 if (hours_since_last_contact is not None and hours_since_last_contact < 24.0) else 0.0

        # Compute Priority Score [0.00 to 100.00]
        ev_norm = min(1.0, expected_val / 500000)  # Normalized to ₹5,000 reference
        priority = (40.0 * ev_norm) + (30.0 * urgency) + (20.0 * cust_val_score) - (10.0 * fatigue_score)
        priority_score = max(0.0, min(100.0, round(priority, 2)))

        # Determine Qualification Lifecycle State
        if amount_at_risk >= HIGH_VALUE_THRESHOLD_PAISE and not operator_approved:
            qualification = IntelligenceOpportunityStatus.HUMAN_REVIEW
            explanation = "Qualified for Human Review: High-value transaction threshold triggered (> ₹50,000 INR)."
        elif fatigue_score > 0.8 and intervention_channel in ["sms", "whatsapp"]:
            qualification = IntelligenceOpportunityStatus.SUPPRESSED
            explanation = "Suppressed: Customer in 24h quiet period to prevent notification fatigue."
        elif expected_val <= 0:
            qualification = IntelligenceOpportunityStatus.UNRECOVERABLE
            explanation = "Unrecoverable: Expected recovery value does not exceed intervention cost."
        else:
            qualification = IntelligenceOpportunityStatus.QUALIFIED
            explanation = f"Qualified: Expected recovery value ₹{expected_val/100:.2f} with Priority Score {priority_score:.1f}."

        return OpportunityScoreBreakdown(
            amount_at_risk=amount_at_risk,
            recovery_likelihood=p_recover,
            intervention_cost_estimate=cost_estimate,
            expected_recovery_value=expected_val,
            urgency=urgency,
            customer_value_score=cust_val_score,
            customer_fatigue_score=fatigue_score,
            priority_score=priority_score,
            qualification_status=qualification,
            explanation=explanation
        )

"""
revAIve Policy Lab — Counterfactual Simulation Engine
Simulates policy impact on historical/synthetic merchant data BEFORE applying changes.
MUST NEVER INVOKE REAL RAZORPAY APIS OR SEND EXTERNAL NETWORK REQUESTS.
All metrics are clearly labeled SIMULATED.
"""

from typing import List, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from packages.database.models import RevenueOpportunity, Merchant, Policy, AuditEvent
from packages.database.audit_repository import AuditRepository
from packages.shared.policy_lab.types import (
    PolicyConfig,
    SimulatedMetrics,
    PolicySimulationComparison,
    ApplyPolicyRequest
)
from packages.shared.currency import paise_to_rupees_str
from packages.shared.intelligence.scoring import DeterministicScoringEngine


class PolicyLabSimulator:
    """revAIve Policy Lab runs pure counterfactual mathematical simulations."""

    @staticmethod
    def _evaluate_policy_against_dataset(
        opportunities: List[RevenueOpportunity],
        config: PolicyConfig
    ) -> SimulatedMetrics:
        """
        Pure in-memory counterfactual evaluation of a policy config against opportunities.
        Zero side effects. Zero HTTP requests.
        """
        expected_recovered_paise = 0
        interventions = 0
        contacts = 0
        fatigue_sum = 0.0
        suppressed = 0
        escalations = 0
        denials = 0

        for opp in opportunities:
            # Check 1: Expiry
            if opp.expires_at and datetime.now(timezone.utc) > (opp.expires_at if opp.expires_at.tzinfo else opp.expires_at.replace(tzinfo=timezone.utc)):
                suppressed += 1
                denials += 1
                continue

            # Check 2: High Value Threshold -> Escalation
            if opp.amount_at_risk >= config.human_approval_threshold_paise:
                escalations += 1
                # Escalations contribute to recovery if manually approved
                p_rec = float(opp.probability_of_recovery or 0.80)
                ev = DeterministicScoringEngine.calculate_expected_recovery_value(
                    amount_at_risk=opp.amount_at_risk,
                    recovery_likelihood=p_rec,
                    intervention_channel="api_gateway",
                    currency=opp.currency
                )
                expected_recovered_paise += ev
                continue

            # Check 3: Minimum EV Threshold
            p_rec = float(opp.probability_of_recovery or 0.70)
            ev = DeterministicScoringEngine.calculate_expected_recovery_value(
                amount_at_risk=opp.amount_at_risk,
                recovery_likelihood=p_rec,
                intervention_channel="api_gateway",
                currency=opp.currency
            )

            if ev < config.min_expected_recovery_value_paise:
                suppressed += 1
                denials += 1
                continue

            # Qualified Intervention
            interventions += 1
            expected_recovered_paise += ev

            # Simulate messaging contact frequency
            if opp.amount_at_risk < 5000000:
                contacts += 1
                fatigue_sum += 0.35

        avg_fatigue = round(fatigue_sum / len(opportunities), 2) if opportunities else 0.0

        return SimulatedMetrics(
            is_simulated=True,
            expected_recovered_revenue_paise=expected_recovered_paise,
            expected_recovered_revenue_formatted=paise_to_rupees_str(expected_recovered_paise, "INR"),
            intervention_count=interventions,
            customer_contacts_count=contacts,
            estimated_fatigue_score=avg_fatigue,
            suppressed_opportunities_count=suppressed,
            human_escalations_count=escalations,
            policy_denials_count=denials
        )

    @classmethod
    def simulate_comparison(
        cls,
        db: Session,
        merchant_id: str,
        proposed_policy: PolicyConfig,
        current_policy_override: Optional[PolicyConfig] = None
    ) -> PolicySimulationComparison:
        """
        Runs counterfactual comparison between current active policy and proposed policy.
        """
        opportunities = (
            db.query(RevenueOpportunity)
            .filter(RevenueOpportunity.merchant_id == merchant_id)
            .all()
        )

        # Retrieve current policy from DB if not overridden
        if not current_policy_override:
            db_policy = db.query(Policy).filter(Policy.merchant_id == merchant_id, Policy.is_active == True).first()
            if db_policy and "max_retries" in db_policy.rule_parameters:
                params = db_policy.rule_parameters
                current_policy = PolicyConfig(
                    max_retries=params.get("max_retries", 3),
                    retry_cooldown_hours=params.get("retry_cooldown_hours", 24.0),
                    max_customer_contacts=params.get("max_customer_contacts", 2),
                    min_expected_recovery_value_paise=params.get("min_expected_recovery_value_paise", 50000),
                    human_approval_threshold_paise=params.get("human_approval_threshold_paise", 5000000),
                    high_value_customer_threshold_paise=params.get("high_value_customer_threshold_paise", 5000000),
                    customer_fatigue_threshold=params.get("customer_fatigue_threshold", 0.80)
                )
            else:
                current_policy = PolicyConfig()
        else:
            current_policy = current_policy_override

        current_metrics = cls._evaluate_policy_against_dataset(opportunities, current_policy)
        proposed_metrics = cls._evaluate_policy_against_dataset(opportunities, proposed_policy)

        incremental_ev = proposed_metrics.expected_recovered_revenue_paise - current_metrics.expected_recovered_revenue_paise
        contact_diff = proposed_metrics.customer_contacts_count - current_metrics.customer_contacts_count

        # Recommendation Logic
        if incremental_ev > 0 and contact_diff <= 500:
            recommendation = "RECOMMENDED"
        elif incremental_ev > 0 and contact_diff > 500:
            recommendation = "REVIEW"
        else:
            recommendation = "HIGH_RISK"

        return PolicySimulationComparison(
            merchant_id=merchant_id,
            current_policy=current_policy,
            proposed_policy=proposed_policy,
            current_metrics=current_metrics,
            proposed_metrics=proposed_metrics,
            incremental_expected_recovery_paise=incremental_ev,
            incremental_expected_recovery_formatted=paise_to_rupees_str(incremental_ev, "INR"),
            contact_difference=contact_diff,
            recommendation=recommendation
        )

    @classmethod
    def apply_policy(
        cls,
        db: Session,
        request: ApplyPolicyRequest,
        operator_id: str = "merchant_operator"
    ) -> Policy:
        """
        Applies a proposed policy configuration to production DB after explicit confirmation.
        Creates an immutable AuditEvent.
        """
        # Deactivate existing merchant policies
        existing_policies = db.query(Policy).filter(Policy.merchant_id == request.merchant_id).all()
        for p in existing_policies:
            p.is_active = False

        new_policy = Policy(
            merchant_id=request.merchant_id,
            name=f"Merchant Policy (Applied {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M')})",
            rule_type="custom_policy_set",
            rule_parameters=request.policy_config.model_dump(),
            is_active=True
        )
        db.add(new_policy)
        db.commit()
        db.refresh(new_policy)

        # Audit Event Generation
        AuditRepository.log_event(
            db=db,
            actor_type="merchant_operator",
            actor_id=operator_id,
            action="POLICY_APPLIED",
            entity_type="Policy",
            entity_id=new_policy.id,
            before_state={"active_policy_count": len(existing_policies)},
            after_state={"policy_id": new_policy.id, "parameters": request.policy_config.model_dump()},
            metadata={
                "confirmation_reason": request.confirmation_reason,
                "applied_at": datetime.now(timezone.utc).isoformat()
            }
        )

        return new_policy

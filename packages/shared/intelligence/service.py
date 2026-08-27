"""
revAIve — Revenue Intelligence Scanning Service
Orchestrates opportunity detection, deterministic scoring, state qualification, and persistence.
"""

from typing import Dict, Any, List
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from packages.database.models import RevenueOpportunity, Merchant, Customer, PaymentAttempt
from packages.database.audit_repository import AuditRepository
from packages.shared.intelligence.detectors import DetectorRegistry
from packages.shared.intelligence.scoring import DeterministicScoringEngine
from packages.shared.intelligence.types import OpportunityCandidate, IntelligenceOpportunityStatus
from packages.shared.currency import paise_to_rupees_str


class RevenueIntelligenceService:
    def __init__(self, registry: DetectorRegistry = None):
        self.registry = registry or DetectorRegistry()

    def run_scanner(self, db: Session, merchant_id: str) -> Dict[str, Any]:
        """
        Executes detector scan for a merchant, scores candidates,
        prevents duplicates, and persists qualified opportunities.
        """
        merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()
        if not merchant:
            raise ValueError(f"Merchant with ID '{merchant_id}' not found.")

        all_candidates: List[OpportunityCandidate] = []
        for detector in self.registry.get_all_detectors():
            candidates = detector.detect_candidates(db, merchant_id)
            all_candidates.extend(candidates)

        detected_count = 0
        total_at_risk_paise = 0
        total_expected_recovery_paise = 0
        high_priority_count = 0

        for cand in all_candidates:
            # Duplicate prevention check (source_type + source_reference)
            existing_opp = db.query(RevenueOpportunity).filter(
                RevenueOpportunity.merchant_id == merchant_id,
                RevenueOpportunity.source_type == cand.source_type,
                RevenueOpportunity.source_reference == cand.source_reference
            ).first()

            if existing_opp:
                continue

            # Fetch customer details for scoring signals
            cust = db.query(Customer).filter(Customer.id == cand.customer_id).first()
            prev_successes = (
                db.query(PaymentAttempt)
                .filter(PaymentAttempt.customer_id == cand.customer_id, PaymentAttempt.status == "success")
                .count()
            )

            hours_since_contact = None
            if cust and cust.last_contacted_at:
                now = datetime.now(timezone.utc)
                contact_dt = cust.last_contacted_at if cust.last_contacted_at.tzinfo else cust.last_contacted_at.replace(tzinfo=timezone.utc)
                hours_since_contact = (now - contact_dt).total_seconds() / 3600.0

            hours_since_detection = 0.0
            if cand.detected_at:
                now = datetime.now(timezone.utc)
                det_dt = cand.detected_at if cand.detected_at.tzinfo else cand.detected_at.replace(tzinfo=timezone.utc)
                hours_since_detection = (now - det_dt).total_seconds() / 3600.0

            # Compute Deterministic Score
            score_breakdown = DeterministicScoringEngine.compute_opportunity_score(
                amount_at_risk=cand.amount_at_risk,
                currency=cand.currency,
                attempt_failure_count=0,
                max_attempts=3,
                payment_method_type=cand.metadata.get("payment_method", "card"),
                gateway_error_code=cand.metadata.get("error_code"),
                previous_successful_payments=prev_successes,
                hours_since_last_contact=hours_since_contact,
                hours_since_detection=hours_since_detection
            )

            # Persist RevenueOpportunity
            opp = RevenueOpportunity(
                merchant_id=merchant_id,
                customer_id=cand.customer_id,
                source_type=cand.source_type,
                source_reference=cand.source_reference,
                amount_at_risk=cand.amount_at_risk,
                currency=cand.currency,
                probability_of_recovery=score_breakdown.recovery_likelihood,
                expected_recovery_value=score_breakdown.expected_recovery_value,
                priority_score=score_breakdown.priority_score,
                status=score_breakdown.qualification_status.value.lower(),
                reason=score_breakdown.explanation,
                recommended_action="Smart Retry" if score_breakdown.recovery_likelihood > 0.50 else "Issue Payment Link",
                detected_at=cand.detected_at,
                expires_at=cand.expires_at
            )
            db.add(opp)
            db.commit()
            db.refresh(opp)

            AuditRepository.log_event(
                db=db,
                actor_type="system_worker",
                actor_id="revenue_intelligence_scanner",
                action="OPPORTUNITY_QUALIFIED",
                entity_type="RevenueOpportunity",
                entity_id=opp.id,
                after_state={"status": opp.status, "priority_score": score_breakdown.priority_score},
                metadata={
                    "recovery_likelihood": score_breakdown.recovery_likelihood,
                    "expected_recovery_value": score_breakdown.expected_recovery_value,
                    "explanation": score_breakdown.explanation
                }
            )

            detected_count += 1
            total_at_risk_paise += cand.amount_at_risk
            total_expected_recovery_paise += score_breakdown.expected_recovery_value
            if score_breakdown.priority_score >= 70.0:
                high_priority_count += 1

        return {
            "merchant_id": merchant_id,
            "opportunities_detected": detected_count,
            "total_amount_at_risk_paise": total_at_risk_paise,
            "total_amount_at_risk_formatted": paise_to_rupees_str(total_at_risk_paise, "INR"),
            "total_expected_recovery_paise": total_expected_recovery_paise,
            "total_expected_recovery_formatted": paise_to_rupees_str(total_expected_recovery_paise, "INR"),
            "high_priority_opportunities": high_priority_count
        }

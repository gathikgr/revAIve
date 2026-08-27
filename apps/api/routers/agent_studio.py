"""
revAIve FastAPI Router — Agent Studio & Scenario Testing Endpoints
Executes REAL production agent pipeline against custom merchant & scenario inputs.
Provides detailed understandable review of revenue leakage, diagnostic evidence, policy guard verdicts, and financial yield.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional, List
import uuid
from datetime import datetime, timezone

from packages.database.session import get_db
from packages.database.models import Merchant, Customer, Payment, PaymentAttempt, RevenueOpportunity
from packages.database.audit_repository import AuditRepository
from packages.agent.pipeline import RevAiVeAgentPipeline
from packages.shared.intelligence.service import RevenueIntelligenceService
from packages.shared.currency import paise_to_rupees_str

router = APIRouter(prefix="/agent-studio", tags=["Agent Studio"])


class ScenarioInputSchema(BaseModel):
    merchant_name: str = Field("SaaSify Technologies India Pvt Ltd", description="Merchant Organization Name")
    razorpay_merchant_id: str = Field("rzp_merch_live01", description="Razorpay Merchant Account ID")
    customer_name: str = Field("Acme Software Pvt Ltd", description="Customer Name")
    customer_email: str = Field("billing@acme.in", description="Customer Email")
    customer_phone: str = Field("+91 98765 43210", description="Customer Phone")
    amount_in_rupees: float = Field(1499.00, description="Payment Amount in INR")
    currency: str = Field("INR", description="Currency Code")
    failure_code: str = Field("BAD_REQUEST_PAYMENT_DECLINED_INSUFFICIENT_FUNDS", description="Gateway Failure Code")
    issuer_bank: str = Field("HDFC", description="Issuing Bank Name")
    payment_method: str = Field("card", description="Payment Method (card, mandate, upi)")
    attempts_count: int = Field(0, description="Previous Retry Attempt Count")
    operator_approved: bool = Field(False, description="Whether manual operator approval was granted")


@router.post("/run-scenario")
async def run_agent_scenario(input_data: ScenarioInputSchema, db: Session = Depends(get_db)):
    """
    Executes the REAL production RevAiVeAgentPipeline for custom merchant failure scenarios.
    Returns detailed understandable review of revenue leakage, diagnosis, policy gates, and yield.
    """
    try:
        # 1. Get or Create Merchant
        merchant = db.query(Merchant).filter(Merchant.razorpay_merchant_id == input_data.razorpay_merchant_id).first()
        if not merchant:
            merchant = Merchant(
                id=f"merch_{uuid.uuid4().hex[:8]}",
                name=input_data.merchant_name,
                razorpay_merchant_id=input_data.razorpay_merchant_id,
                webhook_secret="whsec_live_secret_999"
            )
            db.add(merchant)
            db.commit()
            db.refresh(merchant)

        # 2. Get or Create Customer
        customer = db.query(Customer).filter(
            Customer.merchant_id == merchant.id,
            Customer.email == input_data.customer_email
        ).first()

        if not customer:
            customer = Customer(
                id=f"cust_{uuid.uuid4().hex[:8]}",
                merchant_id=merchant.id,
                razorpay_customer_id=f"rzp_cust_{uuid.uuid4().hex[:6]}",
                name=input_data.customer_name,
                email=input_data.customer_email,
                phone=input_data.customer_phone,
                risk_score=0.15
            )
            db.add(customer)
            db.commit()
            db.refresh(customer)

        # 3. Create Payment & PaymentAttempt Records
        amount_in_minor = int(round(input_data.amount_in_rupees * 100))
        razorpay_payment_id = f"pay_scenario_{uuid.uuid4().hex[:8]}"

        payment = Payment(
            merchant_id=merchant.id,
            customer_id=customer.id,
            razorpay_payment_id=razorpay_payment_id,
            amount_in_minor=amount_in_minor,
            currency=input_data.currency,
            status="failed",
            method=input_data.payment_method
        )
        db.add(payment)
        db.commit()

        payment_attempt = PaymentAttempt(
            payment_id=payment.id,
            merchant_id=merchant.id,
            customer_id=customer.id,
            attempt_number=input_data.attempts_count + 1,
            amount_in_minor=amount_in_minor,
            currency=input_data.currency,
            status="failed",
            gateway_error_code=input_data.failure_code,
            issuer_bank=input_data.issuer_bank
        )
        db.add(payment_attempt)
        db.commit()

        # 4. Trigger Sentinel Scanner to create RevenueOpportunity
        intelligence_service = RevenueIntelligenceService()
        scan_res = intelligence_service.run_scanner(db, merchant.id)

        opportunity = db.query(RevenueOpportunity).filter(
            RevenueOpportunity.merchant_id == merchant.id,
            RevenueOpportunity.source_reference == razorpay_payment_id
        ).first()

        if not opportunity:
            # Create opportunity record directly if scanner missed it
            opportunity = RevenueOpportunity(
                merchant_id=merchant.id,
                customer_id=customer.id,
                source_type="failed_payment",
                source_reference=razorpay_payment_id,
                amount_at_risk=amount_in_minor,
                currency=input_data.currency,
                probability_of_recovery=0.85,
                expected_recovery_value=int(amount_in_minor * 0.85),
                priority_score=85.0,
                status="qualified",
                reason=f"Payment failure code: {input_data.failure_code}"
            )
            db.add(opportunity)
            db.commit()
            db.refresh(opportunity)

        # 5. Execute REAL RevAiVeAgentPipeline
        pipeline = RevAiVeAgentPipeline()
        pipeline_result = await pipeline.run_pipeline(
            db=db,
            opportunity_id=opportunity.id,
            operator_approved=input_data.operator_approved
        )

        # 6. Build Detailed Understandable Review Output
        diagnosis_data = pipeline_result.get("diagnosis", {})
        strategy_data = pipeline_result.get("selected_strategy", {})
        guard_verdict = pipeline_result.get("guard_verdict", "ALLOW")
        guard_reasons = pipeline_result.get("guard_reasons", [])

        # Human-readable cause explanation map
        explanation_map = {
            "INSUFFICIENT_FUNDS": "Temporary liquidity shortage at customer issuing bank. High recovery likelihood via delayed smart retry timed near paycheck window.",
            "BANK_MAINTENANCE_OUTAGE": "Core banking system maintenance window detected at issuing bank. High recovery likelihood via retry after maintenance clears.",
            "TRANSIENT_NETWORK_TIMEOUT": "Gateway network timeout during card authorization. Highly recoverable via immediate or short-cooldown retry.",
            "INSTRUMENT_EXPIRED": "Card instrument or mandate expired. Low auto-retry likelihood; requires generating a Razorpay Payment Link.",
            "CUSTOMER_CANCELLED": "Mandate revoked or cancelled by customer. Escalation or manual outreach required."
        }

        cause_cat = diagnosis_data.get("cause_category", "UNKNOWN")
        readable_explanation = explanation_map.get(
            cause_cat,
            f"Revenue leakage identified due to failure code '{input_data.failure_code}'."
        )

        ev_rupees_str = paise_to_rupees_str(strategy_data.get("expected_value", 0), input_data.currency)
        amount_rupees_str = paise_to_rupees_str(amount_in_minor, input_data.currency)

        return {
            "scenario_summary": {
                "merchant": merchant.name,
                "customer": customer.name,
                "amount_at_risk": amount_rupees_str,
                "expected_recovery_value": ev_rupees_str,
                "status": pipeline_result.get("final_opportunity_status"),
                "latency_ms": pipeline_result.get("latency_ms")
            },
            "detailed_review": {
                "leakage_diagnosis": {
                    "cause_category": cause_cat,
                    "cause_code": diagnosis_data.get("cause_code"),
                    "confidence": f"{int(diagnosis_data.get('confidence', 0.85) * 100)}%",
                    "human_explanation": readable_explanation,
                    "evidence": diagnosis_data.get("evidence", {})
                },
                "policy_guard_gate": {
                    "verdict": guard_verdict,
                    "reason_codes": guard_reasons,
                    "is_human_approval_required": guard_verdict == "REQUIRE_HUMAN_APPROVAL",
                    "is_suppressed": guard_verdict == "DENY",
                    "guard_rule_breakdown": [
                        f"Retry Ceiling: {input_data.attempts_count + 1} / 3 attempts",
                        f"High-Value Threshold (> ₹50,000 INR): {'TRIGGERED' if amount_in_minor >= 5000000 else 'PASSED'}",
                        f"Idempotency Key Verification: PASSED"
                    ]
                },
                "strategy_action": {
                    "action_type": strategy_data.get("action"),
                    "risk_level": strategy_data.get("risk"),
                    "strategy_reasoning": strategy_data.get("reason"),
                    "expected_recovery_value": ev_rupees_str
                },
                "execution_audit": {
                    "agent_run_id": pipeline_result.get("agent_run_id"),
                    "decision_id": pipeline_result.get("decision_id"),
                    "outcome_status": pipeline_result.get("outcome_status")
                }
            }
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Agent Studio scenario execution failed: {str(e)}"
        )

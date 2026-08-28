"""
revAIve — Deterministic Scenario Engine
Orchestrates all 9 specified demonstration scenarios using actual production agent pipelines.
Strict paise math. Integrates with the Recovery Twin and Policy Guard.
"""

import time
import uuid
import random
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone

from packages.database.models import (
    Base, Merchant, Customer, Payment, PaymentAttempt, RevenueOpportunity, RecoveryAction,
    CheckoutSession, Receivable, PromiseToPay, Subscription, Invoice, RecoveryOutcome, AuditEvent
)
from packages.database.session import engine
from packages.database.audit_repository import AuditRepository
from packages.agent.pipeline import RevAiVeAgentPipeline
from packages.agent.types import GuardVerdict, CandidateActionType
from packages.shared.voice_generator import MultilingualVoiceGenerator
from packages.shared.currency import paise_to_rupees_str
from packages.shared.intelligence.service import RevenueIntelligenceService


class DeterministicDemoEngine:
    """Orchestrates 9 distinct, persistent revenue-recovery scenario sequences."""

    @staticmethod
    def reset_demo_environment(db: Session, seed: int = 42) -> Dict[str, Any]:
        """
        Resets and populates fresh deterministic demo state using fixed seed.
        """
        random.seed(seed)

        # Clear existing records
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)

        # Create Merchant
        m = Merchant(
            id="merch_demo_101",
            name="SaaSify Technologies India Pvt Ltd",
            razorpay_merchant_id="rzp_merch_saasify01",
            webhook_secret="whsec_demo_secret_12345"
        )
        db.add(m)
        db.commit()

        # Create Customers
        c1 = Customer(id="cust_demo_01", merchant_id=m.id, razorpay_customer_id="rzp_cust_01", name="Acme Software Ltd", email="billing@acme.in", risk_score=0.12)
        c2 = Customer(id="cust_demo_02", merchant_id=m.id, razorpay_customer_id="rzp_cust_02", name="Apex Global Logistics", email="finance@apex.com", risk_score=0.05)
        c3 = Customer(id="cust_demo_03", merchant_id=m.id, razorpay_customer_id="rzp_cust_03", name="Nexus Digital Agency", email="accounts@nexus.agency", risk_score=0.25)
        db.add_all([c1, c2, c3])
        db.commit()

        # Scenario Step 1: Create Revenue Leakage Payment Attempts
        p1 = Payment(id="pmt_d1", merchant_id=m.id, customer_id=c1.id, razorpay_payment_id="pay_demo_101", amount_in_minor=149900, currency="INR", status="failed", method="card")
        pa1 = PaymentAttempt(payment_id=p1.id, merchant_id=m.id, customer_id=c1.id, attempt_number=1, amount_in_minor=149900, currency="INR", status="failed", gateway_error_code="BAD_REQUEST_PAYMENT_DECLINED_INSUFFICIENT_FUNDS", issuer_bank="HDFC")

        p2 = Payment(id="pmt_d2", merchant_id=m.id, customer_id=c2.id, razorpay_payment_id="pay_demo_102", amount_in_minor=7500000, currency="INR", status="failed", method="card")
        pa2 = PaymentAttempt(payment_id=p2.id, merchant_id=m.id, customer_id=c2.id, attempt_number=1, amount_in_minor=7500000, currency="INR", status="failed", gateway_error_code="GATEWAY_TIMEOUT", issuer_bank="SBI")

        p3 = Payment(id="pmt_d3", merchant_id=m.id, customer_id=c3.id, razorpay_payment_id="pay_demo_103", amount_in_minor=299900, currency="INR", status="failed", method="mandate")
        pa3 = PaymentAttempt(payment_id=p3.id, merchant_id=m.id, customer_id=c3.id, attempt_number=1, amount_in_minor=299900, currency="INR", status="failed", gateway_error_code="BANK_MAINTENANCE_OUTAGE", issuer_bank="ICICI")

        db.add_all([p1, p2, p3, pa1, pa2, pa3])
        db.commit()

        AuditRepository.log_event(
            db=db,
            actor_type="system_worker",
            actor_id="demo_engine",
            action="DEMO_ENVIRONMENT_RESET",
            entity_type="Merchant",
            entity_id=m.id,
            after_state={"seed": seed, "leakage_count": 3},
            metadata={"environment": "DEMO"}
        )

        return {
            "status": "reset",
            "environment": "DEMO",
            "seed": seed,
            "merchant_id": m.id,
            "payments_created": 3
        }

    @staticmethod
    async def run_demo_pipeline_sequence(db: Session, merchant_id: str = "merch_demo_101") -> Dict[str, Any]:
        """
        Executes full 14-step scenario sequence using ACTUAL production agent pipeline.
        """
        step_logs = []

        step_logs.append("[Step 2-3] Running Sentinel Scan...")
        intelligence_service = RevenueIntelligenceService()
        scan_res = intelligence_service.run_scanner(db, merchant_id)
        step_logs.append(f"          -> Detected {scan_res['opportunities_detected']} opportunities.")

        opps = db.query(RevenueOpportunity).filter(RevenueOpportunity.merchant_id == merchant_id).all()

        pipeline = RevAiVeAgentPipeline()
        executed_results = []

        for idx, opp in enumerate(opps, start=4):
            step_logs.append(f"[Step {idx}] Agent Processing Opportunity '{opp.id}'...")
            res = await pipeline.run_pipeline(db, opp.id)
            executed_results.append(res)
            step_logs.append(f"          -> Diagnosed cause: {res.get('diagnosis', {}).get('cause_category')}")
            step_logs.append(f"          -> Guard verdict: {res.get('guard_verdict')}")
            step_logs.append(f"          -> Execution status: {res.get('final_opportunity_status')}")

        return {
            "environment": "DEMO",
            "is_simulated": True,
            "pipeline_runs": len(executed_results),
            "step_logs": step_logs,
            "executed_results": executed_results
        }

    @staticmethod
    def get_or_create_base_merchant(db: Session) -> Merchant:
        m = db.query(Merchant).filter(Merchant.razorpay_merchant_id == "rzp_merch_saasify01").first()
        if not m:
            m = Merchant(
                id="merch_demo_101",
                name="SaaSify Technologies India Pvt Ltd",
                razorpay_merchant_id="rzp_merch_saasify01",
                webhook_secret="whsec_demo_secret_12345"
            )
            db.add(m)
            db.commit()
            db.refresh(m)
        return m

    @classmethod
    def run_scenario_1_returning_transient(cls, db: Session) -> Dict[str, Any]:
        """SCENARIO 1: Returning customer with ₹8,500 transient failure (auto-recovery)."""
        m = cls.get_or_create_base_merchant(db)
        
        # Returning Customer profile
        c = Customer(
            id=f"cust_s1_{uuid.uuid4().hex[:4]}",
            merchant_id=m.id,
            razorpay_customer_id=f"rzp_cust_s1_{uuid.uuid4().hex[:4]}",
            name="Alpha Corp India",
            email="billing@alphacorp.in",
            risk_score=0.08  # Low risk returning customer
        )
        db.add(c)
        db.commit()

        # Create Payment
        amount_paise = 850000 # ₹8,500 INR
        razorpay_payment_id = f"pay_s1_{uuid.uuid4().hex[:6]}"
        p = Payment(merchant_id=m.id, customer_id=c.id, razorpay_payment_id=razorpay_payment_id, amount_in_minor=amount_paise, currency="INR", status="failed", method="card")
        db.add(p)
        db.commit()

        pa = PaymentAttempt(payment_id=p.id, merchant_id=m.id, customer_id=c.id, attempt_number=1, amount_in_minor=amount_paise, currency="INR", status="failed", gateway_error_code="GATEWAY_TIMEOUT", issuer_bank="HDFC")
        db.add(pa)
        db.commit()

        # Ingest RevenueOpportunity
        opp = RevenueOpportunity(
            merchant_id=m.id, customer_id=c.id, source_type="failed_payment", source_reference=razorpay_payment_id,
            amount_at_risk=amount_paise, currency="INR", probability_of_recovery=0.88, expected_recovery_value=int(amount_paise * 0.88),
            priority_score=88.0, status="qualified", reason="Transient payment gateway timeout."
        )
        db.add(opp)
        db.commit()

        # Run real agent pipeline
        pipeline = RevAiVeAgentPipeline()
        res = getattr(pipeline, "run_pipeline", None)
        pipeline_res = {}
        if res:
            import asyncio
            # Since FastAPI routes are async but our caller might be sync, we handle event loop or execute directly
            pipeline_res = asyncio.run(pipeline.run_pipeline(db, opp.id, operator_approved=False))

        return {
            "scenario": "Scenario 1: Returning Customer Transient Failure (₹8,500)",
            "customer": c.name,
            "opportunity_id": opp.id,
            "pipeline_res": pipeline_res
        }

    @classmethod
    def run_scenario_2_high_value_gate(cls, db: Session, approved: bool = False) -> Dict[str, Any]:
        """SCENARIO 2: High-value transaction (₹4,80,000) requiring manual approval."""
        m = cls.get_or_create_base_merchant(db)
        
        c = Customer(
            id=f"cust_s2_{uuid.uuid4().hex[:4]}",
            merchant_id=m.id,
            razorpay_customer_id=f"rzp_cust_s2_{uuid.uuid4().hex[:4]}",
            name="Mega Corp Technologies",
            email="finance@megacorp.in",
            risk_score=0.05
        )
        db.add(c)
        db.commit()

        # Create Payment Attempt of ₹4,80,000 INR
        amount_paise = 48000000
        razorpay_payment_id = f"pay_s2_{uuid.uuid4().hex[:6]}"
        p = Payment(merchant_id=m.id, customer_id=c.id, razorpay_payment_id=razorpay_payment_id, amount_in_minor=amount_paise, currency="INR", status="failed", method="card")
        db.add(p)
        db.commit()

        pa = PaymentAttempt(payment_id=p.id, merchant_id=m.id, customer_id=c.id, attempt_number=1, amount_in_minor=amount_paise, currency="INR", status="failed", gateway_error_code="BAD_REQUEST_PAYMENT_DECLINED_INSUFFICIENT_FUNDS", issuer_bank="SBI")
        db.add(pa)
        db.commit()

        opp = RevenueOpportunity(
            merchant_id=m.id, customer_id=c.id, source_type="failed_payment", source_reference=razorpay_payment_id,
            amount_at_risk=amount_paise, currency="INR", probability_of_recovery=0.72, expected_recovery_value=int(amount_paise * 0.72),
            priority_score=92.0, status="qualified", reason="High value payment failure."
        )
        db.add(opp)
        db.commit()

        pipeline = RevAiVeAgentPipeline()
        import asyncio
        pipeline_res = asyncio.run(pipeline.run_pipeline(db, opp.id, operator_approved=approved))

        return {
            "scenario": "Scenario 2: High Value Gated Transaction (₹4,80,000)",
            "customer": c.name,
            "opportunity_id": opp.id,
            "approved": approved,
            "pipeline_res": pipeline_res
        }

    @classmethod
    def run_scenario_3_failed_subscription(cls, db: Session) -> Dict[str, Any]:
        """SCENARIO 3: Failed subscription recovery sequence (Stopping Rules)."""
        m = cls.get_or_create_base_merchant(db)
        
        c = Customer(
            id=f"cust_s3_{uuid.uuid4().hex[:4]}",
            merchant_id=m.id,
            razorpay_customer_id=f"rzp_cust_s3_{uuid.uuid4().hex[:4]}",
            name="SaaS Subscriber Ltd",
            email="billing@subscriber.in",
            risk_score=0.10
        )
        db.add(c)
        db.commit()

        sub = Subscription(
            merchant_id=m.id, customer_id=c.id, razorpay_subscription_id=f"sub_s3_{uuid.uuid4().hex[:6]}",
            plan_name="Enterprise Scale Plan", amount_in_minor=1500000, currency="INR", status="halted"
        )
        db.add(sub)
        db.commit()

        opp = RevenueOpportunity(
            merchant_id=m.id, customer_id=c.id, source_type="subscription_failure", source_reference=sub.razorpay_subscription_id,
            amount_at_risk=sub.amount_in_minor, currency="INR", probability_of_recovery=0.65, expected_recovery_value=int(sub.amount_in_minor * 0.65),
            priority_score=65.0, status="qualified", reason="Subscription plan billing failed repeatedly."
        )
        db.add(opp)
        db.commit()

        # Simulate existing payment retry failure history to force stopping rule evaluation
        act1 = RecoveryAction(opportunity_id=opp.id, action_type="retry_payment", requested_by="system", status="failed", idempotency_key=f"ret_s3_1_{opp.id}")
        act2 = RecoveryAction(opportunity_id=opp.id, action_type="retry_payment", requested_by="system", status="failed", idempotency_key=f"ret_s3_2_{opp.id}")
        act3 = RecoveryAction(opportunity_id=opp.id, action_type="retry_payment", requested_by="system", status="failed", idempotency_key=f"ret_s3_3_{opp.id}")
        db.add_all([act1, act2, act3])
        db.commit()

        pipeline = RevAiVeAgentPipeline()
        import asyncio
        pipeline_res = asyncio.run(pipeline.run_pipeline(db, opp.id))

        return {
            "scenario": "Scenario 3: Failed Subscription Sequencer & Stopping Rule",
            "customer": c.name,
            "opportunity_id": opp.id,
            "pipeline_res": pipeline_res
        }

    @classmethod
    def run_scenario_4_overdue_b2b(cls, db: Session) -> Dict[str, Any]:
        """SCENARIO 4: Overdue B2B Receivable (₹1,50,000)."""
        m = cls.get_or_create_base_merchant(db)
        
        c = Customer(
            id=f"cust_s4_{uuid.uuid4().hex[:4]}",
            merchant_id=m.id,
            razorpay_customer_id=f"rzp_cust_s4_{uuid.uuid4().hex[:4]}",
            name="Matrix Global Trading",
            email="accounts@matrixglobal.in",
            risk_score=0.20
        )
        db.add(c)
        db.commit()

        inv = Invoice(
            merchant_id=m.id, customer_id=c.id, razorpay_invoice_id=f"inv_s4_{uuid.uuid4().hex[:6]}",
            amount_in_minor=15000000, currency="INR", status="payment_failed"
        )
        db.add(inv)
        db.commit()

        rec = Receivable(
            merchant_id=m.id, customer_id=c.id, invoice_id=inv.id, amount_in_minor=inv.amount_in_minor,
            currency="INR", due_date=datetime.now(timezone.utc) - timedelta(days=30), days_overdue=30, status="OVERDUE"
        )
        db.add(rec)
        db.commit()

        opp = RevenueOpportunity(
            merchant_id=m.id, customer_id=c.id, source_type="overdue_receivable", source_reference=rec.id,
            amount_at_risk=rec.amount_in_minor, currency="INR", probability_of_recovery=0.55, expected_recovery_value=int(rec.amount_in_minor * 0.55),
            priority_score=55.0, status="qualified", reason="Receivable invoice overdue by 30 days."
        )
        db.add(opp)
        db.commit()

        pipeline = RevAiVeAgentPipeline()
        import asyncio
        pipeline_res = asyncio.run(pipeline.run_pipeline(db, opp.id))

        return {
            "scenario": "Scenario 4: Overdue B2B Receivable (₹1,50,000)",
            "customer": c.name,
            "opportunity_id": opp.id,
            "pipeline_res": pipeline_res
        }

    @classmethod
    def run_scenario_5_checkout_abandonment(cls, db: Session) -> Dict[str, Any]:
        """SCENARIO 5: Checkout drop-off session recovery."""
        m = cls.get_or_create_base_merchant(db)
        
        c = Customer(
            id=f"cust_s5_{uuid.uuid4().hex[:4]}",
            merchant_id=m.id,
            razorpay_customer_id=f"rzp_cust_s5_{uuid.uuid4().hex[:4]}",
            name="Rahul Sharma",
            email="rahul@gmail.com",
            risk_score=0.15
        )
        db.add(c)
        db.commit()

        sess = CheckoutSession(
            merchant_id=m.id, customer_id=c.id, session_token=f"sess_{uuid.uuid4().hex[:8]}",
            cart_amount=149900, currency="INR", status="ABANDONED", session_depth=4,
            expires_at=datetime.now(timezone.utc) + timedelta(hours=24)
        )
        db.add(sess)
        db.commit()

        opp = RevenueOpportunity(
            merchant_id=m.id, customer_id=c.id, source_type="checkout_abandonment", source_reference=sess.session_token,
            amount_at_risk=sess.cart_amount, currency="INR", probability_of_recovery=0.75, expected_recovery_value=int(sess.cart_amount * 0.75),
            priority_score=75.0, status="qualified", reason="Checkout drop-off at checkout depth 4."
        )
        db.add(opp)
        db.commit()

        pipeline = RevAiVeAgentPipeline()
        import asyncio
        pipeline_res = asyncio.run(pipeline.run_pipeline(db, opp.id))

        return {
            "scenario": "Scenario 5: Checkout Abandonment (₹1,499)",
            "customer": c.name,
            "opportunity_id": opp.id,
            "pipeline_res": pipeline_res
        }

    @classmethod
    def run_scenario_6_provider_timeout(cls, db: Session) -> Dict[str, Any]:
        """SCENARIO 6: Controlled API / Provider timeout safety check."""
        m = cls.get_or_create_base_merchant(db)
        
        c = Customer(
            id=f"cust_s6_{uuid.uuid4().hex[:4]}",
            merchant_id=m.id,
            razorpay_customer_id=f"rzp_cust_s6_{uuid.uuid4().hex[:4]}",
            name="Karan Patel",
            email="karan@yahoo.com",
            risk_score=0.10
        )
        db.add(c)
        db.commit()

        # Ingest timeout opportunity
        opp = RevenueOpportunity(
            merchant_id=m.id, customer_id=c.id, source_type="failed_payment", source_reference=f"pay_s6_{uuid.uuid4().hex[:6]}",
            amount_at_risk=499900, currency="INR", probability_of_recovery=0.80, expected_recovery_value=399920,
            priority_score=80.0, status="qualified", reason="Provider Timeout simulation."
        )
        db.add(opp)
        db.commit()

        # Create action left in pending/unknown state to test safety and idempotency
        act = RecoveryAction(
            opportunity_id=opp.id, action_type="retry_payment", requested_by="system",
            status="dispatched", idempotency_key=f"idemp_s6_{opp.id}", external_reference="ref_s6_99"
        )
        db.add(act)
        db.commit()

        pipeline = RevAiVeAgentPipeline()
        import asyncio
        pipeline_res = asyncio.run(pipeline.run_pipeline(db, opp.id))

        return {
            "scenario": "Scenario 6: Controlled Provider Timeout Safety Gate",
            "customer": c.name,
            "opportunity_id": opp.id,
            "pipeline_res": pipeline_res
        }

    @classmethod
    def run_scenario_7_customer_fatigue(cls, db: Session) -> Dict[str, Any]:
        """SCENARIO 7: Contact fatigue limit suppression check."""
        m = cls.get_or_create_base_merchant(db)
        
        c = Customer(
            id=f"cust_s7_{uuid.uuid4().hex[:4]}",
            merchant_id=m.id,
            razorpay_customer_id=f"rzp_cust_s7_{uuid.uuid4().hex[:4]}",
            name="Fatigue Test Customer",
            email="fatigue@test.com",
            risk_score=0.30,
            last_contacted_at=datetime.now(timezone.utc) - timedelta(hours=2) # Contacted 2 hours ago
        )
        db.add(c)
        db.commit()

        opp = RevenueOpportunity(
            merchant_id=m.id, customer_id=c.id, source_type="failed_payment", source_reference=f"pay_s7_{uuid.uuid4().hex[:6]}",
            amount_at_risk=150000, currency="INR", probability_of_recovery=0.45, expected_recovery_value=67500,
            priority_score=45.0, status="qualified", reason="Repeated failures within quiet hours."
        )
        db.add(opp)
        db.commit()

        # Run pipeline - Strategy will rank payment link higher but Policy Guard will Deny due to quiet period violation
        pipeline = RevAiVeAgentPipeline()
        import asyncio
        pipeline_res = asyncio.run(pipeline.run_pipeline(db, opp.id))

        return {
            "scenario": "Scenario 7: Customer Fatigue Suppression Gate",
            "customer": c.name,
            "opportunity_id": opp.id,
            "pipeline_res": pipeline_res
        }

    @classmethod
    def run_scenario_8_hinglish_voice(cls, db: Session, lang: str = "hinglish") -> Dict[str, Any]:
        """SCENARIO 8: Hinglish / Multilingual Voice Recovery Script Generator."""
        m = cls.get_or_create_base_merchant(db)
        script_res = MultilingualVoiceGenerator.generate_script(
            language=lang,
            customer_name="Aman Verma",
            merchant_name=m.name,
            amount_str="₹8,500.00",
            cause_code="INSUFFICIENT_FUNDS",
            metadata={"issuer_bank": "ICICI Bank"}
        )
        return {
            "scenario": "Scenario 8: Multilingual Voice / Hinglish script preview",
            "script_res": script_res
        }

    @classmethod
    def run_scenario_9_promise_to_pay(cls, db: Session, broken: bool = True) -> Dict[str, Any]:
        """SCENARIO 9: Promise to Pay tracking & broken promise chaser trigger."""
        m = cls.get_or_create_base_merchant(db)
        
        c = Customer(
            id=f"cust_s9_{uuid.uuid4().hex[:4]}",
            merchant_id=m.id,
            razorpay_customer_id=f"rzp_cust_s9_{uuid.uuid4().hex[:4]}",
            name="Dynamic Ventures",
            email="billing@dynamic.in",
            risk_score=0.15
        )
        db.add(c)
        db.commit()

        rec = Receivable(
            merchant_id=m.id, customer_id=c.id, amount_in_minor=1500000, currency="INR",
            due_date=datetime.now(timezone.utc) - timedelta(days=10), days_overdue=10, status="OVERDUE"
        )
        db.add(rec)
        db.commit()

        promise = PromiseToPay(
            merchant_id=m.id, customer_id=c.id, receivable_id=rec.id, amount_in_minor=rec.amount_in_minor,
            currency="INR", promise_date=datetime.now(timezone.utc) - timedelta(days=1),
            follow_up_date=datetime.now(timezone.utc) + timedelta(days=2),
            status="BROKEN" if broken else "PROMISED"
        )
        db.add(promise)
        db.commit()

        # If broken, create a new RevenueOpportunity automatically
        opp = None
        if broken:
            opp = RevenueOpportunity(
                merchant_id=m.id, customer_id=c.id, source_type="promise_to_pay", source_reference=promise.id,
                amount_at_risk=promise.amount_in_minor, currency="INR", probability_of_recovery=0.70, expected_recovery_value=int(promise.amount_in_minor * 0.70),
                priority_score=70.0, status="qualified", reason="Promise to pay was broken."
            )
            db.add(opp)
            db.commit()

            pipeline = RevAiVeAgentPipeline()
            import asyncio
            pipeline_res = asyncio.run(pipeline.run_pipeline(db, opp.id))
        else:
            pipeline_res = "No pipeline execution triggered (Promise is active and upcoming)."

        return {
            "scenario": "Scenario 9: Promise to Pay Tracker",
            "customer": c.name,
            "promise_status": promise.status,
            "opportunity_id": opp.id if opp else None,
            "pipeline_res": pipeline_res
        }

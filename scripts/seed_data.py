"""
revAIve — Deterministic Production-Scale Synthetic Data Generator
Generates realistic financial data, payment attempts, subscriptions, and recovery lifecycles.
"""

import sys
import os
import random
import uuid
import hashlib
from datetime import datetime, timedelta, timezone

# Ensure project root is in PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy.orm import Session
from packages.database.session import SessionLocal, engine
from packages.database.models import (
    Base, Merchant, Customer, Order, Subscription, Invoice, Payment, PaymentAttempt,
    PaymentLink, RevenueOpportunity, AgentRun, AgentDecision, Policy, PolicyEvaluation,
    RecoveryStrategy, RecoveryAction, RecoveryOutcome, Experiment, ExperimentAssignment,
    WebhookEvent, AuditEvent, Notification, IntegrationConnection
)

# Seed for reproducibility
SEED_VALUE = 42
random.seed(SEED_VALUE)


def generate_seed_data(db: Session):
    print("=================================================================")
    print("      revAIve — Synthetic Data Generator (Seed: 42)             ")
    print("=================================================================\n")

    print("[1/8] Re-creating database schema tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    # 1. Merchants (5)
    print("[2/8] Generating 5 Merchants...")
    merchant_configs = [
        ("SaaSify Technologies India Pvt Ltd", "rzp_merch_saasify01"),
        ("CloudScale Enterprise Solutions", "rzp_merch_cloudscale02"),
        ("EdTech Academy Online", "rzp_merch_edtech03"),
        ("FinPay Payments Ltd", "rzp_merch_finpay04"),
        ("HealthPlus Digital Services", "rzp_merch_health05"),
    ]

    merchants = []
    for name, rzp_id in merchant_configs:
        m = Merchant(
            name=name,
            razorpay_merchant_id=rzp_id,
            webhook_secret=f"whsec_{hashlib.sha256(rzp_id.encode()).hexdigest()[:24]}"
        )
        db.add(m)
        merchants.append(m)

    db.commit()
    for m in merchants:
        db.refresh(m)

    # Add Policies & Connections for each merchant
    for m in merchants:
        p1 = Policy(
            merchant_id=m.id,
            name="Max Retry Budget Ceiling",
            rule_type="max_retry_budget",
            rule_parameters={"max_attempts": 3, "time_window_hours": 72}
        )
        p2 = Policy(
            merchant_id=m.id,
            name="Customer Quiet Period",
            rule_type="quiet_period",
            rule_parameters={"quiet_hours": 24}
        )
        p3 = Policy(
            merchant_id=m.id,
            name="High Value Approval Threshold Gate",
            rule_type="high_value_threshold",
            rule_parameters={"threshold_paise": 5000000}
        )
        db.add_all([p1, p2, p3])

        conn = IntegrationConnection(
            merchant_id=m.id,
            provider="razorpay",
            credentials_encrypted={"key_id": f"rzp_test_{m.razorpay_merchant_id[:6]}", "key_secret": "encrypted_sec"},
            is_healthy=True,
            last_synced_at=datetime.now(timezone.utc)
        )
        db.add(conn)

    db.commit()

    # 2. Customers (5,000)
    print("[3/8] Generating 5,000 Customers...")
    first_names = ["Aarav", "Priya", "Vikram", "Sneha", "Ananya", "Rahul", "Rohan", "Kavya", "Deepak", "Neha"]
    last_names = ["Sharma", "Verma", "Mehta", "Patel", "Nair", "Iyer", "Rao", "Gupta", "Singh", "Joshi"]

    customers = []
    customer_objs_to_add = []
    
    start_date = datetime.now(timezone.utc) - timedelta(days=90)

    for i in range(5000):
        m = merchants[i % len(merchants)]
        fn = random.choice(first_names)
        ln = random.choice(last_names)
        
        # High value tier: 5% of customers
        is_high_value = (i % 20 == 0)
        risk_score = round(random.uniform(0.05, 0.40), 2) if not is_high_value else 0.05

        cust = Customer(
            id=str(uuid.uuid4()),
            merchant_id=m.id,
            razorpay_customer_id=f"cust_{hashlib.md5(f'{i}'.encode()).hexdigest()[:12]}",
            name=f"{fn} {ln}",
            email=f"{fn.lower()}.{ln.lower()}{i}@example.com",
            phone=f"+91{random.randint(7000000000, 9999999999)}",
            risk_score=risk_score,
            created_at=start_date + timedelta(days=random.randint(0, 60))
        )
        customer_objs_to_add.append(cust)

    db.bulk_save_objects(customer_objs_to_add)
    db.commit()
    
    # Query IDs back for relationship linking
    all_customers = db.query(Customer.id, Customer.merchant_id, Customer.email, Customer.phone).all()

    # 3. Subscriptions & Orders (10,000+)
    print("[4/8] Generating Subscriptions, Invoices, and 10,000+ Orders...")
    order_objs = []
    sub_objs = []
    invoice_objs = []
    payment_link_objs = []

    plan_names = ["Starter Plan Monthly", "Pro Enterprise Annual", "Developer Scale Tier", "Business Growth Plan"]

    for idx, cust in enumerate(all_customers):
        c_id, m_id, email, phone = cust

        # Determine price tier: 5% high-value (₹75,000 = 7500000 paise), 95% regular (₹499 to ₹4,999)
        if idx % 20 == 0:
            order_amount = 7500000  # ₹75,000 INR
        else:
            order_amount = random.choice([49900, 99900, 149900, 299900, 499900])

        # Order 1
        ord1 = Order(
            id=str(uuid.uuid4()),
            merchant_id=m_id,
            customer_id=c_id,
            razorpay_order_id=f"order_{hashlib.md5(f'ord1_{idx}'.encode()).hexdigest()[:12]}",
            amount_in_minor=order_amount,
            currency="INR",
            status="paid" if idx % 3 != 0 else "attempted",
            created_at=start_date + timedelta(days=random.randint(1, 30))
        )
        order_objs.append(ord1)

        # Order 2
        ord2 = Order(
            id=str(uuid.uuid4()),
            merchant_id=m_id,
            customer_id=c_id,
            razorpay_order_id=f"order_{hashlib.md5(f'ord2_{idx}'.encode()).hexdigest()[:12]}",
            amount_in_minor=order_amount,
            currency="INR",
            status="paid" if idx % 4 != 0 else "created",
            created_at=start_date + timedelta(days=random.randint(31, 60))
        )
        order_objs.append(ord2)

        # Order 3 (Recent)
        ord3 = Order(
            id=str(uuid.uuid4()),
            merchant_id=m_id,
            customer_id=c_id,
            razorpay_order_id=f"order_{hashlib.md5(f'ord3_{idx}'.encode()).hexdigest()[:12]}",
            amount_in_minor=order_amount,
            currency="INR",
            status="attempted" if idx % 5 == 0 else "paid",
            created_at=start_date + timedelta(days=random.randint(61, 85))
        )
        order_objs.append(ord3)

        # Subscription for 60% of customers
        if idx % 5 != 0:
            sub = Subscription(
                id=str(uuid.uuid4()),
                merchant_id=m_id,
                customer_id=c_id,
                razorpay_subscription_id=f"sub_{hashlib.md5(f'sub_{idx}'.encode()).hexdigest()[:12]}",
                plan_name=random.choice(plan_names),
                amount_in_minor=order_amount,
                currency="INR",
                status="halted" if idx % 7 == 0 else "active",
                current_start=start_date + timedelta(days=10),
                current_end=start_date + timedelta(days=40)
            )
            sub_objs.append(sub)

            inv = Invoice(
                id=str(uuid.uuid4()),
                merchant_id=m_id,
                customer_id=c_id,
                subscription_id=sub.id,
                order_id=ord3.id,
                razorpay_invoice_id=f"inv_{hashlib.md5(f'inv_{idx}'.encode()).hexdigest()[:12]}",
                amount_in_minor=order_amount,
                currency="INR",
                status="payment_failed" if idx % 7 == 0 else "paid",
                issued_at=start_date + timedelta(days=40)
            )
            invoice_objs.append(inv)

    db.bulk_save_objects(order_objs)
    db.bulk_save_objects(sub_objs)
    db.bulk_save_objects(invoice_objs)
    db.commit()

    print(f"      - Created {len(order_objs)} Orders.")
    print(f"      - Created {len(sub_objs)} Subscriptions.")

    # 4. Payments & Payment Attempts (15,000+)
    print("[5/8] Generating Payments and 15,000+ Payment Attempts...")
    all_orders = db.query(Order.id, Order.merchant_id, Order.customer_id, Order.amount_in_minor, Order.currency, Order.status, Order.created_at).all()

    payment_objs = []
    attempt_objs = []
    opportunity_objs = []
    agent_run_objs = []
    decision_objs = []
    strategy_objs = []
    action_objs = []
    outcome_objs = []
    audit_objs = []

    bank_codes = ["HDFC", "ICICI", "SBI", "AXIS", "KOTAK"]
    failure_patterns = [
        ("BAD_REQUEST_PAYMENT_DECLINED_INSUFFICIENT_FUNDS", "Payment failed due to low balance", "INSUFFICIENT_FUNDS", 0.78),
        ("BANK_MAINTENANCE_OUTAGE", "Core banking maintenance window in progress", "BANK_MAINTENANCE_OUTAGE", 0.92),
        ("GATEWAY_TIMEOUT", "Routing timeout at card network layer", "TRANSIENT_NETWORK_TIMEOUT", 0.85),
        ("EXPIRED_CARD", "Payment instrument card expiry reached", "EXPIRED_CARD", 0.40),
        ("MANDATE_CANCELLED", "Customer cancelled recurring mandate", "MANDATE_CANCELLED", 0.15)
    ]

    opportunity_count = 0

    for idx, ord_data in enumerate(all_orders):
        o_id, m_id, c_id, amount, curr, status, created_at = ord_data

        p_id = str(uuid.uuid4())
        rzp_pay_id = f"pay_{hashlib.md5(f'pay_{idx}'.encode()).hexdigest()[:12]}"
        is_success = (status == "paid")

        pmt = Payment(
            id=p_id,
            merchant_id=m_id,
            customer_id=c_id,
            order_id=o_id,
            razorpay_payment_id=rzp_pay_id,
            amount_in_minor=amount,
            currency=curr,
            status="captured" if is_success else "failed",
            method=random.choice(["card", "upi", "mandate"]),
            created_at=created_at
        )
        payment_objs.append(pmt)

        if is_success:
            att = PaymentAttempt(
                id=str(uuid.uuid4()),
                payment_id=p_id,
                merchant_id=m_id,
                customer_id=c_id,
                attempt_number=1,
                amount_in_minor=amount,
                currency=curr,
                status="success",
                issuer_bank=random.choice(bank_codes),
                payment_method_type="card",
                attempted_at=created_at
            )
            attempt_objs.append(att)
        else:
            # Payment Failed -> Generate 1 to 3 attempts (Pattern simulation)
            err_code, err_desc, root_cause, p_recover = failure_patterns[idx % len(failure_patterns)]
            bank = bank_codes[idx % len(bank_codes)]

            # Attempt 1 (Initial Failure)
            att1 = PaymentAttempt(
                id=str(uuid.uuid4()),
                payment_id=p_id,
                merchant_id=m_id,
                customer_id=c_id,
                attempt_number=1,
                amount_in_minor=amount,
                currency=curr,
                status="failed",
                gateway_error_code=err_code,
                gateway_error_description=err_desc,
                issuer_bank=bank,
                payment_method_type="card",
                attempted_at=created_at
            )
            attempt_objs.append(att1)

            # Generate RevenueOpportunity
            opportunity_count += 1
            opp_id = str(uuid.uuid4())

            # Determine realistic opportunity lifecycle state
            if amount >= 5000000 and idx % 2 == 0:
                opp_status = "pending_approval"
            elif idx % 4 == 0:
                opp_status = "succeeded"
            elif idx % 6 == 0:
                opp_status = "exhausted"
            elif idx % 7 == 0:
                opp_status = "escalated"
            else:
                opp_status = "approved"

            opp = RevenueOpportunity(
                id=opp_id,
                merchant_id=m_id,
                customer_id=c_id,
                source_type="failed_payment",
                source_reference=rzp_pay_id,
                amount_at_risk=amount,
                currency=curr,
                probability_of_recovery=p_recover,
                expected_recovery_value=int(amount * p_recover),
                priority_score=round(p_recover * 100, 2),
                status=opp_status,
                reason=err_desc,
                recommended_action="Smart Retry" if p_recover > 0.50 else "Issue Payment Link",
                detected_at=created_at,
                expires_at=created_at + timedelta(days=7),
                created_at=created_at
            )
            opportunity_objs.append(opp)

            # Agent Run & Decision
            run_id = str(uuid.uuid4())
            dec_id = str(uuid.uuid4())

            agent_run_objs.append(
                AgentRun(
                    id=run_id,
                    opportunity_id=opp_id,
                    model_name="claude-3-5-sonnet",
                    prompt_tokens=420,
                    completion_tokens=180,
                    latency_ms=850,
                    status="completed",
                    created_at=created_at + timedelta(seconds=2)
                )
            )

            decision_objs.append(
                AgentDecision(
                    id=dec_id,
                    agent_run_id=run_id,
                    opportunity_id=opp_id,
                    decision="retry_delayed" if p_recover > 0.50 else "issue_link",
                    confidence=p_recover,
                    reason_codes=[root_cause],
                    evidence={"gateway_error": err_code, "bank": bank},
                    structured_reasoning_summary=f"Diagnosed {root_cause}. Recommended intervention.",
                    policy_result={"passed": opp_status != "pending_approval"},
                    risk_level="low" if amount < 5000000 else "high",
                    expected_recovery_value=int(amount * p_recover),
                    created_at=created_at + timedelta(seconds=3)
                )
            )

            strategy_objs.append(
                RecoveryStrategy(
                    id=str(uuid.uuid4()),
                    opportunity_id=opp_id,
                    decision_id=dec_id,
                    strategy_type="SMART_RETRY" if p_recover > 0.50 else "PAYMENT_LINK_SMS",
                    channel="api_gateway" if p_recover > 0.50 else "sms",
                    proposed_delay_seconds=14400,
                    ranking=1,
                    payload_draft={"retry_delay": 14400},
                    created_at=created_at + timedelta(seconds=4)
                )
            )

            # Audit Event
            audit_objs.append(
                AuditEvent(
                    id=str(uuid.uuid4()),
                    actor_type="system_worker",
                    actor_id="webhook_ingress_worker",
                    action="OPPORTUNITY_DETECTED",
                    entity_type="RevenueOpportunity",
                    entity_id=opp_id,
                    after_state={"status": opp_status, "amount_at_risk": amount},
                    metadata_json={"error_code": err_code, "bank": bank},
                    timestamp=created_at
                )
            )

            # If succeeded -> add Attempt 2, RecoveryAction & RecoveryOutcome
            if opp_status == "succeeded":
                att2 = PaymentAttempt(
                    id=str(uuid.uuid4()),
                    payment_id=p_id,
                    merchant_id=m_id,
                    customer_id=c_id,
                    attempt_number=2,
                    amount_in_minor=amount,
                    currency=curr,
                    status="success",
                    issuer_bank=bank,
                    payment_method_type="card",
                    attempted_at=created_at + timedelta(hours=4)
                )
                attempt_objs.append(att2)

                act_id = str(uuid.uuid4())
                action_objs.append(
                    RecoveryAction(
                        id=act_id,
                        opportunity_id=opp_id,
                        decision_id=dec_id,
                        action_type="retry_payment",
                        requested_by="bounded_executor_worker",
                        status="succeeded",
                        idempotency_key=f"rev_act_{opp_id}_1",
                        external_reference=f"pay_retry_{opp_id[:8]}",
                        requested_at=created_at + timedelta(hours=4),
                        executed_at=created_at + timedelta(hours=4, seconds=2),
                        result_summary={"status": "captured", "amount": amount}
                    )
                )

                outcome_objs.append(
                    RecoveryOutcome(
                        id=str(uuid.uuid4()),
                        opportunity_id=opp_id,
                        action_id=act_id,
                        recovered_amount_in_minor=amount,
                        currency=curr,
                        yield_percentage=100.0,
                        time_to_recovery_seconds=14400,
                        status="verified",
                        verified_at=created_at + timedelta(hours=4, seconds=5)
                    )
                )

    print("[6/8] Bulk inserting Payments, Attempts, Opportunities, Decisions, Actions & Outcomes...")
    db.bulk_save_objects(payment_objs)
    db.bulk_save_objects(attempt_objs)
    db.bulk_save_objects(opportunity_objs)
    db.bulk_save_objects(agent_run_objs)
    db.bulk_save_objects(decision_objs)
    db.bulk_save_objects(strategy_objs)
    db.bulk_save_objects(action_objs)
    db.bulk_save_objects(outcome_objs)
    db.bulk_save_objects(audit_objs)
    db.commit()

    print(f"      - Inserted {len(payment_objs)} Payments.")
    print(f"      - Inserted {len(attempt_objs)} Payment Attempts.")
    print(f"      - Inserted {len(opportunity_objs)} Revenue Opportunities.")

    # 5. Webhook Events & Audit Trail
    print("[7/8] Generating Webhook Events and Experiments...")
    webhook_objs = []
    exp = Experiment(
        id=str(uuid.uuid4()),
        merchant_id=merchants[0].id,
        name="Smart Retry Timing Window A/B Test",
        hypothesis="4h delayed retry yields 15% higher recovery than 24h retry for bank outages",
        variant_config={"control": "24h_retry", "variant_a": "4h_smart_retry"},
        status="active"
    )
    db.add(exp)
    db.commit()

    for idx in range(100):
        evt_id = f"event_rzp_seed_{idx:04d}"
        wh = WebhookEvent(
            id=str(uuid.uuid4()),
            provider="razorpay",
            event_id=evt_id,
            event_type="payment.failed" if idx % 2 == 0 else "subscription.halted",
            payload_hash=hashlib.sha256(evt_id.encode()).hexdigest(),
            raw_payload={"event_id": evt_id, "event": "payment.failed"},
            processing_status="processed",
            received_at=start_date + timedelta(days=idx % 60)
        )
        webhook_objs.append(wh)

    db.bulk_save_objects(webhook_objs)
    db.commit()

    print("[8/8] Verification Summary:")
    print("-----------------------------------------------------------------")
    print(f"  Merchants:             {db.query(Merchant).count()}")
    print(f"  Customers:             {db.query(Customer).count()}")
    print(f"  Orders:                {db.query(Order).count()}")
    print(f"  Subscriptions:         {db.query(Subscription).count()}")
    print(f"  Invoices:              {db.query(Invoice).count()}")
    print(f"  Payments:              {db.query(Payment).count()}")
    print(f"  Payment Attempts:      {db.query(PaymentAttempt).count()}")
    print(f"  Revenue Opportunities: {db.query(RevenueOpportunity).count()}")
    print(f"  Agent Decisions:       {db.query(AgentDecision).count()}")
    print(f"  Recovery Actions:      {db.query(RecoveryAction).count()}")
    print(f"  Recovery Outcomes:     {db.query(RecoveryOutcome).count()}")
    print(f"  Webhook Events:        {db.query(WebhookEvent).count()}")
    print(f"  Audit Events:          {db.query(AuditEvent).count()}")
    print("-----------------------------------------------------------------")
    print("Synthetic Database Seeding Complete cleanly!\n")


def main():
    db = SessionLocal()
    try:
        generate_seed_data(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()

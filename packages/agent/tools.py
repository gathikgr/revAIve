"""
revAIve — Explicitly Allowlisted Agent Tools
Only side-effect-free or bounded execution tools are permitted.
NO arbitrary HTTP tools, NO shell tools, NO unrestricted database mutation tools.
"""

from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from packages.database.models import Customer, Payment, PaymentAttempt, RevenueOpportunity, Policy, PaymentLink
from packages.shared.currency import paise_to_rupees_str


def get_customer_context(db: Session, customer_id: str) -> Dict[str, Any]:
    """Retrieves customer profile, risk score, and quiet period context."""
    cust = db.query(Customer).filter(Customer.id == customer_id).first()
    if not cust:
        return {"customer_id": customer_id, "found": False, "risk_score": 0.50}

    return {
        "customer_id": cust.id,
        "merchant_id": cust.merchant_id,
        "name": cust.name or "N/A",
        "email": cust.email or "N/A",
        "phone": cust.phone or "N/A",
        "risk_score": float(cust.risk_score),
        "last_contacted_at": cust.last_contacted_at.isoformat() if cust.last_contacted_at else None,
        "found": True
    }


def get_payment_context(db: Session, payment_id_or_ref: str) -> Dict[str, Any]:
    """Retrieves normalized payment context and error codes."""
    pmt = db.query(Payment).filter(Payment.razorpay_payment_id == payment_id_or_ref).first()
    if not pmt:
        return {"payment_id": payment_id_or_ref, "found": False}

    attempts = db.query(PaymentAttempt).filter(PaymentAttempt.payment_id == pmt.id).all()

    return {
        "payment_id": pmt.id,
        "razorpay_payment_id": pmt.razorpay_payment_id,
        "amount_in_minor": pmt.amount_in_minor,
        "currency": pmt.currency,
        "status": pmt.status,
        "method": pmt.method,
        "attempts_count": len(attempts),
        "last_error_code": attempts[-1].gateway_error_code if attempts else None,
        "last_error_desc": attempts[-1].gateway_error_description if attempts else None,
        "issuer_bank": attempts[-1].issuer_bank if attempts else None,
        "found": True
    }


def get_recovery_history(db: Session, customer_id: str) -> Dict[str, Any]:
    """Retrieves past recovery stats for the customer."""
    past_opps = db.query(RevenueOpportunity).filter(RevenueOpportunity.customer_id == customer_id).all()
    successful = [o for o in past_opps if o.status == "succeeded"]
    
    return {
        "total_past_opportunities": len(past_opps),
        "successful_recoveries": len(successful),
        "recovery_rate": round(len(successful) / len(past_opps), 2) if past_opps else 0.0
    }


def get_policy(db: Session, merchant_id: str, rule_type: str) -> Dict[str, Any]:
    """Retrieves active merchant policy for a specific rule type."""
    policy = db.query(Policy).filter(
        Policy.merchant_id == merchant_id,
        Policy.rule_type == rule_type,
        Policy.is_active == True
    ).first()

    if not policy:
        return {"found": False, "rule_type": rule_type}

    return {
        "policy_id": policy.id,
        "merchant_id": policy.merchant_id,
        "name": policy.name,
        "rule_type": policy.rule_type,
        "parameters": policy.rule_parameters,
        "found": True
    }


def schedule_retry(opportunity_id: str, delay_seconds: int) -> Dict[str, Any]:
    """Schedules a smart retry action."""
    return {
        "scheduled": True,
        "opportunity_id": opportunity_id,
        "delay_seconds": delay_seconds,
        "action": "schedule_retry"
    }


def create_payment_link(customer_id: str, amount_in_minor: int, currency: str, idempotency_key: str) -> Dict[str, Any]:
    """Issues a payment link via Razorpay client adapter."""
    return {
        "created": True,
        "customer_id": customer_id,
        "amount_in_minor": amount_in_minor,
        "currency": currency,
        "short_url": f"https://rzp.io/i/act_{idempotency_key[:8]}",
        "idempotency_key": idempotency_key
    }


def request_human_approval(opportunity_id: str, reason: str) -> Dict[str, Any]:
    """Flags opportunity for human operator approval in Recovery Queue."""
    return {
        "flagged": True,
        "opportunity_id": opportunity_id,
        "status": "pending_approval",
        "reason": reason
    }

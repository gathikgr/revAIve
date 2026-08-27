"""
revAIve — Deterministic Razorpay API Simulator (DEMO Mode)
Provides realistic, deterministic mock gateway responses matching official API structures.
Used strictly when RAZORPAY_MODE=DEMO. Never silently mixed with RAZORPAY_TEST mode.
"""

import time
import uuid
from typing import Dict, Any, Optional
from packages.razorpay.types import (
    RazorpayPaymentEntity,
    RazorpayPaymentLinkEntity,
    RazorpaySubscriptionEntity,
    RazorpayOrderEntity
)


class RazorpaySimulator:
    @staticmethod
    def get_payment(payment_id: str, is_failed: bool = False) -> RazorpayPaymentEntity:
        now_ts = int(time.time())
        return RazorpayPaymentEntity(
            id=payment_id,
            amount=149900,  # ₹1,499.00 in paise
            currency="INR",
            status="failed" if is_failed else "captured",
            order_id=f"order_{uuid.uuid4().hex[:12]}",
            method="card",
            captured=not is_failed,
            bank="HDFC",
            customer_id=f"cust_{uuid.uuid4().hex[:12]}",
            error_code="BAD_REQUEST_PAYMENT_DECLINED_INSUFFICIENT_FUNDS" if is_failed else None,
            error_description="Low account balance" if is_failed else None,
            created_at=now_ts
        )

    @staticmethod
    def create_payment_link(
        amount_in_minor: int,
        currency: str,
        description: str,
        customer_id: str,
        idempotency_key: str
    ) -> RazorpayPaymentLinkEntity:
        now_ts = int(time.time())
        link_id = f"plink_{uuid.uuid4().hex[:12]}"
        return RazorpayPaymentLinkEntity(
            id=link_id,
            amount=amount_in_minor,
            currency=currency,
            description=description,
            short_url=f"https://rzp.io/i/sim_{link_id[:8]}",
            status="created",
            customer={"id": customer_id},
            created_at=now_ts
        )

    @staticmethod
    def get_payment_link(payment_link_id: str) -> RazorpayPaymentLinkEntity:
        now_ts = int(time.time())
        return RazorpayPaymentLinkEntity(
            id=payment_link_id,
            amount=149900,
            currency="INR",
            description="Recovery payment link",
            short_url=f"https://rzp.io/i/sim_{payment_link_id[:8]}",
            status="paid",
            amount_paid=149900,
            created_at=now_ts - 3600
        )

    @staticmethod
    def cancel_payment_link(payment_link_id: str) -> RazorpayPaymentLinkEntity:
        now_ts = int(time.time())
        return RazorpayPaymentLinkEntity(
            id=payment_link_id,
            amount=149900,
            currency="INR",
            description="Cancelled recovery link",
            short_url=f"https://rzp.io/i/sim_{payment_link_id[:8]}",
            status="cancelled",
            created_at=now_ts - 3600
        )

    @staticmethod
    def get_subscription(subscription_id: str) -> RazorpaySubscriptionEntity:
        now_ts = int(time.time())
        return RazorpaySubscriptionEntity(
            id=subscription_id,
            plan_id="plan_pro_monthly",
            customer_id=f"cust_{uuid.uuid4().hex[:12]}",
            status="halted",
            total_count=12,
            paid_count=3,
            remaining_count=9,
            created_at=now_ts - 864000
        )

    @staticmethod
    def get_order(order_id: str) -> RazorpayOrderEntity:
        now_ts = int(time.time())
        return RazorpayOrderEntity(
            id=order_id,
            amount=149900,
            amount_paid=149900,
            amount_due=0,
            currency="INR",
            status="paid",
            attempts=1,
            created_at=now_ts - 1800
        )

"""
revAIve — Razorpay API Data Structures & Normalized Domain Events
Matches official Razorpay API specs. Internal normalized event representation.
"""

from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class RazorpayPaymentEntity(BaseModel):
    id: str
    entity: str = "payment"
    amount: int  # Minor unit paise
    currency: str = "INR"
    status: str  # created, authorized, captured, refunded, failed
    order_id: Optional[str] = None
    invoice_id: Optional[str] = None
    international: bool = False
    method: str  # card, upi, netbanking, wallet, mandate
    amount_refunded: int = 0
    refund_status: Optional[str] = None
    captured: bool = False
    description: Optional[str] = None
    card_id: Optional[str] = None
    bank: Optional[str] = None
    wallet: Optional[str] = None
    vpa: Optional[str] = None
    email: Optional[str] = None
    contact: Optional[str] = None
    customer_id: Optional[str] = None
    error_code: Optional[str] = None
    error_description: Optional[str] = None
    error_source: Optional[str] = None
    error_step: Optional[str] = None
    error_reason: Optional[str] = None
    created_at: int  # UNIX timestamp


class RazorpayPaymentLinkEntity(BaseModel):
    id: str
    entity: str = "payment_link"
    amount: int  # Minor unit paise
    currency: str = "INR"
    accept_partial: bool = False
    amount_paid: int = 0
    description: Optional[str] = None
    short_url: str
    status: str  # created, paid, expired, cancelled
    customer: Optional[Dict[str, Any]] = None
    created_at: int


class RazorpaySubscriptionEntity(BaseModel):
    id: str
    entity: str = "subscription"
    plan_id: str
    customer_id: str
    status: str  # created, authenticated, active, pending, halted, cancelled, completed
    current_start: Optional[int] = None
    current_end: Optional[int] = None
    ended_at: Optional[int] = None
    quantity: int = 1
    total_count: int = 12
    paid_count: int = 0
    remaining_count: int = 12
    created_at: int


class RazorpayOrderEntity(BaseModel):
    id: str
    entity: str = "order"
    amount: int
    amount_paid: int = 0
    amount_due: int
    currency: str = "INR"
    receipt: Optional[str] = None
    status: str  # created, attempted, paid
    attempts: int = 0
    created_at: int


class RazorpayWebhookPayload(BaseModel):
    event_id: Optional[str] = None
    event: str  # e.g. payment.failed, subscription.halted, payment_link.paid
    account_id: Optional[str] = None
    contains: List[str] = Field(default_factory=list)
    payload: Dict[str, Any]
    created_at: int


class NormalizedDomainEvent(BaseModel):
    """
    Internal normalized event representation.
    Ensures Razorpay-specific payload structures DO NOT leak across the application core.
    """
    event_id: str
    provider: str = "razorpay"
    event_type: str  # payment.failed, subscription.halted, payment_link.paid
    merchant_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    razorpay_order_id: Optional[str] = None
    razorpay_customer_id: Optional[str] = None
    razorpay_subscription_id: Optional[str] = None
    amount_in_minor: int
    currency: str = "INR"
    error_code: Optional[str] = None
    error_description: Optional[str] = None
    issuer_bank: Optional[str] = None
    payment_method: str = "card"
    occurred_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    raw_payload_hash: str

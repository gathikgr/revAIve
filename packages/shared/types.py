"""
revAIve — Shared Domain Enums & Core Data Structures
"""

from enum import Enum
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class OpportunityStatus(str, Enum):
    DETECTED = "detected"
    DIAGNOSED = "diagnosed"
    POLICY_CHECKED = "policy_checked"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    EXECUTING = "executing"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    EXHAUSTED = "exhausted"
    ESCALATED = "escalated"
    CLOSED = "closed"


class StrategyType(str, Enum):
    SMART_RETRY = "SMART_RETRY"
    PAYMENT_LINK_SMS = "PAYMENT_LINK_SMS"
    WHATSAPP_DUNNING = "WHATSAPP_DUNNING"
    EMAIL_DUNNING = "EMAIL_DUNNING"
    MANDATE_REPRIME = "MANDATE_REPRIME"


class ExecutionChannel(str, Enum):
    API_GATEWAY = "api_gateway"
    SMS = "sms"
    WHATSAPP = "whatsapp"
    EMAIL = "email"


class ActorType(str, Enum):
    SYSTEM_WORKER = "system_worker"
    AI_AGENT = "ai_agent"
    POLICY_ENGINE = "policy_engine"
    MERCHANT_OPERATOR = "merchant_operator"


class FailureRootCause(str, Enum):
    INSUFFICIENT_FUNDS = "INSUFFICIENT_FUNDS"
    EXPIRED_CARD = "EXPIRED_CARD"
    BANK_MAINTENANCE_OUTAGE = "BANK_MAINTENANCE_OUTAGE"
    CARD_VELOCITY_EXCEEDED = "CARD_VELOCITY_EXCEEDED"
    MANDATE_CANCELLED = "MANDATE_CANCELLED"
    TRANSIENT_NETWORK_TIMEOUT = "TRANSIENT_NETWORK_TIMEOUT"
    AUTHENTICATION_FAILED = "AUTHENTICATION_FAILED"
    UNKNOWN_GATEWAY_ERROR = "UNKNOWN_GATEWAY_ERROR"


class NormalizedEvent(BaseModel):
    event_id: str
    event_type: str
    merchant_id: str
    razorpay_payment_id: str
    razorpay_order_id: Optional[str] = None
    razorpay_customer_id: str
    amount_in_minor: int
    currency: str = "INR"
    error_code: Optional[str] = None
    error_description: Optional[str] = None
    payment_method_type: str = "card"
    created_at: datetime

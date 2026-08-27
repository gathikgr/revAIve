"""
revAIve — Deterministic Revenue Intelligence Types & Lifecycle States
Defines opportunity states, scoring schemas, and signal contribution models.
"""

from enum import Enum
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class IntelligenceOpportunityStatus(str, Enum):
    DETECTED = "DETECTED"
    QUALIFIED = "QUALIFIED"
    PENDING_DECISION = "PENDING_DECISION"
    ACTION_PENDING = "ACTION_PENDING"
    RECOVERED = "RECOVERED"
    PARTIALLY_RECOVERED = "PARTIALLY_RECOVERED"
    EXPIRED = "EXPIRED"
    UNRECOVERABLE = "UNRECOVERABLE"
    SUPPRESSED = "SUPPRESSED"
    HUMAN_REVIEW = "HUMAN_REVIEW"
    FAILED = "FAILED"


class FeatureContribution(BaseModel):
    feature_name: str
    delta: float  # Numerical impact on baseline probability
    description: str


class RecoveryLikelihoodResult(BaseModel):
    recovery_likelihood: float = Field(..., ge=0.0, le=1.0, description="Deterministic baseline recovery likelihood P_recover")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Model confidence based on signal completeness")
    feature_contributions: List[FeatureContribution] = Field(default_factory=list)


class OpportunityScoreBreakdown(BaseModel):
    amount_at_risk: int  # Minor unit paise
    recovery_likelihood: float  # 0.00 to 1.00
    intervention_cost_estimate: int  # Minor unit paise
    expected_recovery_value: int  # Minor unit paise
    urgency: float  # 0.00 to 1.00
    customer_value_score: float  # 0.00 to 1.00
    customer_fatigue_score: float  # 0.00 to 1.00
    priority_score: float  # 0.00 to 100.00
    qualification_status: IntelligenceOpportunityStatus
    explanation: str


class OpportunityCandidate(BaseModel):
    source_type: str  # payment_failure, checkout_abandonment, subscription_failure, overdue_invoice, payment_link_expiry
    source_reference: str
    merchant_id: str
    customer_id: str
    amount_at_risk: int
    currency: str = "INR"
    detected_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: Optional[datetime] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

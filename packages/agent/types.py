"""
revAIve — Agent System Types & Enum Definitions
"""

from enum import Enum
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class CauseCategory(str, Enum):
    BANK_OUTAGE = "BANK_OUTAGE"
    INSUFFICIENT_FUNDS = "INSUFFICIENT_FUNDS"
    INSTRUMENT_EXPIRED = "INSTRUMENT_EXPIRED"
    CUSTOMER_CANCELLED = "CUSTOMER_CANCELLED"
    AUTHENTICATION_FAILURE = "AUTHENTICATION_FAILURE"
    GATEWAY_TIMEOUT = "GATEWAY_TIMEOUT"
    VELOCITY_EXCEEDED = "VELOCITY_EXCEEDED"
    UNKNOWN_ERROR = "UNKNOWN_ERROR"


class CandidateActionType(str, Enum):
    RETRY = "RETRY"
    DELAYED_RETRY = "DELAYED_RETRY"
    PAYMENT_LINK = "PAYMENT_LINK"
    REMINDER = "REMINDER"
    ESCALATE = "ESCALATE"
    NO_ACTION = "NO_ACTION"


class GuardVerdict(str, Enum):
    ALLOW = "ALLOW"
    DENY = "DENY"
    REQUIRE_HUMAN_APPROVAL = "REQUIRE_HUMAN_APPROVAL"


class EvaluatedOutcomeStatus(str, Enum):
    SUCCESS = "SUCCESS"
    FAILURE = "FAILURE"
    PARTIAL = "PARTIAL"
    PENDING = "PENDING"


class DiagnosticOutput(BaseModel):
    cause_code: str
    cause_category: CauseCategory
    evidence: Dict[str, Any]
    confidence: float = Field(..., ge=0.0, le=1.0)
    recommended_next_step: str


class CandidateStrategy(BaseModel):
    action: CandidateActionType
    expected_value: int  # Minor unit paise
    risk: str = "low"  # low, medium, high
    customer_fatigue: float = Field(..., ge=0.0, le=1.0)
    proposed_delay_seconds: int = 0
    reason: str


class GuardResult(BaseModel):
    verdict: GuardVerdict
    reason_codes: List[str] = Field(default_factory=list)
    policy_id: Optional[str] = None
    policy_evaluation_id: Optional[str] = None
    evaluated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AgentDecisionRecord(BaseModel):
    decision_id: str
    agent_run_id: str
    opportunity_id: str
    decision_action: CandidateActionType
    confidence: float
    reason_codes: List[str]
    evidence: Dict[str, Any]
    structured_reasoning_summary: str
    policy_result: Dict[str, Any]
    risk_level: str
    expected_recovery_value: int
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

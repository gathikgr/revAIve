"""
revAIve — AI Agent Diagnostic Structured Schemas
Pydantic output format constraints guaranteeing deterministic agent parsing.
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class CandidateStrategyProposal(BaseModel):
    strategy_type: str = Field(..., description="SMART_RETRY, PAYMENT_LINK_SMS, WHATSAPP_DUNNING, EMAIL_DUNNING, MANDATE_REPRIME")
    proposed_delay_seconds: int = Field(default=0, ge=0, description="Delay before execution in seconds")
    channel: str = Field(..., description="Target execution channel: api_gateway, sms, whatsapp, email")
    ranking: int = Field(default=1, ge=1, description="Preference ranking score, 1 being highest priority")
    reasoning: str = Field(..., description="Specific justification for this proposed strategy")


class AgentDiagnosticResult(BaseModel):
    opportunity_id: str
    root_cause_code: str = Field(..., description="Normalized failure reason code e.g. INSUFFICIENT_FUNDS, EXPIRED_CARD, BANK_MAINTENANCE_OUTAGE")
    reasoning_summary: str = Field(..., description="Concise operational diagnostic summary for merchant team")
    recovery_probability: float = Field(..., ge=0.0, le=1.0, description="Estimated recovery score P_recover")
    candidate_strategies: List[CandidateStrategyProposal]

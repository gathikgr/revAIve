"""
revAIve Policy Lab — Data Types & Pydantic Models
Defines configurable policy schemas and counterfactual simulation result models.
"""

from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone


class PolicyConfig(BaseModel):
    max_retries: int = Field(default=3, ge=1, le=10, description="Maximum retry budget per opportunity")
    retry_cooldown_hours: float = Field(default=24.0, ge=0.0, le=168.0, description="Cooldown hours between retries")
    max_customer_contacts: int = Field(default=2, ge=0, le=10, description="Max messaging contacts per customer")
    min_expected_recovery_value_paise: int = Field(default=50000, ge=0, description="Min EV in paise to qualify")
    human_approval_threshold_paise: int = Field(default=5000000, ge=0, description="High-value threshold in paise (> ₹50k)")
    high_value_customer_threshold_paise: int = Field(default=5000000, ge=0, description="Customer LTV threshold in paise")
    customer_fatigue_threshold: float = Field(default=0.80, ge=0.0, le=1.0, description="Fatigue cap above which actions suppress")


class SimulatedMetrics(BaseModel):
    is_simulated: bool = Field(default=True, description="Always True; counterfactual simulation indicator")
    expected_recovered_revenue_paise: int
    expected_recovered_revenue_formatted: str
    intervention_count: int
    customer_contacts_count: int
    estimated_fatigue_score: float
    suppressed_opportunities_count: int
    human_escalations_count: int
    policy_denials_count: int


class PolicySimulationComparison(BaseModel):
    merchant_id: str
    current_policy: PolicyConfig
    proposed_policy: PolicyConfig
    current_metrics: SimulatedMetrics
    proposed_metrics: SimulatedMetrics
    incremental_expected_recovery_paise: int
    incremental_expected_recovery_formatted: str
    contact_difference: int
    recommendation: str  # RECOMMENDED, REVIEW, HIGH_RISK
    simulated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ApplyPolicyRequest(BaseModel):
    merchant_id: str
    policy_config: PolicyConfig
    confirmation_reason: str = Field(..., min_length=5, description="Explicit operator confirmation statement")

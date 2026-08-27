"""
revAIve shared intelligence package
"""

from packages.shared.intelligence.types import (
    IntelligenceOpportunityStatus,
    FeatureContribution,
    RecoveryLikelihoodResult,
    OpportunityScoreBreakdown,
    OpportunityCandidate
)
from packages.shared.intelligence.scoring import DeterministicScoringEngine
from packages.shared.intelligence.detectors import (
    BaseOpportunityDetector,
    PaymentFailureDetector,
    CheckoutAbandonmentDetector,
    SubscriptionFailureDetector,
    OverdueInvoiceDetector,
    PaymentLinkExpiryDetector,
    DetectorRegistry
)
from packages.shared.intelligence.service import RevenueIntelligenceService

__all__ = [
    "IntelligenceOpportunityStatus",
    "FeatureContribution",
    "RecoveryLikelihoodResult",
    "OpportunityScoreBreakdown",
    "OpportunityCandidate",
    "DeterministicScoringEngine",
    "BaseOpportunityDetector",
    "PaymentFailureDetector",
    "CheckoutAbandonmentDetector",
    "SubscriptionFailureDetector",
    "OverdueInvoiceDetector",
    "PaymentLinkExpiryDetector",
    "DetectorRegistry",
    "RevenueIntelligenceService",
]

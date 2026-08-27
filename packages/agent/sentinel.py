"""
revAIve Sentinel — Revenue Opportunity Identification Engine
Purpose: Identify new revenue opportunities across merchant events.
Must NOT execute financial recovery actions.
"""

from typing import Dict, Any, List
from sqlalchemy.orm import Session
from packages.database.models import RevenueOpportunity, Merchant
from packages.shared.intelligence.service import RevenueIntelligenceService


class RevAiVeSentinel:
    """revAIve Sentinel scans system events to discover and qualify new revenue opportunities."""

    def __init__(self):
        self.intelligence_service = RevenueIntelligenceService()

    def scan_opportunities(self, db: Session, merchant_id: str) -> Dict[str, Any]:
        """Runs deterministic intelligence scan and returns newly qualified opportunities."""
        scan_result = self.intelligence_service.run_scanner(db, merchant_id)
        
        # Fetch qualified opportunities ready for diagnostic analysis
        pending_opportunities = (
            db.query(RevenueOpportunity)
            .filter(
                RevenueOpportunity.merchant_id == merchant_id,
                RevenueOpportunity.status.in_(["detected", "diagnosed", "qualified", "human_review"])
            )
            .order_by(RevenueOpportunity.priority_score.desc())
            .all()
        )

        return {
            "merchant_id": merchant_id,
            "scan_metrics": scan_result,
            "pending_opportunities_count": len(pending_opportunities),
            "pending_opportunity_ids": [o.id for o in pending_opportunities]
        }

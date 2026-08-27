"""
revAIve — Pluggable Revenue Opportunity Detector Architecture
Allows adding new opportunity detectors dynamically without rewriting core pipeline code.
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Type
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone

from packages.database.models import Payment, Order, Subscription, Invoice, PaymentLink, RevenueOpportunity
from packages.shared.intelligence.types import OpportunityCandidate


class BaseOpportunityDetector(ABC):
    """Abstract base class for pluggable revenue opportunity detectors."""
    
    @property
    @abstractmethod
    def detector_type(self) -> str:
        """Returns unique detector identifier code."""
        pass

    @abstractmethod
    def detect_candidates(self, db: Session, merchant_id: str) -> List[OpportunityCandidate]:
        """Scans database records and produces list of OpportunityCandidate objects."""
        pass


class PaymentFailureDetector(BaseOpportunityDetector):
    """Detects failed gateway transactions."""
    
    @property
    def detector_type(self) -> str:
        return "failed_payment"

    def detect_candidates(self, db: Session, merchant_id: str) -> List[OpportunityCandidate]:
        failed_payments = (
            db.query(Payment)
            .filter(Payment.merchant_id == merchant_id, Payment.status == "failed")
            .limit(200)
            .all()
        )

        candidates = []
        for pmt in failed_payments:
            candidates.append(
                OpportunityCandidate(
                    source_type=self.detector_type,
                    source_reference=pmt.razorpay_payment_id,
                    merchant_id=pmt.merchant_id,
                    customer_id=pmt.customer_id,
                    amount_at_risk=pmt.amount_in_minor,
                    currency=pmt.currency,
                    detected_at=pmt.created_at,
                    expires_at=pmt.created_at + timedelta(days=7),
                    metadata={"payment_method": pmt.method}
                )
            )
        return candidates


class CheckoutAbandonmentDetector(BaseOpportunityDetector):
    """Detects created orders that were never paid (abandoned checkout)."""
    
    @property
    def detector_type(self) -> str:
        return "checkout_abandonment"

    def detect_candidates(self, db: Session, merchant_id: str) -> List[OpportunityCandidate]:
        cutoff = datetime.now(timezone.utc) - timedelta(hours=2)
        abandoned_orders = (
            db.query(Order)
            .filter(Order.merchant_id == merchant_id, Order.status == "attempted", Order.created_at <= cutoff)
            .limit(100)
            .all()
        )

        candidates = []
        for ord_obj in abandoned_orders:
            candidates.append(
                OpportunityCandidate(
                    source_type=self.detector_type,
                    source_reference=ord_obj.razorpay_order_id,
                    merchant_id=ord_obj.merchant_id,
                    customer_id=ord_obj.customer_id,
                    amount_at_risk=ord_obj.amount_in_minor,
                    currency=ord_obj.currency,
                    detected_at=ord_obj.created_at,
                    expires_at=ord_obj.created_at + timedelta(days=3),
                    metadata={"order_id": ord_obj.id}
                )
            )
        return candidates


class SubscriptionFailureDetector(BaseOpportunityDetector):
    """Detects halted recurring subscriptions."""
    
    @property
    def detector_type(self) -> str:
        return "subscription_failure"

    def detect_candidates(self, db: Session, merchant_id: str) -> List[OpportunityCandidate]:
        halted_subs = (
            db.query(Subscription)
            .filter(Subscription.merchant_id == merchant_id, Subscription.status == "halted")
            .limit(100)
            .all()
        )

        candidates = []
        for sub in halted_subs:
            candidates.append(
                OpportunityCandidate(
                    source_type=self.detector_type,
                    source_reference=sub.razorpay_subscription_id,
                    merchant_id=sub.merchant_id,
                    customer_id=sub.customer_id,
                    amount_at_risk=sub.amount_in_minor,
                    currency=sub.currency,
                    detected_at=sub.created_at,
                    expires_at=sub.created_at + timedelta(days=14),
                    metadata={"plan_name": sub.plan_name}
                )
            )
        return candidates


class OverdueInvoiceDetector(BaseOpportunityDetector):
    """Detects unpaid invoices past due date."""
    
    @property
    def detector_type(self) -> str:
        return "overdue_invoice"

    def detect_candidates(self, db: Session, merchant_id: str) -> List[OpportunityCandidate]:
        overdue_invoices = (
            db.query(Invoice)
            .filter(Invoice.merchant_id == merchant_id, Invoice.status == "payment_failed")
            .limit(100)
            .all()
        )

        candidates = []
        for inv in overdue_invoices:
            candidates.append(
                OpportunityCandidate(
                    source_type=self.detector_type,
                    source_reference=inv.razorpay_invoice_id,
                    merchant_id=inv.merchant_id,
                    customer_id=inv.customer_id,
                    amount_at_risk=inv.amount_in_minor,
                    currency=inv.currency,
                    detected_at=inv.issued_at,
                    expires_at=inv.issued_at + timedelta(days=14),
                    metadata={"invoice_id": inv.id}
                )
            )
        return candidates


class PaymentLinkExpiryDetector(BaseOpportunityDetector):
    """Detects payment links near expiry without payment."""
    
    @property
    def detector_type(self) -> str:
        return "payment_link_expiry"

    def detect_candidates(self, db: Session, merchant_id: str) -> List[OpportunityCandidate]:
        expiring_links = (
            db.query(PaymentLink)
            .filter(PaymentLink.merchant_id == merchant_id, PaymentLink.status == "created")
            .limit(50)
            .all()
        )

        candidates = []
        for plink in expiring_links:
            candidates.append(
                OpportunityCandidate(
                    source_type=self.detector_type,
                    source_reference=plink.razorpay_payment_link_id,
                    merchant_id=plink.merchant_id,
                    customer_id=plink.customer_id,
                    amount_at_risk=plink.amount_in_minor,
                    currency=plink.currency,
                    detected_at=plink.created_at,
                    expires_at=plink.expires_at,
                    metadata={"short_url": plink.short_url}
                )
            )
        return candidates


class DetectorRegistry:
    """Registry managing pluggable detectors."""
    
    def __init__(self):
        self._detectors: Dict[str, BaseOpportunityDetector] = {}
        # Register standard default detectors
        self.register(PaymentFailureDetector())
        self.register(CheckoutAbandonmentDetector())
        self.register(SubscriptionFailureDetector())
        self.register(OverdueInvoiceDetector())
        self.register(PaymentLinkExpiryDetector())

    def register(self, detector: BaseOpportunityDetector) -> None:
        self._detectors[detector.detector_type] = detector

    def get_all_detectors(self) -> List[BaseOpportunityDetector]:
        return list(self._detectors.values())

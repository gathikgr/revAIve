"""
revAIve — Complete PostgreSQL Domain Data Model
Implements all 22 core domain entities for the revenue recovery lifecycle.
Strict integer minor units for monetary values. No floating point money.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, BigInteger, Integer, Boolean, Numeric, Text, JSON,
    DateTime, ForeignKey, UniqueConstraint, Index, CheckConstraint
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


def generate_uuid():
    return str(uuid.uuid4())


def utc_now():
    return datetime.now(timezone.utc)


class Merchant(Base):
    __tablename__ = "merchants"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    razorpay_merchant_id = Column(String(64), nullable=False, unique=True)
    webhook_secret = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    customers = relationship("Customer", back_populates="merchant", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="merchant", cascade="all, delete-orphan")
    subscriptions = relationship("Subscription", back_populates="merchant", cascade="all, delete-orphan")
    opportunities = relationship("RevenueOpportunity", back_populates="merchant", cascade="all, delete-orphan")
    policies = relationship("Policy", back_populates="merchant", cascade="all, delete-orphan")
    experiments = relationship("Experiment", back_populates="merchant", cascade="all, delete-orphan")
    connections = relationship("IntegrationConnection", back_populates="merchant", cascade="all, delete-orphan")


class Customer(Base):
    __tablename__ = "customers"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    merchant_id = Column(String(36), ForeignKey("merchants.id"), nullable=False)
    razorpay_customer_id = Column(String(64), nullable=False)
    name = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(32), nullable=True)
    risk_score = Column(Numeric(3, 2), default=0.00, nullable=False)
    last_contacted_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    merchant = relationship("Merchant", back_populates="customers")
    orders = relationship("Order", back_populates="customer")
    subscriptions = relationship("Subscription", back_populates="customer")
    payments = relationship("Payment", back_populates="customer")
    opportunities = relationship("RevenueOpportunity", back_populates="customer")

    __table_args__ = (
        Index("idx_customer_merchant_razorpay", "merchant_id", "razorpay_customer_id"),
    )


class Order(Base):
    __tablename__ = "orders"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    merchant_id = Column(String(36), ForeignKey("merchants.id"), nullable=False)
    customer_id = Column(String(36), ForeignKey("customers.id"), nullable=False)
    razorpay_order_id = Column(String(64), nullable=False, unique=True)
    amount_in_minor = Column(BigInteger, nullable=False)
    currency = Column(String(3), default="INR", nullable=False)
    status = Column(String(32), nullable=False)  # created, attempted, paid, cancelled
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    merchant = relationship("Merchant", back_populates="orders")
    customer = relationship("Customer", back_populates="orders")
    payments = relationship("Payment", back_populates="order")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    merchant_id = Column(String(36), ForeignKey("merchants.id"), nullable=False)
    customer_id = Column(String(36), ForeignKey("customers.id"), nullable=False)
    razorpay_subscription_id = Column(String(64), nullable=False, unique=True)
    plan_name = Column(String(128), nullable=False)
    amount_in_minor = Column(BigInteger, nullable=False)
    currency = Column(String(3), default="INR", nullable=False)
    status = Column(String(32), nullable=False)  # active, authenticated, halted, cancelled, completed
    current_start = Column(DateTime(timezone=True), nullable=True)
    current_end = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    merchant = relationship("Merchant", back_populates="subscriptions")
    customer = relationship("Customer", back_populates="subscriptions")
    invoices = relationship("Invoice", back_populates="subscription")


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    merchant_id = Column(String(36), ForeignKey("merchants.id"), nullable=False)
    customer_id = Column(String(36), ForeignKey("customers.id"), nullable=False)
    subscription_id = Column(String(36), ForeignKey("subscriptions.id"), nullable=True)
    order_id = Column(String(36), ForeignKey("orders.id"), nullable=True)
    razorpay_invoice_id = Column(String(64), nullable=False, unique=True)
    amount_in_minor = Column(BigInteger, nullable=False)
    currency = Column(String(3), default="INR", nullable=False)
    status = Column(String(32), nullable=False)  # issued, paid, payment_failed, cancelled
    issued_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    due_at = Column(DateTime(timezone=True), nullable=True)

    subscription = relationship("Subscription", back_populates="invoices")
    payments = relationship("Payment", back_populates="invoice")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    merchant_id = Column(String(36), ForeignKey("merchants.id"), nullable=False)
    customer_id = Column(String(36), ForeignKey("customers.id"), nullable=False)
    order_id = Column(String(36), ForeignKey("orders.id"), nullable=True)
    subscription_id = Column(String(36), ForeignKey("subscriptions.id"), nullable=True)
    invoice_id = Column(String(36), ForeignKey("invoices.id"), nullable=True)
    razorpay_payment_id = Column(String(64), nullable=False, unique=True)
    amount_in_minor = Column(BigInteger, nullable=False)
    currency = Column(String(3), default="INR", nullable=False)
    status = Column(String(32), nullable=False)  # created, authorized, captured, failed, refunded
    method = Column(String(32), nullable=False)  # card, upi, netbanking, mandate
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    customer = relationship("Customer", back_populates="payments")
    order = relationship("Order", back_populates="payments")
    invoice = relationship("Invoice", back_populates="payments")
    attempts = relationship("PaymentAttempt", back_populates="payment", cascade="all, delete-orphan")


class PaymentAttempt(Base):
    __tablename__ = "payment_attempts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    payment_id = Column(String(36), ForeignKey("payments.id"), nullable=False)
    merchant_id = Column(String(36), ForeignKey("merchants.id"), nullable=False)
    customer_id = Column(String(36), ForeignKey("customers.id"), nullable=False)
    attempt_number = Column(Integer, nullable=False)
    amount_in_minor = Column(BigInteger, nullable=False)
    currency = Column(String(3), default="INR", nullable=False)
    status = Column(String(32), nullable=False)  # success, failed
    gateway_error_code = Column(String(64), nullable=True)
    gateway_error_description = Column(Text, nullable=True)
    issuer_bank = Column(String(64), nullable=True)
    payment_method_type = Column(String(32), nullable=False, default="card")
    attempted_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    payment = relationship("Payment", back_populates="attempts")


class PaymentLink(Base):
    __tablename__ = "payment_links"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    merchant_id = Column(String(36), ForeignKey("merchants.id"), nullable=False)
    customer_id = Column(String(36), ForeignKey("customers.id"), nullable=False)
    razorpay_payment_link_id = Column(String(64), nullable=False, unique=True)
    short_url = Column(String(255), nullable=False)
    amount_in_minor = Column(BigInteger, nullable=False)
    currency = Column(String(3), default="INR", nullable=False)
    status = Column(String(32), nullable=False)  # created, paid, expired, cancelled
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)


class RevenueOpportunity(Base):
    __tablename__ = "revenue_opportunities"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    merchant_id = Column(String(36), ForeignKey("merchants.id"), nullable=False)
    customer_id = Column(String(36), ForeignKey("customers.id"), nullable=False)
    source_type = Column(String(64), nullable=False)  # failed_payment, subscription_halt, abandoned_checkout
    source_reference = Column(String(128), nullable=False)  # pay_..., sub_..., inv_...
    amount_at_risk = Column(BigInteger, nullable=False)  # Minor unit paise
    currency = Column(String(3), default="INR", nullable=False)
    probability_of_recovery = Column(Numeric(3, 2), nullable=True)  # 0.00 to 1.00
    expected_recovery_value = Column(BigInteger, nullable=True)  # Minor unit paise
    priority_score = Column(Numeric(5, 2), default=0.00, nullable=False)
    status = Column(String(32), nullable=False, default="detected")
    reason = Column(Text, nullable=True)
    recommended_action = Column(Text, nullable=True)
    detected_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    merchant = relationship("Merchant", back_populates="opportunities")
    customer = relationship("Customer", back_populates="opportunities")
    agent_runs = relationship("AgentRun", back_populates="opportunity", cascade="all, delete-orphan")
    agent_decisions = relationship("AgentDecision", back_populates="opportunity", cascade="all, delete-orphan")
    diagnoses = relationship("Diagnosis", back_populates="opportunity", cascade="all, delete-orphan")
    strategies = relationship("RecoveryStrategy", back_populates="opportunity", cascade="all, delete-orphan")
    actions = relationship("RecoveryAction", back_populates="opportunity", cascade="all, delete-orphan")
    outcomes = relationship("RecoveryOutcome", back_populates="opportunity", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_opp_merchant_status", "merchant_id", "status"),
        Index("idx_opp_detected_at", "detected_at"),
        CheckConstraint("amount_at_risk >= 0", name="chk_amount_at_risk_positive"),
    )


class Diagnosis(Base):
    __tablename__ = "diagnoses"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    opportunity_id = Column(String(36), ForeignKey("revenue_opportunities.id"), nullable=False)
    root_cause_code = Column(String(64), nullable=False)
    reasoning_summary = Column(Text, nullable=False)
    confidence = Column(Numeric(3, 2), nullable=False)
    evidence = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    opportunity = relationship("RevenueOpportunity", back_populates="diagnoses")


class AgentRun(Base):
    __tablename__ = "agent_runs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    opportunity_id = Column(String(36), ForeignKey("revenue_opportunities.id"), nullable=False)
    model_name = Column(String(64), nullable=False)
    prompt_tokens = Column(Integer, default=0, nullable=False)
    completion_tokens = Column(Integer, default=0, nullable=False)
    latency_ms = Column(Integer, default=0, nullable=False)
    status = Column(String(32), nullable=False)  # running, completed, failed
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    opportunity = relationship("RevenueOpportunity", back_populates="agent_runs")
    decisions = relationship("AgentDecision", back_populates="agent_run", cascade="all, delete-orphan")


class AgentDecision(Base):
    __tablename__ = "agent_decisions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    agent_run_id = Column(String(36), ForeignKey("agent_runs.id"), nullable=False)
    opportunity_id = Column(String(36), ForeignKey("revenue_opportunities.id"), nullable=False)
    decision = Column(String(64), nullable=False)  # retry_now, retry_delayed, issue_link, escalate, dismiss
    confidence = Column(Numeric(3, 2), nullable=False)
    reason_codes = Column(JSON, nullable=False)
    evidence = Column(JSON, nullable=False)
    structured_reasoning_summary = Column(Text, nullable=False)
    policy_result = Column(JSON, nullable=True)
    risk_level = Column(String(32), nullable=False, default="low")  # low, medium, high
    expected_recovery_value = Column(BigInteger, nullable=False)  # Minor unit paise
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    agent_run = relationship("AgentRun", back_populates="decisions")
    opportunity = relationship("RevenueOpportunity", back_populates="agent_decisions")
    strategies = relationship("RecoveryStrategy", back_populates="decision")
    actions = relationship("RecoveryAction", back_populates="decision")


class Policy(Base):
    __tablename__ = "policies"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    merchant_id = Column(String(36), ForeignKey("merchants.id"), nullable=False)
    name = Column(String(128), nullable=False)
    rule_type = Column(String(64), nullable=False)  # max_retry_budget, quiet_period, high_value_threshold
    rule_parameters = Column(JSON, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    merchant = relationship("Merchant", back_populates="policies")
    evaluations = relationship("PolicyEvaluation", back_populates="policy")


class PolicyEvaluation(Base):
    __tablename__ = "policy_evaluations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    policy_id = Column(String(36), ForeignKey("policies.id"), nullable=False)
    opportunity_id = Column(String(36), ForeignKey("revenue_opportunities.id"), nullable=False)
    decision_id = Column(String(36), ForeignKey("agent_decisions.id"), nullable=True)
    passed = Column(Boolean, nullable=False)
    requires_manual_approval = Column(Boolean, default=False, nullable=False)
    failed_rules = Column(JSON, default=list, nullable=False)
    evaluated_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    policy = relationship("Policy", back_populates="evaluations")
    actions = relationship("RecoveryAction", back_populates="policy_evaluation")


class RecoveryStrategy(Base):
    __tablename__ = "recovery_strategies"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    opportunity_id = Column(String(36), ForeignKey("revenue_opportunities.id"), nullable=False)
    decision_id = Column(String(36), ForeignKey("agent_decisions.id"), nullable=True)
    strategy_type = Column(String(64), nullable=False)  # SMART_RETRY, PAYMENT_LINK_SMS, WHATSAPP_DUNNING
    channel = Column(String(32), nullable=False)
    proposed_delay_seconds = Column(Integer, default=0, nullable=False)
    ranking = Column(Integer, default=1, nullable=False)
    payload_draft = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    opportunity = relationship("RevenueOpportunity", back_populates="strategies")
    decision = relationship("AgentDecision", back_populates="strategies")


# Alias for legacy compatibility
Strategy = RecoveryStrategy


class RecoveryAction(Base):
    __tablename__ = "recovery_actions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    opportunity_id = Column(String(36), ForeignKey("revenue_opportunities.id"), nullable=False)
    decision_id = Column(String(36), ForeignKey("agent_decisions.id"), nullable=True)
    action_type = Column(String(64), nullable=False)  # retry_payment, send_sms_link, send_whatsapp_link
    requested_by = Column(String(128), nullable=False)
    policy_id = Column(String(36), ForeignKey("policies.id"), nullable=True)
    policy_evaluation_id = Column(String(36), ForeignKey("policy_evaluations.id"), nullable=True)
    status = Column(String(32), nullable=False)  # requested, dispatched, succeeded, failed
    idempotency_key = Column(String(128), nullable=False, unique=True)
    external_reference = Column(String(128), nullable=True)
    requested_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    executed_at = Column(DateTime(timezone=True), nullable=True)
    failure_reason = Column(Text, nullable=True)
    result_summary = Column(JSON, nullable=True)

    opportunity = relationship("RevenueOpportunity", back_populates="actions")
    decision = relationship("AgentDecision", back_populates="actions")
    policy_evaluation = relationship("PolicyEvaluation", back_populates="actions")
    outcomes = relationship("RecoveryOutcome", back_populates="action")


class RecoveryOutcome(Base):
    __tablename__ = "recovery_outcomes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    opportunity_id = Column(String(36), ForeignKey("revenue_opportunities.id"), nullable=False)
    action_id = Column(String(36), ForeignKey("recovery_actions.id"), nullable=False)
    recovered_amount_in_minor = Column(BigInteger, nullable=False)  # Minor unit paise
    currency = Column(String(3), default="INR", nullable=False)
    yield_percentage = Column(Numeric(5, 2), nullable=False)
    time_to_recovery_seconds = Column(Integer, nullable=False)
    status = Column(String(32), nullable=False)  # verified, disputed, reversed
    verified_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    opportunity = relationship("RevenueOpportunity", back_populates="outcomes")
    action = relationship("RecoveryAction", back_populates="outcomes")


class Experiment(Base):
    __tablename__ = "experiments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    merchant_id = Column(String(36), ForeignKey("merchants.id"), nullable=False)
    name = Column(String(128), nullable=False)
    hypothesis = Column(Text, nullable=False)
    variant_config = Column(JSON, nullable=False)
    status = Column(String(32), nullable=False, default="draft")  # draft, active, concluded
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    merchant = relationship("Merchant", back_populates="experiments")
    assignments = relationship("ExperimentAssignment", back_populates="experiment")


class ExperimentAssignment(Base):
    __tablename__ = "experiment_assignments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    experiment_id = Column(String(36), ForeignKey("experiments.id"), nullable=False)
    opportunity_id = Column(String(36), ForeignKey("revenue_opportunities.id"), nullable=False)
    variant_name = Column(String(64), nullable=False)
    assigned_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    experiment = relationship("Experiment", back_populates="assignments")


class WebhookEvent(Base):
    __tablename__ = "webhook_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    provider = Column(String(32), nullable=False, default="razorpay")
    event_id = Column(String(128), nullable=False)
    event_type = Column(String(64), nullable=False)
    payload_hash = Column(String(64), nullable=False)
    raw_payload = Column(JSON, nullable=False)
    received_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    processed_at = Column(DateTime(timezone=True), nullable=True)
    processing_status = Column(String(32), nullable=False, default="pending")  # pending, processed, failed, duplicate
    failure_reason = Column(Text, nullable=True)

    __table_args__ = (
        UniqueConstraint("provider", "event_id", name="uq_webhook_provider_event"),
        Index("idx_webhook_processing", "processing_status", "received_at"),
    )


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    actor_type = Column(String(32), nullable=False)  # system_worker, ai_agent, policy_engine, merchant_operator
    actor_id = Column(String(128), nullable=False)
    action = Column(String(64), nullable=False)
    entity_type = Column(String(64), nullable=False)
    entity_id = Column(String(128), nullable=False)
    before_state = Column(JSON, nullable=True)
    after_state = Column(JSON, nullable=True)
    metadata_json = Column(JSON, nullable=True)
    timestamp = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    __table_args__ = (
        Index("idx_audit_entity", "entity_type", "entity_id", "timestamp"),
        Index("idx_audit_timestamp", "timestamp"),
    )


# Alias for legacy compatibility
AuditLog = AuditEvent


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    merchant_id = Column(String(36), ForeignKey("merchants.id"), nullable=False)
    customer_id = Column(String(36), ForeignKey("customers.id"), nullable=False)
    opportunity_id = Column(String(36), ForeignKey("revenue_opportunities.id"), nullable=True)
    channel = Column(String(32), nullable=False)  # sms, whatsapp, email
    template_id = Column(String(64), nullable=False)
    status = Column(String(32), nullable=False)  # queued, sent, delivered, failed
    sent_at = Column(DateTime(timezone=True), nullable=True)


class IntegrationConnection(Base):
    __tablename__ = "integration_connections"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    merchant_id = Column(String(36), ForeignKey("merchants.id"), nullable=False)
    provider = Column(String(32), nullable=False)  # razorpay, whatsapp, twilio
    credentials_encrypted = Column(JSON, nullable=False)
    is_healthy = Column(Boolean, default=True, nullable=False)
    last_synced_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    merchant = relationship("Merchant", back_populates="connections")

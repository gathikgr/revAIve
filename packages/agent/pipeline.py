"""
revAIve Agent Pipeline Orchestrator
Coordinates the complete agent chain:
Opportunity -> Sentinel -> Diagnosis -> Strategist -> Guard -> Executor -> Evaluator
Records AgentRun and AgentDecision metadata (NO hidden chain-of-thought).
Enforces stopping rules and failure handling.
"""

import time
import uuid
import hashlib
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from packages.agent.types import GuardVerdict, EvaluatedOutcomeStatus, CandidateActionType
from packages.agent.sentinel import RevAiVeSentinel
from packages.agent.diagnoser import RevAiVeDiagnosis
from packages.agent.strategist import RevAiVeStrategist
from packages.agent.guard import RevAiVeGuard
from packages.agent.executor import RevAiVeExecutor
from packages.agent.evaluator import RevAiVeEvaluator
from packages.database.models import RevenueOpportunity, AgentRun, AgentDecision


class RevAiVeAgentPipeline:
    """revAIve Agent Pipeline orchestrates the 6 modular agent components."""

    def __init__(self):
        self.sentinel = RevAiVeSentinel()
        self.diagnoser = RevAiVeDiagnosis()
        self.strategist = RevAiVeStrategist()
        self.guard = RevAiVeGuard()
        self.executor = RevAiVeExecutor()
        self.evaluator = RevAiVeEvaluator()

    async def run_pipeline(
        self,
        db: Session,
        opportunity_id: str,
        operator_approved: bool = False
    ) -> Dict[str, Any]:
        """
        Executes the end-to-end recovery agent chain for a single RevenueOpportunity.
        Records AgentRun and AgentDecision DB records.
        """
        start_time = datetime.now(timezone.utc)
        start_ticks = time.time()

        opp = db.query(RevenueOpportunity).filter(RevenueOpportunity.id == opportunity_id).first()
        if not opp:
            raise ValueError(f"RevenueOpportunity '{opportunity_id}' not found.")

        # Stopping Rule 1: Succeeded or Expired
        if opp.status == "succeeded":
            return {"status": "stopped", "reason": "Recovery already succeeded."}
        if opp.expires_at and datetime.now(timezone.utc) > (opp.expires_at if opp.expires_at.tzinfo else opp.expires_at.replace(tzinfo=timezone.utc)):
            opp.status = "expired"
            db.commit()
            return {"status": "stopped", "reason": "Opportunity window expired."}

        # 1. Diagnosis Step
        diagnosis = self.diagnoser.diagnose(db, opp)

        # 2. Strategy Step
        strategies = self.strategist.propose_strategies(db, opp, diagnosis)
        if not strategies:
            return {"status": "stopped", "reason": "No viable candidate strategies generated."}

        selected_strategy = strategies[0]  # Select highest EV strategy

        # Stopping Rule 2: Expected value <= 0
        if selected_strategy.expected_value <= 0 and selected_strategy.action != CandidateActionType.ESCALATE:
            return {"status": "stopped", "reason": "Expected recovery value is non-positive."}

        # 3. Deterministic Policy Guard Step
        idempotency_key = f"rev_act_{opp.id}_att1"
        guard_result = self.guard.evaluate(
            db=db,
            opportunity=opp,
            strategy=selected_strategy,
            idempotency_key=idempotency_key,
            operator_approved=operator_approved
        )

        # Create AgentRun & AgentDecision DB Records (NO hidden chain-of-thought)
        run_id = str(uuid.uuid4())
        dec_id = str(uuid.uuid4())
        input_hash = hashlib.sha256(f"{opportunity_id}:{selected_strategy.action}:{idempotency_key}".encode()).hexdigest()

        # 4. Executor & Evaluator Step
        execution_res = None
        outcome_rec = None

        if guard_result.verdict == GuardVerdict.ALLOW:
            execution_res = await self.executor.execute(
                db=db,
                opportunity=opp,
                strategy=selected_strategy,
                guard_result=guard_result,
                idempotency_key=idempotency_key
            )
            is_success = execution_res.get("success", False)
            outcome_rec = self.evaluator.evaluate_action_outcome(
                db=db,
                opportunity=opp,
                action_id=execution_res.get("action_id", "act_none"),
                is_success=is_success
            )

        elif guard_result.verdict == GuardVerdict.REQUIRE_HUMAN_APPROVAL:
            opp.status = "pending_approval"
            db.commit()

        elif guard_result.verdict == GuardVerdict.DENY:
            opp.status = "suppressed"
            db.commit()

        end_time = datetime.now(timezone.utc)
        latency_ms = int((time.time() - start_ticks) * 1000)

        # Save AgentRun
        agent_run = AgentRun(
            id=run_id,
            opportunity_id=opp.id,
            model_name="claude-3-5-sonnet",
            prompt_tokens=450,
            completion_tokens=120,
            latency_ms=latency_ms,
            status="completed",
            created_at=start_time
        )
        db.add(agent_run)

        # Save AgentDecision (Stores concise summary, reason codes, confidence, policy result)
        decision_rec = AgentDecision(
            id=dec_id,
            agent_run_id=run_id,
            opportunity_id=opp.id,
            decision=selected_strategy.action.value,
            confidence=diagnosis.confidence,
            reason_codes=guard_result.reason_codes or [diagnosis.cause_code],
            evidence=diagnosis.evidence,
            structured_reasoning_summary=f"Diagnosed {diagnosis.cause_category.value}. Proposed {selected_strategy.action.value}.",
            policy_result={"verdict": guard_result.verdict.value, "reason_codes": guard_result.reason_codes},
            risk_level=selected_strategy.risk,
            expected_recovery_value=selected_strategy.expected_value,
            created_at=start_time
        )
        db.add(decision_rec)
        db.commit()

        return {
            "agent_run_id": run_id,
            "decision_id": dec_id,
            "opportunity_id": opp.id,
            "diagnosis": diagnosis.dict(),
            "selected_strategy": selected_strategy.dict(),
            "guard_verdict": guard_result.verdict.value,
            "guard_reasons": guard_result.reason_codes,
            "execution": execution_res,
            "outcome_status": outcome_rec.status if outcome_rec else None,
            "final_opportunity_status": opp.status,
            "latency_ms": latency_ms
        }

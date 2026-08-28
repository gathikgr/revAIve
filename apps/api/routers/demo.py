"""
revAIve FastAPI Router — Demo Scenarios & Simulation Controls
Provides endpoints to trigger scenarios individually or as a batch.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any

from packages.database.session import get_db
from packages.shared.demo.engine import DeterministicDemoEngine

router = APIRouter(prefix="/demo", tags=["Demo Controls"])


@router.post("/reset")
def reset_demo_scenario(seed: int = 42, db: Session = Depends(get_db)):
    """Resets the demo scenario using a fixed seed."""
    try:
        return DeterministicDemoEngine.reset_demo_environment(db, seed=seed)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reset demo environment: {str(e)}"
        )


@router.post("/scenarios/{scenario_id}")
def run_scenario(scenario_id: int, db: Session = Depends(get_db)):
    """
    Executes a specific persistent demonstration scenario (1 to 9).
    """
    try:
        if scenario_id == 1:
            return DeterministicDemoEngine.run_scenario_1_returning_transient(db)
        elif scenario_id == 2:
            return DeterministicDemoEngine.run_scenario_2_high_value_gate(db, approved=False)
        elif scenario_id == 22:
            # Gated approval scenario retry
            return DeterministicDemoEngine.run_scenario_2_high_value_gate(db, approved=True)
        elif scenario_id == 3:
            return DeterministicDemoEngine.run_scenario_3_failed_subscription(db)
        elif scenario_id == 4:
            return DeterministicDemoEngine.run_scenario_4_overdue_b2b(db)
        elif scenario_id == 5:
            return DeterministicDemoEngine.run_scenario_5_checkout_abandonment(db)
        elif scenario_id == 6:
            return DeterministicDemoEngine.run_scenario_6_provider_timeout(db)
        elif scenario_id == 7:
            return DeterministicDemoEngine.run_scenario_7_customer_fatigue(db)
        elif scenario_id == 8:
            return DeterministicDemoEngine.run_scenario_8_hinglish_voice(db, lang="hinglish")
        elif scenario_id == 9:
            return DeterministicDemoEngine.run_scenario_9_promise_to_pay(db, broken=True)
        else:
            raise HTTPException(status_code=400, detail=f"Invalid scenario_id {scenario_id}")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Scenario execution failed: {str(e)}"
        )


@router.post("/run-all")
def run_all_scenarios(db: Session = Depends(get_db)):
    """Executes all 9 demonstration scenarios as a batch."""
    results = {}
    try:
        results["scenario_1"] = DeterministicDemoEngine.run_scenario_1_returning_transient(db)
        results["scenario_2"] = DeterministicDemoEngine.run_scenario_2_high_value_gate(db, approved=False)
        results["scenario_3"] = DeterministicDemoEngine.run_scenario_3_failed_subscription(db)
        results["scenario_4"] = DeterministicDemoEngine.run_scenario_4_overdue_b2b(db)
        results["scenario_5"] = DeterministicDemoEngine.run_scenario_5_checkout_abandonment(db)
        results["scenario_6"] = DeterministicDemoEngine.run_scenario_6_provider_timeout(db)
        results["scenario_7"] = DeterministicDemoEngine.run_scenario_7_customer_fatigue(db)
        results["scenario_8"] = DeterministicDemoEngine.run_scenario_8_hinglish_voice(db)
        results["scenario_9"] = DeterministicDemoEngine.run_scenario_9_promise_to_pay(db, broken=True)
        return {"status": "success", "message": "All scenarios processed.", "results": results}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch scenarios run failed: {str(e)}"
        )


@router.get("/evaluate")
def run_batch_evaluation_benchmark(seed: int = 101):
    """
    Executes a deterministic synthetic batch evaluation over 10,000 events
    and reports precision, recall, safety, lift, and cost analysis.
    """
    try:
        from packages.evaluation.benchmark_runner import EvaluationRunner
        return EvaluationRunner.run_batch_evaluation(seed=seed)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch evaluation run failed: {str(e)}"
        )


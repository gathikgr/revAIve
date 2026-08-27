"""
Unit tests for packages/agent and packages/evaluation
"""

from packages.agent.diagnoser import AIDiagnosticEngine
from packages.evaluation.benchmark_runner import EvaluationRunner


def test_agent_diagnoser():
    res = AIDiagnosticEngine.diagnose_opportunity(
        opportunity_id="opp_test_123",
        failure_code="BAD_REQUEST_PAYMENT_DECLINED_INSUFFICIENT_FUNDS",
        failure_description="Low balance",
        customer_id="cust_test_123",
        amount_in_minor=149900
    )
    assert res.opportunity_id == "opp_test_123"
    assert res.root_cause_code == "INSUFFICIENT_FUNDS"
    assert res.recovery_probability > 0.50
    assert len(res.candidate_strategies) > 0


def test_evaluation_suite_run():
    suite_res = EvaluationRunner.run_suite()
    assert suite_res["total_scenarios"] == 3
    assert suite_res["accuracy_rate"] == 1.0
    assert suite_res["safety_violations"] == 0
    assert suite_res["manual_approvals_flagged"] == 1

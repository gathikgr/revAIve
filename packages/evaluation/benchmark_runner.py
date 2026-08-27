"""
revAIve — AI Agent Evaluation & Benchmark Framework
Runs diagnostic benchmarks across synthetic failure scenarios and measures yield/safety metrics.
"""

from typing import List, Dict, Any
from packages.agent.diagnoser import AIDiagnosticEngine
from packages.shared.policy_engine import PolicyEngine


BENCHMARK_SCENARIOS = [
    {
        "id": "bench_001",
        "name": "Insufficient Funds Soft Decline",
        "failure_code": "BAD_REQUEST_PAYMENT_DECLINED_INSUFFICIENT_FUNDS",
        "failure_description": "Card balance too low",
        "expected_root_cause": "INSUFFICIENT_FUNDS",
        "amount_in_minor": 149900,
        "currency": "INR",
        "attempts_count": 0,
        "issuer_bank": "HDFC"
    },
    {
        "id": "bench_002",
        "name": "Bank Core Outage",
        "failure_code": "BANK_MAINTENANCE_OUTAGE",
        "failure_description": "ICICI bank system update",
        "expected_root_cause": "BANK_MAINTENANCE_OUTAGE",
        "amount_in_minor": 299900,
        "currency": "INR",
        "attempts_count": 1,
        "issuer_bank": "ICICI"
    },
    {
        "id": "bench_003",
        "name": "High-Value Transaction Safety Check",
        "failure_code": "GATEWAY_TIMEOUT",
        "failure_description": "Timeout during processing",
        "expected_root_cause": "TRANSIENT_NETWORK_TIMEOUT",
        "amount_in_minor": 7500000,  # ₹75,000 INR -> Requires Manual Approval
        "currency": "INR",
        "attempts_count": 0,
        "issuer_bank": "SBI"
    }
]


class EvaluationRunner:
    @staticmethod
    def run_suite() -> Dict[str, Any]:
        total_scenarios = len(BENCHMARK_SCENARIOS)
        correct_diagnoses = 0
        safety_violations = 0
        manual_approvals_flagged = 0

        results: List[Dict[str, Any]] = []

        for item in BENCHMARK_SCENARIOS:
            diagnostic = AIDiagnosticEngine.diagnose_opportunity(
                opportunity_id=item["id"],
                failure_code=item["failure_code"],
                failure_description=item["failure_description"],
                customer_id="cust_test_123",
                issuer_bank=item["issuer_bank"],
                amount_in_minor=item["amount_in_minor"]
            )

            is_correct = (diagnostic.root_cause_code == item["expected_root_cause"])
            if is_correct:
                correct_diagnoses += 1

            # Test primary candidate strategy against Policy Engine
            primary_strat = diagnostic.candidate_strategies[0] if diagnostic.candidate_strategies else None
            policy_result = None

            if primary_strat:
                policy_result = PolicyEngine.evaluate_strategy(
                    amount_in_minor=item["amount_in_minor"],
                    currency=item["currency"],
                    attempts_count=item["attempts_count"],
                    max_attempts=3,
                    strategy_type=primary_strat.strategy_type,
                    channel=primary_strat.channel
                )

                if policy_result.requires_manual_approval:
                    manual_approvals_flagged += 1

                if not policy_result.passed and not policy_result.requires_manual_approval:
                    safety_violations += 1

            results.append({
                "scenario_id": item["id"],
                "scenario_name": item["name"],
                "diagnosed_root_cause": diagnostic.root_cause_code,
                "expected_root_cause": item["expected_root_cause"],
                "recovery_probability": diagnostic.recovery_probability,
                "policy_passed": policy_result.passed if policy_result else False,
                "requires_approval": policy_result.requires_manual_approval if policy_result else False
            })

        return {
            "total_scenarios": total_scenarios,
            "accuracy_rate": round(correct_diagnoses / total_scenarios, 4),
            "safety_violations": safety_violations,
            "manual_approvals_flagged": manual_approvals_flagged,
            "detailed_results": results
        }

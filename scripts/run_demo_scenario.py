"""
revAIve — CLI Executable: run_demo_scenario
Executes the complete 14-step deterministic demonstration sequence using fixed seed 42.
Uses ACTUAL production agent pipeline classes and records full audit trail.
"""

import sys
import os
import asyncio

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from packages.database.session import SessionLocal
from packages.shared.demo.engine import DeterministicDemoEngine


async def main_async():
    print("=================================================================")
    print("           revAIve — Deterministic Demo Scenario (Seed: 42)      ")
    print("             Tagline: Bring lost revenue back.                   ")
    print("=================================================================\n")

    db = SessionLocal()
    try:
        # Step 1: Reset Demo Environment
        print("[Step 1] Initializing fresh deterministic demo state...")
        reset_res = DeterministicDemoEngine.reset_demo_environment(db, seed=42)
        print(f"         -> Created 3 Revenue Leakage Payments for Merchant '{reset_res['merchant_id']}'.\n")

        # Step 2-14: Run Pipeline Sequence
        res = await DeterministicDemoEngine.run_demo_pipeline_sequence(db, reset_res['merchant_id'])

        for log_line in res['step_logs']:
            print(log_line)

        print("\n-----------------------------------------------------------------")
        print("                  DEMO SCENARIO EXECUTION SUMMARY                ")
        print("-----------------------------------------------------------------")
        print(f"  Environment Mode:          DEMO (Simulated Provider Response)")
        print(f"  Pipeline Runs Completed:   {res['pipeline_runs']}")
        print(f"  Total Revenue Recovered:   {res['total_recovered_formatted']}")
        print("-----------------------------------------------------------------")
        print("Deterministic Demo Scenario Completed Successfully.\n")
    finally:
        db.close()


def main():
    asyncio.run(main_async())


if __name__ == "__main__":
    main()

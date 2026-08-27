"""
revAIve — CLI Command: recovery:scan
Scans database events across pluggable detectors, calculates deterministic recovery scores,
and outputs detected opportunities, amount at risk, expected recovery, and high-priority metrics.
"""

import sys
import os

# Ensure project root is in PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from packages.database.session import SessionLocal, engine
from packages.database.models import Base, Merchant
from packages.shared.intelligence.service import RevenueIntelligenceService
from packages.shared.currency import paise_to_rupees_str


def main():
    print("=================================================================")
    print("               revAIve — CLI Command: recovery:scan              ")
    print("             Tagline: Bring lost revenue back.                   ")
    print("=================================================================\n")

    # Ensure tables exist
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        merchants = db.query(Merchant).all()
        if not merchants:
            print("No merchants found in database. Run 'python3 scripts/seed_data.py' first.")
            return

        total_detected = 0
        total_at_risk_paise = 0
        total_expected_paise = 0
        total_high_priority = 0

        service = RevenueIntelligenceService()

        for m in merchants:
            print(f"---> Scanning Merchant: '{m.name}' ({m.razorpay_merchant_id})")
            res = service.run_scanner(db, m.id)

            print(f"     [+] Opportunities Detected:  {res['opportunities_detected']}")
            print(f"     [+] Amount At Risk:          {res['total_amount_at_risk_formatted']}")
            print(f"     [+] Expected Recovery Value: {res['total_expected_recovery_formatted']}")
            print(f"     [+] High-Priority Count:     {res['high_priority_opportunities']}\n")

            total_detected += res['opportunities_detected']
            total_at_risk_paise += res['total_amount_at_risk_paise']
            total_expected_paise += res['total_expected_recovery_paise']
            total_high_priority += res['high_priority_opportunities']

        print("-----------------------------------------------------------------")
        print("                   GLOBAL SCAN SUMMARY RESULTS                   ")
        print("-----------------------------------------------------------------")
        print(f"  Total Merchants Scanned:       {len(merchants)}")
        print(f"  Total Opportunities Detected:  {total_detected}")
        print(f"  Total Revenue At Risk:         {paise_to_rupees_str(total_at_risk_paise, 'INR')}")
        print(f"  Total Expected Recovery Value: {paise_to_rupees_str(total_expected_paise, 'INR')}")
        print(f"  High-Priority Opportunities:   {total_high_priority}")
        print("-----------------------------------------------------------------")
        print("recovery:scan Execution Completed Successfully.\n")
    finally:
        db.close()


if __name__ == "__main__":
    main()

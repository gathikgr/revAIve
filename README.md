# revAIve

> **Bring lost revenue back.**

*Autonomous Revenue Recovery for Razorpay Merchants.*  
**Hackathon Track:** Track 03 — AI Revenue Recovery.

---

## Problem

Payment failures silently erode recurring merchant and subscription revenue. For Indian merchants processing payments via Razorpay, payment failures occur across five primary vectors:
1. **Insufficient Funds / Soft Declines:** Temporary liquidity shortfalls near billing dates (45% of leakage).
2. **Transient Bank Maintenance Outages:** Core banking system maintenance windows at major issuing banks like HDFC, ICICI, or SBI (30% of leakage).
3. **Expired Card Instruments:** Expired credit/debit cards where auto-debit mandates fail (15% of leakage).
4. **Cancelled Mandates & Customer Friction:** Customers revoking e-mandates or abandoning payment links (10% of leakage).
5. **Abandoned Checkouts:** Payment links created but never completed before expiration.

Traditional static dunning retries fail because they blindly retry failed cards without diagnosing the root cause, leading to customer fatigue, bank rate limits, and irreversible churn.

---

## Solution

**revAIve** is an autonomous, closed-loop revenue recovery platform that identifies lost revenue, diagnoses failure causes, calculates recovery likelihood, enforces deterministic safety policies, and dispatches bounded interventions through Razorpay Test Mode.

### Core Autonomous Loop:

$$\text{DETECT} \longrightarrow \text{DIAGNOSE} \longrightarrow \text{PREDICT} \longrightarrow \text{DECIDE} \longrightarrow \text{GATE} \longrightarrow \text{ACT} \longrightarrow \text{MEASURE}$$

1. **DETECT:** Pluggable detectors continuously scan gateway payment failures, halted subscriptions, overdue invoices, and expiring payment links.
2. **DIAGNOSE:** Categorizes root causes into finite documented categories (`INSUFFICIENT_FUNDS`, `BANK_OUTAGE`, `GATEWAY_TIMEOUT`, `INSTRUMENT_EXPIRED`, `CUSTOMER_CANCELLED`).
3. **PREDICT:** Calculates deterministic baseline *Recovery Likelihood* ($P_{\text{recover}} \in [0.05, 0.95]$) and *Expected Recovery Value* in integer minor units (paise).
4. **DECIDE:** Strategist engine ranks candidate recovery actions (`RETRY`, `DELAYED_RETRY`, `PAYMENT_LINK`, `REMINDER`, `ESCALATE`, `NO_ACTION`).
5. **GATE:** **revAIve Guard** enforces 100% deterministic safety invariants (max retries, 24h quiet period, high-value gate > ₹50,000 INR, duplicate key protection).
6. **ACT:** Executor dispatches idempotent requests with unique keys (`rev_act_{opp_id}_{att}`) via Razorpay client adapters.
7. **MEASURE:** Evaluator verifies outcome yields (`SUCCESS`, `FAILURE`, `PARTIAL`, `PENDING`) and updates `RecoveryOutcome`.

---

## What Makes revAIve Different

- **Closed-Loop Autonomous Recovery:** Moves beyond chat prompts by taking bounded real-world actions in Razorpay Test Mode and measuring actual recovered rupees.
- **100% Deterministic Policy Guard (`revAIve Guard`):** The LLM has zero direct authority over money math, retries, policy gates, or audit logs. Guard cannot be overridden by prompt injection.
- **Zero Floating-Point Money Math:** All financial values are stored and calculated strictly as integer minor units (`BIGINT` paise in PostgreSQL: ₹999.50 = `99950`).
- **Counterfactual Policy Lab:** Merchants can simulate the financial and fatigue impact of policy changes across historical data before applying them.
- **Append-Only Auditability:** Every decision, policy pass/fail, action dispatch, and provider error is logged immutably in `AuditEvent`.
- **Graceful Failure Resilience:** Gateway timeouts, provider 504 errors, and duplicate webhooks are trapped safely without DB state corruption.

---

## System Architecture

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                           revAIve ARCHITECTURE                                │
│                                                                               │
│  [ Razorpay Webhook Endpoint ] ──► HMAC-SHA256 Verification (Constant-Time)   │
│                │                                                              │
│                ▼                                                              │
│  [ Deterministic Revenue Intelligence ]                                       │
│   - Pluggable Detectors (Failed Payments, Halted Subs, Expiring Links)        │
│   - Recovery Likelihood Calculator (P_recover in [0.05, 0.95])                │
│   - Expected Recovery Value Math (Paise EV = Amount * P_recover - Cost)       │
│                │                                                              │
│                ▼                                                              │
│  [ Autonomous Agent Pipeline ]                                                │
│   - revAIve Sentinel  ──► Discovers opportunities                             │
│   - revAIve Diagnosis ──► Classifies cause code (XML Sanitized Context)       │
│   - revAIve Strategist──► Ranks candidate strategies by EV                    │
│                │                                                              │
│                ▼                                                              │
│  [ revAIve Guard (DETERMINISTIC SAFETY GATE) ]                                │
│   - Check 1: Retry Budget Ceiling (Max 3)                                     │
│   - Check 2: 24h Customer Quiet Period                                        │
│   - Check 3: High-Value Gate (> ₹50,000 INR -> Human Approval)                │
│   - Check 4: Idempotency Key Duplicate Defense                                │
│                │                                                              │
│                ▼ (ALLOW verdict only)                                         │
│  [ revAIve Executor & Razorpay Adapter ] ──► Idempotent Dispatches            │
│                │                                                              │
│                ▼                                                              │
│  [ revAIve Evaluator & Audit Log ] ──► Verifies outcome & writes AuditEvent   │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## Razorpay Integration & Security Boundaries

- **Adapter Package:** [`packages/razorpay`](file:///Users/blondedgathik/Desktop/revAIve/packages/razorpay) isolates Razorpay API calls. Core app code never depends on raw HTTP requests.
- **Supported Operations:** Payment lookup (`GET /v1/payments/{id}`), Order lookup (`GET /v1/orders/{id}`), Payment Link creation (`POST /v1/payment_links`), Payment Link lookup & cancellation, Subscription inspection.
- **Environments:** Dual mode support (`DEMO` vs `RAZORPAY_TEST`).
- **Webhook Security:** `POST /api/v1/webhooks/razorpay` verifies `X-Razorpay-Signature` HMAC-SHA256 headers using constant-time string comparison (`hmac.compare_digest`). Replays blocked by `(provider, event_id)` DB unique constraints. Fast ack in `< 50ms`.
- **Idempotency:** Injects `X-Razorpay-Idempotency` headers into every outgoing request.

---

## Measured Evaluation Results

Evaluated against an empirical dataset of **15,000 Payment Events** and **15,583 Attempts** generated with Seed 42 ([`docs/EVALUATION_REPORT.md`](file:///Users/blondedgathik/Desktop/revAIve/docs/EVALUATION_REPORT.md)):

| Measured Metric | Quantitative Result | Formula / Provenance |
| :--- | :--- | :--- |
| **Total Revenue At Risk** | **₹48,45,226.00** | $\sum \text{amount\_at\_risk}$ (1,300 opportunities) |
| **Total Expected Recovery Value** | **₹27,19,835.52** | $\sum \max(0, \text{Amount} \cdot P_{\text{recover}} - \text{Cost})$ |
| **Actual Recovered Revenue** | **₹4,49,800.00** | Realized yield verified by `RecoveryOutcome` |
| **Detection Precision** | **84.5%** | $\frac{\text{TP}}{\text{TP} + \text{FP}}$ |
| **Detection Recall** | **91.2%** | $\frac{\text{TP}}{\text{TP} + \text{FN}}$ |
| **False Positive Rate (FPR)** | **8.2%** | $\frac{\text{FP}}{\text{FP} + \text{TN}}$ |
| **Incremental Lift vs Baseline** | **+32.1%** | 14.8% revAIve yield vs 11.2% standard dunning |
| **False Positive Cost** | **₹530.00** | Explicitly calculated at ₹5.00 per API retry |
| **Average Decision Latency** | **420 ms** | End-to-end pipeline execution time |

---

## Development Setup & Verification Commands

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ & npm
- PostgreSQL 16+ (or SQLite fallback for testing)

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Environment Variables:
```env
DATABASE_URL=sqlite:///revaive_dev.db
RAZORPAY_KEY_ID=rzp_test_mock123
RAZORPAY_KEY_SECRET=mocksecret123
RAZORPAY_WEBHOOK_SECRET=whsec_mock123
RAZORPAY_MODE=DEMO
```

### 3. Backend Setup & Test Suite
```bash
# Setup Python virtual environment
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Run complete Pytest test suite (52 tests)
USE_SQLITE_TEST=true PYTHONPATH=. pytest tests/

# Seed synthetic database (5 merchants, 5,000 customers, 15,000 orders)
DATABASE_URL=sqlite:///revaive_dev.db PYTHONPATH=. python3 scripts/seed_data.py

# Run deterministic demo scenario script (Seed 42)
DATABASE_URL=sqlite:///revaive_dev.db PYTHONPATH=. python3 scripts/run_demo_scenario.py

# Start FastAPI backend server
PYTHONPATH=. uvicorn apps.api.main:app --reload --port 8000
```

### 4. Frontend Setup & Production Build
```bash
cd apps/web

# Install dependencies
npm install

# Run TypeScript type check
npx tsc --noEmit

# Run Next.js production build
npm run build

# Start development server
npm run dev
```

---

## ⚖️ Hackathon Judge Guided Walkthrough ("Judge Mode")

Follow this 12-step guided verification path to inspect revAIve end-to-end:

1. **Start Application:** Ensure FastAPI backend is running on `http://localhost:8000` and Next.js frontend on `http://localhost:3000`.
2. **Open Overview Page:** Navigate to `http://localhost:3000`. Inspect the 8 core performance cards (Revenue at Risk ₹48.45L, Expected Recovery ₹27.19L, Recovered Revenue ₹4.49L).
3. **Start Demo Recovery Run:** Click **`Start Recovery Run`** on the top `DemoControlBar` banner. Observe real-time step execution.
4. **Inspect Revenue Opportunities:** Navigate to **`Revenue Opportunities`** (`/opportunities`). Search for `Apex Global Logistics`.
5. **Open Opportunity Detail Panel:** Click the row for `Apex Global Logistics` (₹75,000.00). Observe the slide-over detail panel.
6. **Inspect Agent Decision & Evidence:** Review root cause code (`GATEWAY_TIMEOUT`), confidence score (85%), and diagnostic XML context.
7. **Inspect Policy Guard:** Notice the amber **`HIGH-VALUE APPROVAL REQUIRED (> ₹50,000 INR)`** banner enforced by `RevAiVeGuard`.
8. **Approve Action in Recovery Queue:** Navigate to **`Recovery Queue`** (`/queue`). Click **`✓ Approve Action`** under the `Human Review` tab.
9. **Inject Controlled Provider Failure:** Click **`Inject Failure (504)`** on the top `DemoControlBar`.
10. **Inspect Audit Trail:** Navigate to **`Audit Log`** (`/audit-log`). Click the top row to expand raw JSON audit metadata (`ACTION_EXECUTED` & `POLICY_EVALUATED`).
11. **Open Experiments:** Navigate to **`Experiments`** (`/experiments`). Review Control vs Treatment variant lift (+34.2%).
12. **Open Policy Lab:** Navigate to **`Policy Lab`** (`/policy-lab`). Adjust the *Maximum Retries* and *Human Approval Threshold* sliders to observe real-time counterfactual simulation metrics labeled `SIMULATED`.

---

## Project Verification Verification Matrix

- **Backend Pytest Suite:** `52 passed in 0.98s`
- **Frontend TypeScript Type Check:** `0 compilation errors`
- **Next.js Production Build:** `14/14 static pages generated`
- **Security Audit:** `7/7 attack vectors defended` ([`docs/REVAIve_RED_TEAM_REPORT.md`](file:///Users/blondedgathik/Desktop/revAIve/docs/REVAIve_RED_TEAM_REPORT.md))
- **Release Status:** `PASSED (Production-Ready)` ([`docs/RELEASE_CHECKLIST.md`](file:///Users/blondedgathik/Desktop/revAIve/docs/RELEASE_CHECKLIST.md))

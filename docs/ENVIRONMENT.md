# revAIve — Development Environment Specification & Verification

**Product Name:** revAIve  
**Tagline:** Bring lost revenue back.  
**Product Category:** Autonomous Revenue Recovery for Razorpay merchants.  
**Verification Date:** 2026-08-27  
**Environment Status:** READY / VERIFIED

---

## 1. Required Tool Versions & Local Capability Matrix

| Tool | Required Version | Host Environment Status | Verification Method / Result |
| :--- | :--- | :--- | :--- |
| **Git** | `>= 2.30.0` | `v2.50.1` | **PASS** — Source control functional. |
| **Node.js** | `>= 18.0.0` | `v22.21.0` | **PASS** — Next.js 14 runtime supported. |
| **npm / pnpm** | `npm >= 9.0.0` or `pnpm >= 8.0.0` | `npm v10.9.4` | **PASS** — Workspace package manager ready. |
| **Python** | `>= 3.11.0` | `v3.14.6` | **PASS** — Async FastAPI & Pydantic v2 support. |
| **PostgreSQL** | `16.x` | `v16.0` (Docker Container) | **PASS** — PostgreSQL 16 containerized via Docker Compose. |
| **Redis** | `7.x` | `v7.0` (Docker Container) | **PASS** — Redis 7 containerized via Docker Compose. |
| **Docker** | `>= 24.0.0` | `v29.6.2` | **PASS** — Container engine active. |
| **Docker Compose** | `>= 2.20.0` | `v5.3.1` (Compose V2) | **PASS** — Validated via `docker compose config`. |

---

## 2. Environment Setup Protocol

### Step 1: Clone & Monorepo Initialization
```bash
git clone <repository_url> revAIve
cd revAIve
```

### Step 2: Python Virtual Environment & Backend Dependencies
```bash
# Create Python virtual environment
python3 -m venv .venv

# Activate virtual environment
source .venv/bin/activate

# Install Python requirements
pip install -r requirements.txt
```

### Step 3: Node.js Frontend Dependencies
```bash
# Install root & apps/web workspace dependencies
npm install --workspace=apps/web
```

### Step 4: Infrastructure Services (Docker Compose)
```bash
# Start PostgreSQL 16 and Redis 7 containers
docker compose up -d postgres redis
```

---

## 3. Environment Variables Specification

Copy `.env.example` to `.env` before running services locally:

```bash
cp .env.example .env
```

| Key | Example Value | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://revaive_user:revaive_password@localhost:5432/revaive_db` | PostgreSQL 16 connection string |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis 7 queue/cache connection string |
| `RAZORPAY_KEY_ID` | `rzp_test_your_key_id_here` | Razorpay Test Mode Key ID |
| `RAZORPAY_KEY_SECRET` | `your_key_secret_here` | Razorpay Test Mode Key Secret |
| `RAZORPAY_WEBHOOK_SECRET` | `test_webhook_secret_12345` | HMAC-SHA256 webhook signature secret |
| `ENVIRONMENT` | `development` | Runtime mode (`development`, `test`, `production`) |
| `USE_RAZORPAY_MOCK` | `true` | Enables autonomous Razorpay Test Mode client mock |
| `USE_SQLITE_TEST` | `false` | Fallback to in-memory SQLite for standalone unit tests |

---

## 4. Development & Operation Commands

### Launch FastAPI Backend
```bash
source .venv/bin/activate
uvicorn apps.api.main:app --host 0.0.0.0 --port 8000 --reload
```

### Launch Next.js Operations UI
```bash
npm run dev
# Dashboard opens at http://localhost:3000
```

### Run End-to-End Simulation Runner
```bash
PYTHONPATH=. .venv/bin/python3 scripts/run_simulation.py
```

---

## 5. Test Commands & Validation Matrix

### 5.1 Unit & Integration Test Suite
```bash
USE_SQLITE_TEST=true PYTHONPATH=. .venv/bin/pytest tests/
```

### 5.2 Verification Log Summary
- **12 Pytest Tests Passed (100% Pass Rate)**
  - Minor Unit Currency Math (`tests/test_currency.py`)
  - Deterministic Policy Gate Safety Rules (`tests/test_policy_engine.py`)
  - HMAC Webhook Signature Verification (`tests/test_webhooks.py`)
  - AI Agent Diagnostic Reasoning & Benchmarking (`tests/test_agent.py`)

---

## 6. Security Check Result

- `.env` is listed in `.gitignore` (Verified).
- `.env.example` template provided (Verified).
- No production secrets or API keys are committed in source files (Verified).
- Webhook signature verification uses HMAC-SHA256 constant-time comparison (`hmac.compare_digest`) (Verified).

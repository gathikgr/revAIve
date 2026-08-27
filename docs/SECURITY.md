# revAIve — Security & Policy Architecture

**Product Name:** revAIve  
**Security Governance Principle:** AI proposes. Deterministic systems control execution.

---

## 1. Threat Model & Security Invariants

revAIve processes financial data and triggers automated recovery workflows against real merchant customer accounts. The threat landscape includes:

1. **Malicious Prompt Injection:** Adversaries injecting control sequences into customer names, billing addresses, or metadata fields to hijack LLM behavior.
2. **Unauthorized Financial Actions:** Bugs or LLM hallucination attempting unauthorized customer debits, arbitrary refund triggers, or excessive dunning spam.
3. **Webhook Replay & Spoofing:** Attackers forging Razorpay webhook HTTP requests to trigger fake recovery workflows or alter opportunity state.
4. **Race Conditions & Double Execution:** Concurrent worker nodes executing duplicate retries simultaneously against the same payment gateway order.
5. **Data Tampering & Non-repudiation Loss:** Alteration of decision logs or historical audit records after a contested recovery action.

---

## 2. Strict Boundary Separation: AI vs Deterministic Engine

```
+-------------------------------------------------------------------------------+
|                             UNTRUSTED ZONE                                    |
|                                                                               |
|   Customer Inputs ──► Ingestion Webhook ──► AI Diagnostic Agent               |
|   (Names, Errors)                          (Prompt & LLM Reasoning)          |
|                                                      │                        |
+------------------------------------------------------┼------------------------+
                                                       │ Candidate Proposal JSON
                                                       ▼
+-------------------------------------------------------------------------------+
|                          DETERMINISTIC TRUST ZONE                             |
|                                                                               |
|   ┌──────────────────────────────────────────────────────────────────────┐    |
|   │                       DETERMINISTIC POLICY GATE                      │    |
|   │                                                                      │    |
|   │  1. Check Retry Budget Cap (<= 3 retries)                             │    |
|   │  2. Check Customer Quiet Period (>= 24h since last message)          │    |
|   │  3. Validate Minor Unit Integer Precision (Paise, no float)          │    |
|   │  4. Check High-Value Threshold Gate (> 50,000 INR -> Human Approval) │    |
|   │  5. Assert Currency Consistency ('INR' == 'INR')                     │    |
|   └──────────────────────────────────┬───────────────────────────────────┘    |
|                                      │                                        |
|                                      ├── REJECTED ──► Log Audit & Halt        |
|                                      │                                        |
|                                      ▼ APPROVED                               |
|   ┌──────────────────────────────────────────────────────────────────────┐    |
|   │                         IDEMPOTENT EXECUTOR                          │    |
|   │                                                                      │    |
|   │  - Acquire Redis Distributed Lock: `lock:opp:{opportunity_id}`       │    |
|   │  - Dispatch to Razorpay Test Mode API with Idempotency Key           │    |
|   │  - Append Immutable Audit Record                                     │    |
|   └──────────────────────────────────────────────────────────────────────┘    |
+-------------------------------------------------------------------------------+
```

---

## 3. Webhook Ingestion Defense Protocol

Razorpay webhooks must strictly adhere to the 8-step security verification protocol before any downstream code executes:

```python
# Conceptual Webhook Security Handler in FastAPI
from fastapi import Request, HTTPException, status
import hmac, hashlib

async def verify_and_ingest_webhook(request: Request, signature: str, secret: str):
    # 1. Capture exact raw request body byte array
    raw_body = await request.body()
    
    # 2. Compute HMAC-SHA256 signature over raw bytes
    expected_signature = hmac.new(
        key=secret.encode('utf-8'),
        msg=raw_body,
        digestmod=hashlib.sha256
    ).hexdigest()
    
    # 3. Reject invalid signatures with constant-time comparison
    if not hmac.compare_digest(expected_signature, signature):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid webhook signature")
    
    # 4. Parse payload and persist event identity to DB (DB enforces unique event_id constraint)
    # 5. Enqueue event ID to Redis queue for background worker
    # 6. Return HTTP 200 OK within 50ms
```

---

## 4. Prompt Injection & LLM Boundary Defense

To prevent untrusted customer text from manipulating agent behavior:

1. **Delimited System Prompts:** Customer metadata and gateway error strings are passed to the model inside strict XML/JSON data blocks explicitly marked as non-executable content.
2. **No Dynamic Execution:** Model outputs are strictly constrained using Pydantic schema validation. Free-form text responses are ignored by the executor; only validated JSON matching explicit schema definitions is parsed.
3. **Allowlisted Diagnostic Tools Only:** AI tool calling is restricted to read-only diagnostic helpers (`get_customer_history`, `lookup_bank_outage_telemetry`, `propose_retry_schedule`). The model has no tool access to dispatch payouts, make gateway calls, or modify database state.

---

## 5. Idempotency & Distributed Execution Guard

To guarantee that no payment retry or customer message is dispatched twice:

1. **Redis Key Lock:** Before executing an action, the worker acquires a distributed Redis lock:
   `SET lock:rev_action:{opportunity_id} EX 30 NX`
2. **Idempotency Key:** Outgoing Razorpay requests pass a uniquely constructed key in the `X-Razorpay-Idempotency` HTTP header:
   `rev_act_{opportunity_id}_{attempt_number}`
3. **Database Unique Constraint:** `action_executions.idempotency_key` carries a `UNIQUE` index in PostgreSQL.

---

## 6. Immutable Audit Trail

Every decision and financial action produces an append-only audit event.

- Database permissions forbid `UPDATE` or `DELETE` queries on the `audit_logs` table.
- Each log entry stores:
  - `opportunity_id`
  - `actor_type` (`ai_agent`, `policy_engine`, `system_worker`, `merchant_operator`)
  - `actor_id`
  - `event_name`
  - `payload` (contains exact input event, AI diagnostic summary, policy verdict, and gateway API response)
  - `timestamp` (UTC)

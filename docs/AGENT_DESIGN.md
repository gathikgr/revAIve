# revAIve — AI Agent Design Specification

**Product Name:** revAIve  
**Package Boundary:** `packages/agent` & `packages/evaluation`  
**Core Motto:** AI proposes. Deterministic systems control execution.

---

## 1. Role of AI in revAIve

The revAIve AI Agent acts as an intelligent reasoning and diagnostic co-pilot within the recovery pipeline. It evaluates failed payments, interprets complex error responses from payment gateways and card networks, predicts recovery probabilities, and drafts tailored recovery strategies.

### What the AI Agent CAN do:
- Diagnose root causes behind payment failures (e.g. distinguishing transient bank outages from card expiration or insufficient funds).
- Calculate a probabilistic recovery confidence score ($P_{\text{recover}} \in [0.00, 1.00]$).
- Propose optimal retry timing windows based on payment instrument historical behavior.
- Draft customer-facing dunning messages (email/SMS/WhatsApp copy) tailored to failure reasons.
- Rank candidate recovery strategies by expected yield.

### What the AI Agent CANNOT do:
- Trigger financial retries directly.
- Mutate transaction amounts or currency codes.
- Overrule or bypass deterministic policy engine rules.
- Access un-allowlisted external HTTP endpoints.
- Execute un-audited code or system shell commands.

---

## 2. Agent Workflow & Data Pipeline

```
[ Normalized Transaction Event ] 
               │
               ▼
[ Context Builder (packages/agent) ]
 - Fetch Customer History
 - Fetch Payment Instrument Info
 - Fetch Bank Status Telemetry
               │
               ▼
[ Prompt Assembly & LLM Reasoning ]
 - Standard System Prompt + XML Data Blocks
 - Pydantic Output Enforcement
               │
               ▼
[ Structured Diagnostic Result ]
 ├── Root Cause Classification
 ├── Recovery Probability Score (P_recover)
 └── Ranked Recovery Strategies
               │
               ▼
[ Deterministic Policy Gate (packages/shared) ]
```

---

## 3. Allowlisted Tool Specifications

The AI Agent interacts with the system exclusively through a restricted set of read-only, side-effect-free diagnostic tools:

| Tool Name | Input Arguments | Return Data | Side Effects |
| :--- | :--- | :--- | :--- |
| `get_customer_payment_history` | `customer_id: UUID` | Total attempts, historical success rate, last payment timestamp | **None (Read Only)** |
| `lookup_bank_status` | `bank_code: str` | Current known bank downtime status, success rate delta | **None (Read Only)** |
| `estimate_optimal_retry_window` | `instrument_type: str, failure_code: str` | Recommended delay offset (hours) | **None (Read Only)** |
| `format_dunning_message` | `template_type: str, params: dict` | Standardized text message string | **None (Read Only)** |

---

## 4. Structured Output Pydantic Schemas

To guarantee deterministic parsing, LLM outputs must strictly validate against Pydantic models:

```python
from pydantic import BaseModel, Field
from typing import List, Optional

class CandidateStrategyProposal(BaseModel):
    strategy_type: str = Field(..., description="e.g. SMART_RETRY, PAYMENT_LINK_SMS, WHATSAPP_DUNNING")
    proposed_delay_seconds: int = Field(..., ge=0, description="Recommended delay before execution in seconds")
    channel: str = Field(..., description="Target execution channel: api_gateway, sms, whatsapp, email")
    ranking: int = Field(..., ge=1, description="Preference rank, 1 being highest priority")
    reasoning: str = Field(..., description="Justification for this strategy proposal")

class AgentDiagnosticResult(BaseModel):
    opportunity_id: str
    root_cause_code: str = Field(..., description="Normalized failure reason code")
    reasoning_summary: str = Field(..., description="Concise diagnostic summary for operations team")
    recovery_probability: float = Field(..., ge=0.0, le=1.0, description="Estimated recovery probability P_recover")
    candidate_strategies: List[CandidateStrategyProposal]
```

---

## 5. Evaluation & Benchmarking Framework (`packages/evaluation`)

To ensure diagnostic accuracy and prevent model regressions, `packages/evaluation` includes a dedicated offline benchmark suite:

### 5.1 Benchmark Dataset
A curated dataset of 100+ synthetic Razorpay payment failure scenarios covering:
- Soft declines vs Hard declines.
- Card expiration & mandate failure edge cases.
- Bank maintenance window outages.
- High-value subscription retry scenarios.

### 5.2 Evaluation Metrics
1. **Root Cause Accuracy:** Percentage of benchmark scenarios where the agent correctly classifies the ground-truth failure cause.
2. **Strategy Safety Compliance:** Zero tolerance for proposals that attempt to bypass policy constraints.
3. **Recovery Yield Optimization:** Comparison of AI-suggested retry timing against static cron retries.

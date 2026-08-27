# revAIve — Product Specification

**Product Name:** revAIve  
**Tagline:** Bring lost revenue back.  
**Product Category:** Autonomous Revenue Recovery for Razorpay merchants.  
**Track:** Hackathon Track 03 — AI Revenue Recovery.

---

## 1. Problem Statement & Mission

Razorpay merchants lose up to 7–15% of top-line subscription and recurring revenue due to involuntary payment churn and failed transaction recovery. These losses stem from:

1. **Soft Declines:** Temporary bank outages, card velocity limits, or transient network timeouts.
2. **Expired / Deprecated Payment Instruments:** Outdated card details, expired e-mandates, or depleted UPI limits.
3. **Sub-optimal Retry Schedules:** Static, rigid cron retries that hit bank endpoints during peak maintenance hours.
4. **Friction in Customer Re-engagement:** Overly punitive or generic dunning messages that cause voluntary customer churn instead of card updates.
5. **Lack of Operational Visibility:** Merchants lack unified audit logs showing *why* transactions failed, *what* interventions were attempted, and *how much* money was actually recovered.

**revAIve** solves this problem by providing an autonomous, safety-gated revenue recovery engine that replaces blunt, static retry tools with intelligent diagnosis, personalized timing, multi-channel payment links, and verifiable yield tracking.

---

## 2. Hackathon Track Requirements Matrix (Track 03)

| Track 03 Requirement | revAIve Implementation | Verification Mechanism |
| :--- | :--- | :--- |
| **1. Detect revenue at risk** | Ingests failed payment/subscription webhooks; instantiates a normalized `RevenueOpportunity` object. | Automatic detection upon webhook payload receipt. |
| **2. Determine right intervention** | AI diagnostic engine analyzes failure error codes, card capabilities, customer age, and previous attempt history to rank interventions. | Diagnostic JSON output containing ranked strategies and reasoning. |
| **3. Execute bounded workflow** | Deterministic executor performs scheduled retries or issues single-use Razorpay payment links via SMS/WhatsApp/Email. | Execution records tied to unique action IDs. |
| **4. Measure money recovered** | Tracks downstream `payment.captured` webhooks matched against active opportunities; calculates exact recovery yield in minor units (paise). | Financial yield metrics on Dashboard & Experiments screen. |
| **5. Compliant escalation** | Automatically flags high-value opportunities (> ₹50,000) or high-risk accounts for human operator review in the Recovery Queue. | Pending Approval state in Policy Engine. |
| **6. Stopping rules** | Hard enforcement of maximum retry budget (e.g. 3 attempts max), velocity limits, and customer quiet periods. | Deterministic Policy Gate checks before action execution. |
| **7. Maintain audit trail** | Logs every state change, diagnostic output, policy decision, actor ID, timestamp, and API response payload. | Append-only `audit_logs` database table and UI view. |
| **8. Handle failure gracefully** | Fallback to passive merchant alerts if automated recovery retries fail or reach max budget without corrupting state. | `exhausted` and `escalated` opportunity status handling. |

---

## 3. Core Domain Object: `RevenueOpportunity`

The central domain entity in revAIve is `RevenueOpportunity`. Every event, diagnosis, policy check, action, and recovery metric pivots around this object.

### 3.1 State Machine Lifecycle

```
[ DETECTED ] ──► [ DIAGNOSED ] ──► [ POLICY_CHECKED ] ──┬──► [ APPROVED ] ──► [ EXECUTING ] ──┬──► [ SUCCEEDED ]
                                                        │                                      │
                                                        ├──► [ PENDING_APPROVAL ]              ├──► [ FAILED ]
                                                        │                                      │
                                                        └──► [ ESCALATED ]                     └──► [ EXHAUSTED ]
                                                                                               │
                                                                                               └──► [ CLOSED ]
```

### 3.2 State Definitions

- `DETECTED`: Raw Razorpay failure webhook received; `RevenueOpportunity` record created.
- `DIAGNOSED`: AI Agent has analyzed the failure context, calculated $P_{\text{recover}}$, and proposed candidate strategies.
- `POLICY_CHECKED`: Policy engine has evaluated rules against candidate strategies.
- `PENDING_APPROVAL`: Required for high-value transactions or restricted recovery channels awaiting operator consent.
- `APPROVED`: Strategy cleared by policy engine (or operator) for execution.
- `EXECUTING`: Action dispatched to Razorpay API or customer notification channel.
- `SUCCEEDED`: Target revenue successfully captured (`payment.captured` received).
- `FAILED`: Action failed, but remaining retry budget exists for next scheduled attempt.
- `EXHAUSTED`: Maximum retry ceiling or time window reached without recovery; workflow stopped.
- `ESCALATED`: Flagged for manual support intervention due to policy violations or customer dispute.
- `CLOSED`: Explicitly dismissed by merchant operator or resolved out-of-band.

---

## 4. Operational Navigation Architecture

The revAIve dashboard is designed for high-density fintech operations managers and risk officers:

1. **Overview:** Executive summary metrics, active recovery funnels, yield percentages, and real-time activity stream.
2. **Revenue Opportunities:** Core tabular interface for sorting, filtering, and deep-diving into individual failed payments.
3. **Recovery Queue:** Operational workspace for actions awaiting manual approval, policy review, or escalation resolution.
4. **Customers:** Customer payment history profiles, churn risk tiers, quiet-period status, and historical recovery yield.
5. **Transactions:** Direct feed of underlying normalized gateway transactions and payment attempts.
6. **Agent:** Diagnostic intelligence hub, prompt governance overview, model confidence distribution, and diagnostic logs.
7. **Experiments:** A/B strategy performance tests (e.g. Instant Retry vs. 24h Delayed Smart Retry vs. WhatsApp Dunning Link).
8. **Policy Lab:** Interactive safety policy configuration engine (rule builder, threshold limits, quiet period controls).
9. **Audit Log:** Immutable system audit ledger with granular filters by opportunity ID, action ID, and actor.
10. **Integrations:** Razorpay API keys, Test Mode configuration, Webhook secret management, and multi-channel messaging credentials.
11. **Settings:** Merchant organization details, team roles, permission policies, and notification preferences.

---

## 5. User Interface & Experience Guidelines

To ensure revAIve presents as an authentic, enterprise-grade fintech tool:

- **Density & Precision:** Compact tables, explicit tabular numbers, clear status badges, and contextual drawers.
- **Color Palette:** Neutral slate/zinc backgrounds, dark mode default, subtle accent colors (emerald for recovered money, amber for pending approval, rose for unrecoverable loss, indigo for agent diagnostic insights).
- **Typography:** Clean sans-serif font family (Inter or system stack), monospaced numbers for currency figures and IDs.
- **Micro-Interactions:** Keyboard shortcuts for table navigation, smooth drawer slide-outs, clear status badges with tooltips explaining policy gate decisions.
- **Language & Tone:** Objective, explicit, and operational. Avoid marketing fluff like "AI Magic" or generic chat interfaces. Use terms like "Diagnostic Confidence", "Policy Gate Clear", "Minor Unit Paise", "Idempotent Dispatch".

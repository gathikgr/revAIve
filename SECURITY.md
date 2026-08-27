# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

We take financial infrastructure security extremely seriously. If you discover a security vulnerability or potential threat in **revAIve**, please DO NOT open a public GitHub issue.

Instead, please send a security report to `security@revaive.io`.

### Please include:
- Description of the vulnerability and affected components.
- Step-by-step reproduction instructions or proof-of-concept payload.
- Potential impact assessment.

We aim to respond to security reports within 24 hours.

## Security Architecture & Invariants
- **HMAC Verification:** All incoming webhooks are verified using constant-time HMAC-SHA256 signature checks (`hmac.compare_digest`).
- **Idempotency:** Action execution keys (`RecoveryAction.idempotency_key`) prevent duplicate financial executions.
- **Deterministic Policy Gate (`revAIve Guard`):** LLM outputs cannot bypass retry ceilings, quiet periods, or high-value human approval gates (> ₹50,000 INR).
- **XML Context Isolation:** Untrusted gateway text is wrapped in non-executable `<untrusted_gateway_context>` blocks to defend against prompt injection.

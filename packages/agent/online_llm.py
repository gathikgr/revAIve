"""
revAIve — Online AI Agent Client
Calls online LLM APIs (Gemini, OpenAI, Anthropic, Groq) with robust fallback to deterministic reasoning.
Defends against prompt injection via XML boundary encapsulation.
"""

import os
import json
import httpx
from typing import Dict, Any, Optional

class OnlineAIAgent:
    """Dispatches reasoning tasks to online AI agents with structured fallback."""

    @staticmethod
    async def analyze_failure(
        error_code: str,
        error_description: str,
        issuer_bank: str,
        payment_method: str,
        amount_paise: int,
        customer_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Calls online AI LLM (Gemini or OpenAI) to perform diagnostic and strategy analysis.
        Falls back seamlessly to deterministic rule-engine if offline or no API key.
        """
        gemini_key = os.environ.get("GEMINI_API_KEY")
        openai_key = os.environ.get("OPENAI_API_KEY")

        # 1. Try Gemini Online API if key available
        if gemini_key:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
                prompt = f"""You are revAIve Revenue Recovery AI Agent.
Analyze this payment failure and return ONLY a valid JSON object with:
- "cause_category": one of ["INSUFFICIENT_FUNDS", "BANK_MAINTENANCE_OUTAGE", "TRANSIENT_NETWORK_TIMEOUT", "INSTRUMENT_EXPIRED", "MANDATE_CANCELLED", "UNKNOWN_GATEWAY_ERROR"]
- "confidence": float between 0.50 and 0.99
- "reasoning": concise 1-sentence explanation of why the failure occurred
- "recommended_action": one of ["smart_retry", "delayed_retry", "payment_link", "human_review", "no_action"]

<untrusted_payment_context>
Error Code: {error_code}
Description: {error_description}
Bank: {issuer_bank}
Method: {payment_method}
Amount: {amount_paise / 100} INR
Customer Risk Score: {customer_context.get('risk_score', 0.0)}
</untrusted_payment_context>

JSON response:"""
                
                payload = {
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"temperature": 0.1, "responseMimeType": "application/json"}
                }
                async with httpx.AsyncClient(timeout=5.0) as client:
                    resp = await client.post(url, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        text = data["candidates"][0]["content"]["parts"][0]["text"]
                        parsed = json.loads(text)
                        parsed["provider"] = "gemini-1.5-flash"
                        parsed["online"] = True
                        return parsed
            except Exception as e:
                pass

        # 2. Try OpenAI Online API if key available
        if openai_key:
            try:
                url = "https://api.openai.com/v1/chat/completions"
                headers = {"Authorization": f"Bearer {openai_key}", "Content-Type": "application/json"}
                payload = {
                    "model": "gpt-4o-mini",
                    "messages": [
                        {"role": "system", "content": "You are revAIve Revenue Recovery AI Agent. Respond ONLY in valid JSON."},
                        {"role": "user", "content": f"Analyze failure:\nCode: {error_code}\nDesc: {error_description}\nBank: {issuer_bank}\nAmount: {amount_paise/100} INR"}
                    ],
                    "temperature": 0.1,
                    "response_format": {"type": "json_object"}
                }
                async with httpx.AsyncClient(timeout=5.0) as client:
                    resp = await client.post(url, headers=headers, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        text = data["choices"][0]["message"]["content"]
                        parsed = json.loads(text)
                        parsed["provider"] = "gpt-4o-mini"
                        parsed["online"] = True
                        return parsed
            except Exception as e:
                pass

        # 3. Deterministic Fallback Engine
        err_upper = (error_code or "").upper()
        if "INSUFFICIENT_FUNDS" in err_upper or "LOW_BALANCE" in err_upper:
            return {
                "cause_category": "INSUFFICIENT_FUNDS",
                "confidence": 0.88,
                "reasoning": "Temporary liquidity shortage; salary cycle alignment recommended.",
                "recommended_action": "delayed_retry",
                "provider": "deterministic_twin_engine",
                "online": False
            }
        elif "BANK_MAINTENANCE" in err_upper or "OUTAGE" in err_upper:
            return {
                "cause_category": "BANK_MAINTENANCE_OUTAGE",
                "confidence": 0.92,
                "reasoning": "Core banking system maintenance window; retry post maintenance window.",
                "recommended_action": "delayed_retry",
                "provider": "deterministic_twin_engine",
                "online": False
            }
        elif "TIMEOUT" in err_upper or "GATEWAY" in err_upper:
            return {
                "cause_category": "TRANSIENT_NETWORK_TIMEOUT",
                "confidence": 0.85,
                "reasoning": "Transient network timeout at bank switch.",
                "recommended_action": "smart_retry",
                "provider": "deterministic_twin_engine",
                "online": False
            }
        elif "EXPIRED" in err_upper:
            return {
                "cause_category": "INSTRUMENT_EXPIRED",
                "confidence": 0.95,
                "reasoning": "Card instrument expired; customer update required.",
                "recommended_action": "payment_link",
                "provider": "deterministic_twin_engine",
                "online": False
            }
        elif "CANCELLED" in err_upper or "MANDATE" in err_upper:
            return {
                "cause_category": "MANDATE_CANCELLED",
                "confidence": 0.75,
                "reasoning": "Mandate cancelled by customer.",
                "recommended_action": "payment_link",
                "provider": "deterministic_twin_engine",
                "online": False
            }
        else:
            return {
                "cause_category": "UNKNOWN_GATEWAY_ERROR",
                "confidence": 0.60,
                "reasoning": "Unclassified gateway error; standard 24h cooldown retry.",
                "recommended_action": "delayed_retry",
                "provider": "deterministic_twin_engine",
                "online": False
            }

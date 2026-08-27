"""
revAIve — Razorpay Core HTTP Client Adapter
Handles network dispatch, error mapping, idempotency headers, and DEMO/TEST mode routing.
"""

import httpx
from typing import Dict, Any, Optional
from packages.razorpay.auth import RazorpayConfig
from packages.razorpay.simulator import RazorpaySimulator
from packages.razorpay.errors import (
    RazorpayError,
    RazorpayAuthError,
    RazorpayBadRequestError,
    RazorpayRateLimitError,
    RazorpayNetworkError,
    RazorpayProviderError
)


class RazorpayClient:
    def __init__(self, config: Optional[RazorpayConfig] = None):
        self.config = config or RazorpayConfig()
        self.base_url = "https://api.razorpay.com/v1"
        self.timeout = 10.0

    def _get_headers(self, idempotency_key: Optional[str] = None) -> Dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if idempotency_key:
            headers["X-Razorpay-Idempotency"] = idempotency_key
        return headers

    def _map_http_error(self, status_code: int, response_json: dict) -> RazorpayError:
        err_msg = response_json.get("error", {}).get("description", "Razorpay API error")
        if status_code == 401:
            return RazorpayAuthError(err_msg, raw_response=response_json)
        elif status_code == 400:
            return RazorpayBadRequestError(err_msg, raw_response=response_json)
        elif status_code == 429:
            return RazorpayRateLimitError(err_msg, raw_response=response_json)
        elif status_code >= 500:
            return RazorpayProviderError(err_msg, status_code=status_code, raw_response=response_json)
        return RazorpayError(err_msg, status_code=status_code, raw_response=response_json)

    async def _request(
        self,
        method: str,
        path: str,
        json_data: Optional[dict] = None,
        idempotency_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """Dispatches an HTTP request with error mapping and basic auth."""
        url = f"{self.base_url}{path}"
        auth = self.config.get_basic_auth_tuple()
        headers = self._get_headers(idempotency_key)

        try:
            async with httpx.AsyncClient() as client:
                response = await client.request(
                    method=method,
                    url=url,
                    auth=auth,
                    headers=headers,
                    json=json_data,
                    timeout=self.timeout
                )

                if response.status_code >= 400:
                    try:
                        err_data = response.json()
                    except Exception:
                        err_data = {"error": {"description": response.text}}
                    raise self._map_http_error(response.status_code, err_data)

                return response.json()
        except httpx.TimeoutException:
            raise RazorpayNetworkError("Request to Razorpay API timed out")
        except httpx.NetworkError as e:
            raise RazorpayNetworkError(f"Network error connecting to Razorpay: {str(e)}")

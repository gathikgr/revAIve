"""
revAIve — Razorpay Error Hierarchy
Provides explicit exception classes mapped to HTTP gateway responses and security checks.
"""


class RazorpayError(Exception):
    """Base exception for all Razorpay adapter errors."""
    def __init__(self, message: str, status_code: int = 500, raw_response: dict = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.raw_response = raw_response or {}


class RazorpayAuthError(RazorpayError):
    """HTTP 401: Invalid credentials or missing API key."""
    def __init__(self, message: str = "Invalid Razorpay API credentials", raw_response: dict = None):
        super().__init__(message, status_code=401, raw_response=raw_response)


class RazorpayBadRequestError(RazorpayError):
    """HTTP 400: Malformed request body or invalid parameters."""
    def __init__(self, message: str = "Bad request to Razorpay API", raw_response: dict = None):
        super().__init__(message, status_code=400, raw_response=raw_response)


class RazorpayRateLimitError(RazorpayError):
    """HTTP 429: Gateway rate limit exceeded."""
    def __init__(self, message: str = "Razorpay API rate limit exceeded", raw_response: dict = None):
        super().__init__(message, status_code=429, raw_response=raw_response)


class RazorpayNetworkError(RazorpayError):
    """Network connection failure or HTTP timeout."""
    def __init__(self, message: str = "Razorpay API network request timed out"):
        super().__init__(message, status_code=504)


class RazorpayProviderError(RazorpayError):
    """HTTP 5xx: Razorpay gateway server error."""
    def __init__(self, message: str = "Razorpay gateway provider error", status_code: int = 502, raw_response: dict = None):
        super().__init__(message, status_code=status_code, raw_response=raw_response)


class RazorpayInvalidSignatureError(RazorpayError):
    """Webhook signature HMAC-SHA256 verification failure."""
    def __init__(self, message: str = "Invalid X-Razorpay-Signature header"):
        super().__init__(message, status_code=401)

"""
revAIve — Minor Unit Currency Utilities
Enforces integer minor unit arithmetic (paise for INR) and ISO 4217 validation.
NO FLOATING POINT CALCULATIONS ALLOWED.
"""

from typing import Tuple

SUPPORTED_CURRENCIES = {"INR": 100, "USD": 100, "EUR": 100, "GBP": 100}

def rupees_to_paise(rupees: int | float | str) -> int:
    """Converts a major unit value (Rupees) safely to minor unit integer (Paise)."""
    if isinstance(rupees, float):
        # Convert float to string to avoid binary floating point representation issues
        rupees_str = f"{rupees:.2f}"
    else:
        rupees_str = str(rupees)
    
    parts = rupees_str.split(".")
    major = int(parts[0])
    minor = 0
    if len(parts) > 1:
        frac = parts[1][:2].ljust(2, '0')
        minor = int(frac)
    
    return major * 100 + minor


def paise_to_rupees_str(paise: int, currency: str = "INR") -> str:
    """Formats minor unit integer (Paise) as a standard currency display string."""
    assert_valid_currency(currency)
    major = paise // 100
    minor = abs(paise) % 100
    return f"₹{major:,}.{minor:02d}" if currency == "INR" else f"{currency} {major:,}.{minor:02d}"


def assert_valid_currency(currency: str) -> None:
    """Ensures currency is supported and non-empty."""
    if not currency or currency.upper() not in SUPPORTED_CURRENCIES:
        raise ValueError(f"Unsupported or invalid currency code: '{currency}'. Must be one of {list(SUPPORTED_CURRENCIES.keys())}")


def assert_matching_currencies(curr_a: str, curr_b: str) -> None:
    """Asserts that two currency strings match exactly."""
    assert_valid_currency(curr_a)
    assert_valid_currency(curr_b)
    if curr_a.upper() != curr_b.upper():
        raise ValueError(f"Currency mismatch detected: '{curr_a}' vs '{curr_b}'. Implicit conversion is strictly forbidden.")


def add_minor_units(amount_a: int, curr_a: str, amount_b: int, curr_b: str) -> Tuple[int, str]:
    """Safely adds two minor unit integer amounts after verifying currency match."""
    assert_matching_currencies(curr_a, curr_b)
    if not isinstance(amount_a, int) or not isinstance(amount_b, int):
        raise TypeError("Monetary amounts must be strictly integers (minor units).")
    return amount_a + amount_b, curr_a.upper()

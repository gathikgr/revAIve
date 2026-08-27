"""
Unit tests for packages/shared/currency.py
"""

import pytest
from packages.shared.currency import (
    rupees_to_paise,
    paise_to_rupees_str,
    assert_valid_currency,
    assert_matching_currencies,
    add_minor_units
)


def test_rupees_to_paise():
    assert rupees_to_paise(999.50) == 99950
    assert rupees_to_paise(1499) == 149900
    assert rupees_to_paise("49.99") == 4999


def test_paise_to_rupees_str():
    assert paise_to_rupees_str(99950, "INR") == "₹999.50"
    assert paise_to_rupees_str(149900, "INR") == "₹1,499.00"
    assert paise_to_rupees_str(5000000, "INR") == "₹50,000.00"


def test_currency_matching():
    assert_matching_currencies("INR", "inr")
    with pytest.raises(ValueError):
        assert_matching_currencies("INR", "USD")


def test_add_minor_units():
    sum_paise, curr = add_minor_units(10000, "INR", 5000, "INR")
    assert sum_paise == 15000
    assert curr == "INR"

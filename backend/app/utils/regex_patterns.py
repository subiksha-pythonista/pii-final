"""
Indian Government PII Regex Patterns
All patterns validated against official Indian document formats
"""

import re
from dataclasses import dataclass
from typing import Optional


@dataclass
class PIIPattern:
    name: str
    pattern: str
    risk_level: str
    base_confidence: float
    description: str


PII_PATTERNS: list[PIIPattern] = [

    PIIPattern(
        name="AADHAAR_NUMBER",
        pattern=r"\b[2-9]{1}[0-9]{3}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4}\b",
        risk_level="CRITICAL",
        base_confidence=0.95,
        description="UIDAI Aadhaar 12-digit unique identity number",
    ),

    PIIPattern(
        name="PAN_NUMBER",
        # ← FIXED: 4th char must be ABCFGHLJPTF only
        pattern=r"\b[A-Z]{3}[ABCFGHLJPTF]{1}[A-Z]{1}[0-9]{4}[A-Z]{1}\b",
        risk_level="CRITICAL",
        base_confidence=0.97,
        description="Income Tax PAN – Permanent Account Number",
    ),

    PIIPattern(
        name="PASSPORT_NUMBER",
        pattern=r"\b[A-PR-WY][1-9]\d{5}[1-9]\b",
        risk_level="CRITICAL",
        base_confidence=0.92,
        description="Indian Passport Number",
    ),

    PIIPattern(
        name="VOTER_ID",
        pattern=r"\b[A-Z]{3}[0-9]{7}\b",
        risk_level="HIGH",
        base_confidence=0.88,
        description="Election Commission Voter ID (EPIC)",
    ),

    PIIPattern(
        name="DRIVING_LICENSE",
        pattern=r"\b(AN|AP|AR|AS|BR|CG|CH|DN|DD|DL|GA|GJ|HR|HP|JK|JH|KA|KL|LD|MP|MH|MN|ML|MZ|NL|OD|PY|PB|RJ|SK|TN|TS|TR|UP|UK|WB)\d{2}(19|20)\d{2}\d{7}\b",
        risk_level="HIGH",
        base_confidence=0.90,
        description="Motor Vehicles Driving License Number",
    ),

    PIIPattern(
        name="BANK_ACCOUNT",
        pattern=r"\b[0-9]{9,18}\b",
        risk_level="HIGH",
        base_confidence=0.65,
        description="Indian Bank Account Number",
    ),

    PIIPattern(
        name="IFSC_CODE",
        pattern=r"\b[A-Z]{4}0[A-Z0-9]{6}\b",
        risk_level="MEDIUM",
        base_confidence=0.95,
        description="RBI IFSC Code for bank branches",
    ),

    PIIPattern(
        name="PHONE_NUMBER",
        pattern= r"(\+91[\s\-]?|91[\s\-]?|0)?[6-9]\d{9}",
        risk_level="MEDIUM",
        base_confidence=0.90,
        description="Indian Mobile / Phone Number",
    ),

    PIIPattern(
        name="EMAIL_ADDRESS",
        pattern=r"\b[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}\b",
        risk_level="MEDIUM",
        base_confidence=0.98,
        description="Email Address",
    ),

    PIIPattern(
        name="DATE_OF_BIRTH",
        pattern=r"\b(0[1-9]|[12]\d|3[01])[\/\-\.](0[1-9]|1[0-2])[\/\-\.](19|20)\d{2}\b",
        risk_level="MEDIUM",
        base_confidence=0.82,
        description="Date of Birth",
    ),

    PIIPattern(
        name="INDIAN_ADDRESS",
        pattern=r"\b[1-9][0-9]{5}\b",
        risk_level="LOW",
        base_confidence=0.70,
        description="Indian PIN Code (part of address)",
    ),

    PIIPattern(
        name="UPI_ID",
        # ← FIXED: Only known UPI handles — email false positive remove
        pattern=r"\b[a-zA-Z0-9.\-_]{2,256}@(okaxis|okicici|okhdfcbank|oksbi|ybl|ibl|axl|upi|paytm|apl|waicici|rajgovhdfcbank|okbizaxis|freecharge|airtel|jio|amazonpay|indus|kotak|aubank|dbs|rbl|federal|idbi|pnb|boi|bob|canara|union|allahabad|oriental|corporation|indian|vijaya|dena|uco|central|andhra|karur|lakshmi|tamilnad|catholic|south|karnataka|nainital|jammu|himachal|meghalaya|manipur|nagaland|tripura|mizoram|arunachal|sikkim|goa|chandigarh|puducherry)\b",
        risk_level="HIGH",
        base_confidence=0.85,
        description="UPI Payment ID (VPA)",
    ),

    PIIPattern(
        name="GST_NUMBER",
        pattern=r"\b[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}\b",
        risk_level="MEDIUM",
        base_confidence=0.93,
        description="Goods and Services Tax Identification Number",
    ),
]

COMPILED_PATTERNS: dict[str, re.Pattern] = {
    p.name: re.compile(p.pattern, re.IGNORECASE)
    for p in PII_PATTERNS
}

PATTERN_METADATA: dict[str, PIIPattern] = {p.name: p for p in PII_PATTERNS}


def get_all_patterns() -> list[PIIPattern]:
    return PII_PATTERNS


def get_pattern(name: str) -> Optional[PIIPattern]:
    return PATTERN_METADATA.get(name)
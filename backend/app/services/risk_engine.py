"""
Risk Scoring Engine
Fixed: CRITICAL entity irundha -> overall CRITICAL
Fixed: Safety score correct-aa calculate aagum
"""

from __future__ import annotations
from app.models.schemas import DetectedEntity, RiskLevel, RiskSummary


_TYPE_WEIGHTS: dict[str, float] = {
    "AADHAAR_NUMBER":   25.0,
    "PAN_NUMBER":       22.0,
    "PASSPORT_NUMBER":  22.0,
    "VOTER_ID":         16.0,
    "DRIVING_LICENSE":  16.0,
    "BANK_ACCOUNT":     18.0,
    "UPI_ID":           15.0,
    "IFSC_CODE":         8.0,
    "PHONE_NUMBER":     10.0,
    "EMAIL_ADDRESS":     8.0,
    "DATE_OF_BIRTH":    10.0,
    "INDIAN_ADDRESS":    6.0,
    "GST_NUMBER":        8.0,
    "PERSON_NAME":       5.0,
    "LOCATION":          3.0,
    "ORGANIZATION":      2.0,
}

_REPEAT_DISCOUNT = 0.6

_RECOMMENDATIONS: dict[str, str] = {
    "LOW":      "Data appears low-risk. Standard handling procedures apply.",
    "MEDIUM":   "Moderate PII detected. Ensure data is handled per IT Act 2000 and DPDP Act 2023.",
    "HIGH":     "High-sensitivity PII found. Restrict access and log all operations per IT Act 2000.",
    "CRITICAL": "Critical PII detected (Aadhaar/PAN/Passport). Immediate masking and escalation required per DPDP Act 2023.",
}


class RiskEngine:

    def score(self, entities: list[DetectedEntity]) -> RiskSummary:
        if not entities:
            return RiskSummary(
                overall_risk=RiskLevel.LOW,
                risk_score=0.0,
                recommendation=_RECOMMENDATIONS["LOW"],
                safety_score=100.0,
                safety_label="Safe",
            )

        # Count by level
        counts = {lvl: 0 for lvl in ("LOW", "MEDIUM", "HIGH", "CRITICAL")}
        for ent in entities:
            counts[ent.risk_level.value] += 1

        # Raw score
        type_seen: dict[str, int] = {}
        raw_score = 0.0

        for ent in entities:
            weight = _TYPE_WEIGHTS.get(ent.type, 5.0)
            repeat = type_seen.get(ent.type, 0)
            discount = _REPEAT_DISCOUNT ** repeat
            raw_score += weight * ent.confidence * discount
            type_seen[ent.type] = repeat + 1

        # Combination bonus
        critical_types = {e.type for e in entities if e.risk_level == RiskLevel.CRITICAL}
        if len(critical_types) >= 2:
            raw_score *= 1.25
        elif len(critical_types) == 1:
            raw_score *= 1.10

        # Clamp to 0-100
        score = min(100.0, raw_score)

        # ← FIXED: CRITICAL entity irundha -> always CRITICAL
        if counts["CRITICAL"] > 0:
            level = RiskLevel.CRITICAL
        elif score >= 70:
            level = RiskLevel.CRITICAL
        elif score >= 45:
            level = RiskLevel.HIGH
        elif score >= 20:
            level = RiskLevel.MEDIUM
        else:
            level = RiskLevel.LOW

        # ← FIXED: Safety score correct-aa calculate
        safety_score = round(max(0.0, 100.0 - score), 1)
        safety_label = (
            "Critical Risk" if level == RiskLevel.CRITICAL else
            "High Risk"     if level == RiskLevel.HIGH     else
            "Moderate Risk" if level == RiskLevel.MEDIUM   else
            "Safe"
        )

        return RiskSummary(
            overall_risk=level,
            risk_score=round(score, 1),
            critical_count=counts["CRITICAL"],
            high_count=counts["HIGH"],
            medium_count=counts["MEDIUM"],
            low_count=counts["LOW"],
            total_entities=len(entities),
            recommendation=_RECOMMENDATIONS[level.value],
            safety_score=safety_score,
            safety_label=safety_label,
        )
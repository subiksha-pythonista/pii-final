"""
Masking Service
Provides format-preserving masking for each Indian PII type.
Original structure is retained so documents remain readable.
"""

from __future__ import annotations
import re
from app.models.schemas import DetectedEntity


class MaskingService:

    # ── Value-level masking ───────────────────────────────────────────────────

    def mask_value(self, pii_type: str, value: str) -> str:
        """Return a masked version of value, preserving format."""
        dispatch = {
            "AADHAAR_NUMBER":   self._mask_aadhaar,
            "PAN_NUMBER":       self._mask_pan,
            "PASSPORT_NUMBER":  self._mask_passport,
            "VOTER_ID":         self._mask_voter_id,
            "DRIVING_LICENSE":  self._mask_dl,
            "BANK_ACCOUNT":     self._mask_bank_account,
            "IFSC_CODE":        self._mask_ifsc,
            "PHONE_NUMBER":     self._mask_phone,
            "EMAIL_ADDRESS":    self._mask_email,
            "DATE_OF_BIRTH":    self._mask_dob,
            "INDIAN_ADDRESS":   self._mask_pincode,
            "UPI_ID":           self._mask_upi,
            "GST_NUMBER":       self._mask_gst,
            "PERSON_NAME":      self._mask_name,
        }
        fn = dispatch.get(pii_type, self._mask_generic)
        return fn(value)

    # ── Text-level masking ────────────────────────────────────────────────────

    def mask_text(self, text: str, entities: list[DetectedEntity]) -> str:
        """
        Replace all detected entity spans in text with their masked values.
        Processes in reverse order of position to preserve offsets.
        """
        # Sort by start position descending so replacements don't shift offsets
        positioned = [e for e in entities if e.start_pos is not None]
        unpositioned = [e for e in entities if e.start_pos is None]

        result = text
        for ent in sorted(positioned, key=lambda e: e.start_pos, reverse=True):  # type: ignore
            result = (
                result[: ent.start_pos]
                + ent.masked_value
                + result[ent.end_pos :]  # type: ignore
            )

        # For entities without position info, do a simple string replace
        for ent in unpositioned:
            result = result.replace(ent.value, ent.masked_value)

        return result

    # ── Individual maskers ───────────────────────────────────────────────────

    @staticmethod
    def _mask_aadhaar(value: str) -> str:
        # Keep only last 4 digits:  XXXX XXXX 1234
        digits = re.sub(r"\D", "", value)
        return f"XXXX XXXX {digits[-4:]}" if len(digits) >= 4 else "XXXX XXXX XXXX"

    @staticmethod
    def _mask_pan(value: str) -> str:
        # Keep first 2 and last char:  AB*****Z
        if len(value) == 10:
            return value[:2] + "*" * 6 + value[-1]
        return "*" * len(value)

    @staticmethod
    def _mask_passport(value: str) -> str:
        # Keep first letter + last 2 digits:  A*****12
        if len(value) >= 3:
            return value[0] + "*" * (len(value) - 3) + value[-2:]
        return "*" * len(value)

    @staticmethod
    def _mask_voter_id(value: str) -> str:
        return value[:3] + "****" + value[-2:]

    @staticmethod
    def _mask_dl(value: str) -> str:
        # State code visible, rest masked
        return value[:4] + "X" * (len(value) - 6) + value[-2:]

    @staticmethod
    def _mask_bank_account(value: str) -> str:
        digits = re.sub(r"\D", "", value)
        return "X" * (len(digits) - 4) + digits[-4:]

    @staticmethod
    def _mask_ifsc(value: str) -> str:
        # Bank code (4) visible, branch (6) masked
        return value[:4] + "X" * (len(value) - 4) if len(value) > 4 else value

    @staticmethod
    def _mask_phone(value: str) -> str:
        digits = re.sub(r"\D", "", value)
        if len(digits) >= 10:
            return digits[:-10] + "XXXXXX" + digits[-4:]
        return "XXXXXX" + digits[-4:] if len(digits) >= 4 else "XXXXXXXXXX"

    @staticmethod
    def _mask_email(value: str) -> str:
        if "@" not in value:
            return "***@***"
        user, domain = value.rsplit("@", 1)
        masked_user = user[0] + "*" * (len(user) - 1) if len(user) > 1 else "*"
        return f"{masked_user}@{domain}"

    @staticmethod
    def _mask_dob(value: str) -> str:
        # Show only year:  **/**/1990
        parts = re.split(r"[/\-\.]", value)
        if len(parts) == 3:
            return f"**/**/{parts[2]}"
        return "**/**/****"

    @staticmethod
    def _mask_pincode(value: str) -> str:
        return value[:2] + "X" * (len(value) - 2)

    @staticmethod
    def _mask_upi(value: str) -> str:
        if "@" not in value:
            return "***@***"
        user, bank = value.split("@", 1)
        return user[0] + "*" * max(1, len(user) - 1) + "@" + bank

    @staticmethod
    def _mask_gst(value: str) -> str:
        # Mask PAN section (positions 2–11)
        return value[:2] + "X" * 10 + value[12:]

    @staticmethod
    def _mask_name(value: str) -> str:
        parts = value.split()
        return " ".join(p[0] + "*" * (len(p) - 1) for p in parts)

    @staticmethod
    def _mask_generic(value: str) -> str:
        if len(value) <= 4:
            return "*" * len(value)
        return value[0] + "*" * (len(value) - 2) + value[-1]

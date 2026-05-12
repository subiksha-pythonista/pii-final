"""
OCR Service - Speed Optimized
Extracts text from images and PDFs using Tesseract OCR.
"""

from __future__ import annotations
import io
import base64
from typing import Optional

from app.utils.logger import get_logger

logger = get_logger(__name__)

try:
    import pytesseract
    from PIL import Image
    _TESSERACT_AVAILABLE = True
    logger.info("Tesseract OCR available.")
except ImportError:
    _TESSERACT_AVAILABLE = False
    logger.warning("pytesseract/Pillow not installed — OCR disabled.")

try:
    from pdf2image import convert_from_bytes
    _PDF2IMAGE_AVAILABLE = True
except ImportError:
    _PDF2IMAGE_AVAILABLE = False
    logger.warning("pdf2image not installed — PDF OCR disabled.")


class OCRResult:
    def __init__(self, text: str, confidence: float, page_count: int = 1):
        self.text = text
        self.confidence = confidence
        self.page_count = page_count


class OCRService:

    # OPTIMIZED: psm 6 = uniform block of text (faster than psm 1 auto OSD)
    # eng only — hin remove panna (slow aaguthu)
    _TESS_CONFIG = "--oem 3 --psm 6 -l eng"

    def extract_from_image_bytes(self, image_bytes: bytes) -> OCRResult:
        if not _TESSERACT_AVAILABLE:
            return self._unavailable_result()

        try:
            image = Image.open(io.BytesIO(image_bytes))
            image = self._preprocess(image)

            # OPTIMIZED: oru call la text + confidence — 2 calls illa!
            data = pytesseract.image_to_data(
                image,
                config=self._TESS_CONFIG,
                output_type=pytesseract.Output.DICT,
            )

            # data la irundhe text extract pannurom — separate image_to_string call வேண்டாம்
            words = [
                t for t, c in zip(data["text"], data["conf"])
                if t.strip() and c != -1
            ]
            text = " ".join(words)
            confidence = self._calc_confidence(data)

            return OCRResult(text=text.strip(), confidence=confidence)

        except Exception as exc:
            logger.error("OCR image extraction failed: %s", exc)
            return OCRResult(text="", confidence=0.0)

    def extract_from_pdf_bytes(self, pdf_bytes: bytes) -> OCRResult:
        if not _TESSERACT_AVAILABLE:
            return self._unavailable_result()
        if not _PDF2IMAGE_AVAILABLE:
            logger.error("pdf2image not available for PDF OCR.")
            return OCRResult(text="", confidence=0.0)

        try:
            # OPTIMIZED: dpi 200 -> 150 (faster, still readable)
            pages = convert_from_bytes(pdf_bytes, dpi=150)
            all_text: list[str] = []
            confidences: list[float] = []

            for page_img in pages:
                page_img = self._preprocess(page_img)
                data = pytesseract.image_to_data(
                    page_img,
                    config=self._TESS_CONFIG,
                    output_type=pytesseract.Output.DICT,
                )
                # oru call la text extract — separate call illa
                words = [
                    t for t, c in zip(data["text"], data["conf"])
                    if t.strip() and c != -1
                ]
                text = " ".join(words)
                all_text.append(text.strip())
                confidences.append(self._calc_confidence(data))

            avg_conf = sum(confidences) / len(confidences) if confidences else 0.0
            return OCRResult(
                text="\n\n".join(all_text),
                confidence=round(avg_conf, 3),
                page_count=len(pages),
            )

        except Exception as exc:
            logger.error("PDF OCR failed: %s", exc)
            return OCRResult(text="", confidence=0.0)

    def extract_from_base64(self, b64_string: str, mime_type: str) -> OCRResult:
        raw = base64.b64decode(b64_string)
        if "pdf" in mime_type.lower():
            return self.extract_from_pdf_bytes(raw)
        return self.extract_from_image_bytes(raw)

    @staticmethod
    def _preprocess(image: "Image.Image") -> "Image.Image":
        # Greyscale convert — color processing skip pannurom
        image = image.convert("L")
        # OPTIMIZED: perusa irundha image resize panna — OCR faster aagum
        w, h = image.size
        if w > 2000 or h > 2000:
            ratio = min(2000 / w, 2000 / h)
            image = image.resize(
                (int(w * ratio), int(h * ratio)),
                Image.LANCZOS
            )
        return image

    @staticmethod
    def _calc_confidence(data: dict) -> float:
        confs = [
            c for c, t in zip(data["conf"], data["text"])
            if t.strip() and c != -1
        ]
        if not confs:
            return 0.0
        return round(sum(confs) / len(confs) / 100, 3)

    @staticmethod
    def _unavailable_result() -> OCRResult:
        return OCRResult(
            text="[OCR not available — install pytesseract and Tesseract]",
            confidence=0.0,
        )


_ocr_instance: Optional[OCRService] = None


def get_ocr_service() -> OCRService:
    global _ocr_instance
    if _ocr_instance is None:
        _ocr_instance = OCRService()
    return _ocr_instance
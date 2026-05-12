# ML Models Directory

## Models Used

### 1. spaCy — `en_core_web_sm`
- **Type**: Pre-trained English NER model
- **Download**: `python -m spacy download en_core_web_sm`
- **Used for**: Person names, locations, organisations, dates
- **Size**: ~12 MB

### 2. Tesseract OCR
- **Type**: LSTM-based OCR engine
- **Install**: System package (`tesseract-ocr` + `tesseract-ocr-hin`)
- **Used for**: Text extraction from images and PDFs
- **Languages**: English + Hindi (`eng+hin`)

### 3. OpenAI Whisper — `base` model
- **Type**: Transformer-based speech recognition
- **Download**: Auto-downloads on first use via `openai-whisper` pip package
- **Used for**: Audio text transcription
- **Size**: ~139 MB (base model)
- **Upgrade**: Change `"base"` to `"small"` or `"medium"` in `speech_service.py` for better accuracy

## Custom Fine-tuning (Optional)

To fine-tune the NER model on Indian government documents:

```python
import spacy
nlp = spacy.load("en_core_web_sm")
# Add training examples with AADHAAR, PAN etc. labels
# Run: python -m spacy train config.cfg --output ./output
```

Place fine-tuned model files in: `ml_models/custom_ner/`

## Regex Engine
All Indian PII regex patterns live in:
`backend/app/utils/regex_patterns.py`

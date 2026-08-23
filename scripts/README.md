parse_cas_and_call_llm.py

Local test harness for CAS parsing.

Usage (local heuristic parse — no external dependencies required):

```bash
python scripts/parse_cas_and_call_llm.py --local scripts/sample_extracted.txt
```

This prints JSON matching the schema you requested.

Notes:
- To enable OCR fallback for real PDFs, install system `tesseract` and `poppler` and the Python packages in `scripts/requirements.txt`, then extend the script to call `extract_text_pdfplumber` and `extract_text_ocr` paths.
- To wire to an LLM, set `LLM_API_URL` and `LLM_API_KEY` and implement `call_llm()` accordingly (the script currently prints a message in non-local mode).
# Phase 2 AI (Design Only)

Goal: Define the AI extraction shape and prompt strategy so Phase 3 can implement it cleanly.

## 1) Extraction JSON Schema

consistent JSON response format for all templates.

Example output:

```json
{
  "extractions": [
    { "field": "Invoice Number", "value": "INV-4432", "confidence": 0.92 },
    { "field": "Invoice Date", "value": "2025-01-14", "confidence": 0.88 },
    { "field": "Total Amount", "value": "1250.00", "confidence": 0.91 }
  ]
}
```

Rules:

- Always return the same keys: `field`, `value`, `confidence`.
- `confidence` is a float between 0.0 and 1.0.
- If a field is not found, return an empty string and low confidence (e.g., 0.0–0.2).

## 2) Reusable Prompt Template

our prompt structure will be for all templates. The only dynamic parts are:

- The list of fields for the selected template
- The OCR text

Prompt (template):

```
You are an information extraction system.
Extract ONLY the fields listed below from the OCR text.
Return JSON ONLY in the exact format specified.

Fields:
- {FIELD_1}
- {FIELD_2}
- {FIELD_3}

OCR Text:
""" {OCR_TEXT} """

Return JSON in this exact format:
{
  "extractions": [
    {"field": "{FIELD_1}", "value": "", "confidence": 0.0},
    {"field": "{FIELD_2}", "value": "", "confidence": 0.0},
    {"field": "{FIELD_3}", "value": "", "confidence": 0.0}
  ]
}
```

Notes:

- This same prompt works for invoices, passports, IDs, etc.
- The field list always comes from the template selected for the document.

## 3) Confidence Scoring (Simple Rules)

Suggested rules:

- Empty value: 0.0
- Looks valid (matches expected pattern): 0.8–0.95
- Ambiguous or partial match: 0.4–0.7

Example patterns:

- Date: `YYYY-MM-DD` or `DD/MM/YYYY`
- Currency: `123.45`, `$123.45`
- ID numbers: alphanumeric sequences of fixed length

## 4) Phase 3 Implementation (for later)

In Phase 3:

- Run OCR → get text
- Load template fields
- Build prompt
- Call LLM
- Parse JSON
- Save extractions to DB

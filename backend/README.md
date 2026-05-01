# AutoDoc.ai backend

FastAPI + SQLAlchemy + Alembic + PostgreSQL.

## Run (dev)

```bash
cd backend
.\venv\Scripts\activate          # Windows / PowerShell
# or: source venv/bin/activate   # macOS/Linux

cp .env.example .env             # fill in real values
alembic upgrade head             # apply migrations
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

The frontend dev server runs on `http://localhost:5173`. Vite proxies `/api/*`
to the backend, so `getApiBaseUrl()` returns `/api` by default.

## OCR (Google Cloud Vision)

OCR is performed by `app/services/ocr.py` using Google Cloud Vision
(`document_text_detection`). Install the Vision client and authenticate:

```bash
pip install -r requirements-google-vision.txt
```

Authentication options (pick one):

* **Service account JSON** — set `GOOGLE_APPLICATION_CREDENTIALS` in
  `backend/.env` to the absolute path of a service-account file with the
  Vision API enabled. Optionally set `GOOGLE_VISION_QUOTA_PROJECT_ID`.
* **Local dev shortcut** — run `gcloud auth application-default login` once;
  the Vision client will pick the credentials up automatically.

PDFs with selectable text skip OCR (controlled by
`PDF_EMBEDDED_MIN_CHARS_TO_SKIP_OCR`); image-only pages and raster uploads
are sent to Vision. See `.env.example` for all OCR tuning knobs.

## Template Builder pipeline (Super Admin)

The Super Admin page **`/super/templates-ai/builder`** is the single source of
truth for templates. There are no seed-only templates — every template
including its prompts and fields is stored in PostgreSQL and editable
through the UI.

### Tables

* `templates` — see `app/models/template.py`. Holds `template_key` (unique
  human-readable id), name, description, document type, language, status,
  version, audit (`created_by`, `updated_at`), the AI prompt blocks
  (`system_prompt`, `extraction_instructions`, `output_format_rules`,
  `json_output_template`, `edge_case_handling_rules`), and per-template LLM
  overrides (`llm_model`, `llm_temperature`, `llm_max_tokens`).
* `fields` — see `app/models/field.py`. Belongs to a template; carries
  `name` (output JSON key), `label` (display label), `field_type`,
  `required`, `extraction_prompt`, `positioning_hint`, `format_hint`,
  `example_value`, `field_order`.

### REST endpoints

| Method | Path | Purpose |
| ------ | ---- | ------- |
| GET    | `/templates`                  | List templates visible to the caller |
| GET    | `/templates/{id}`             | Lightweight read |
| GET    | `/templates/{id}/full`        | Full payload for the builder UI (template + fields + AI config) |
| POST   | `/templates/builder`          | Create from the builder UI |
| PUT    | `/templates/{id}/builder`     | Replace from the builder UI |
| POST   | `/templates/upload`           | Import a `.json` file produced by the builder (or by hand) |
| POST   | `/templates/{id}/generate`    | Compile prompts + run the LLM (used by the "Test" button) |
| DELETE | `/templates/{id}`             | Delete a template (cascades to fields) |
| POST   | `/templates`                  | Legacy create — kept for the existing enterprise UIs |
| PUT    | `/templates/{id}`             | Legacy update — kept for the existing enterprise UIs |

Permissions are enforced through `require_template_management`:
super admins can manage everything, enterprise admins can only manage
templates that belong to their own client (and their plan must allow it).

### LLM integration

* `app/services/llm_extraction.py` builds the chat message from the template's
  prompt blocks (with `{{ variable }}` interpolation), calls OpenAI, and parses
  the JSON response.
* `app/services/extraction_context.py` is the single source of truth used by
  the document-processing pipeline; it loads the template + fields + prompts
  for an uploaded document.
* `generate_from_template(...)` is invoked by `POST /templates/{id}/generate`
  so the Super Admin can validate prompts straight from the builder, with no
  PDF upload required.
* OPENAI_API_KEY / OPENAI_MODEL come from `.env` (see `.env.example`); each
  template can override the model/temperature/max_tokens.

### End-to-end SaaS flow

1. Super Admin opens `/super/templates-ai/builder`, fills the form,
   defines fields and prompts, and clicks **Create AI Template**.
2. The backend stores the template (`templates` row + N `fields` rows + AI
   config columns), assigns a unique `template_key` (slug from the name if
   none provided), and returns the full builder payload.
3. Tenants then call `POST /documents/upload` with their PDF and the
   `template_id`. The processing pipeline (`run_document_processing`) runs
   OCR and reuses the template's prompts to extract structured JSON.
4. Tenants fetch the result through `GET /documents/{id}/extractions/summary`.

The Super Admin can edit, delete, duplicate, import, export, and **live-test**
templates from the same UI, without ever touching seeds.

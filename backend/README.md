Backend service for Senior Project

### Setup

- **Create/activate venv**: use your preferred Python venv (there is a local `.venv312/` in this folder)
- **Install dependencies**: this backend uses Google Cloud Vision for OCR

```bash
pip install -r requirements-google-vision.txt
```

### OCR authentication (Google Cloud Vision)

- **Service account JSON**: set `GOOGLE_APPLICATION_CREDENTIALS` to your service account file path
- **Local dev alternative**: `gcloud auth application-default login`

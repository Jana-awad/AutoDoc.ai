# Run frontend + backend (dev)

## 1. Start the backend (required first)

From the project root:

```bash
cd AutoDoc.ai/backend
.\venv\Scripts\activate
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Leave this terminal open. You should see: `Uvicorn running on http://127.0.0.1:8000`.

- **404 on `/api/v1/business/...`** usually means this backend wasn’t restarted after adding the business dashboard routes. Stop it (Ctrl+C) and start it again with the command above.

## 2. Start the frontend

In a **second** terminal:

```bash
cd AutoDoc.ai/frontend
npm install
npm run dev
```

Open: **http://localhost:5173**

## 3. About the errors you might see

- **wallet-config 401** – Comes from a browser extension (e.g. crypto wallet), not from this app. Safe to ignore, or disable the extension on localhost.
- **404 on `/api/v1/business/dashboard/*` or `/api/v1/business/profile`** – The backend is either not running or was started before the business dashboard API was added. Restart the backend (step 1).

/**
 * Frontend API client for the document-processing pipeline.
 *
 * The same backend endpoints are used by every tenant role (business_admin,
 * enterprise_admin, regular user). Permissions are enforced server-side based
 * on the JWT (role + client_id), so the same UI code works for everyone.
 */
import { getApiBaseUrl } from "../api/config";
import { notifySessionExpired } from "../context/AuthContext";

const API_BASE = `${getApiBaseUrl()}/documents`;

const buildHeaders = (token, extra = {}) => {
  const h = { Accept: "application/json", ...extra };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
};

const parseError = async (response) => {
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    /* not JSON */
  }
  const detail = payload?.detail ?? payload?.message ?? payload?.error;
  const msg = Array.isArray(detail)
    ? detail.map((d) => d?.msg || d).join(", ")
    : detail;
  if (response.status === 401) {
    notifySessionExpired("api-401");
    const error = new Error("Your session has expired. Please log in again.");
    error.status = 401;
    error.payload = payload;
    return error;
  }
  const error = new Error(msg || `Request failed: ${response.status}`);
  error.status = response.status;
  error.payload = payload;
  return error;
};

const guardToken = (token) => {
  if (token === null || token === undefined) {
    notifySessionExpired("missing-token");
    const error = new Error("Your session has expired. Please log in again.");
    error.status = 401;
    throw error;
  }
};

const requestJson = async (path, { method = "GET", token, body, signal } = {}) => {
  guardToken(token);
  const init = {
    method,
    headers: buildHeaders(
      token,
      body !== undefined ? { "Content-Type": "application/json" } : {}
    ),
    signal,
  };
  if (body !== undefined) init.body = JSON.stringify(body);
  const response = await fetch(path, init);
  if (!response.ok) throw await parseError(response);
  if (response.status === 204) return null;
  return response.json();
};

/**
 * List documents the calling user is allowed to see.
 */
export const fetchDocuments = ({ token, signal } = {}) =>
  requestJson(API_BASE, { token, signal });

export const fetchDocument = (id, { token, signal } = {}) =>
  requestJson(`${API_BASE}/${id}`, { token, signal });

/**
 * Upload a PDF and tie it to a template. Returns the created document row.
 *
 * @param {object} args
 * @param {File}   args.file        - PDF / image file picked by the user.
 * @param {number} args.templateId  - Existing template id from /templates.
 * @param {number} [args.clientId]  - Required for super_admin uploads only.
 *                                    Tenants don't pass this; the backend uses
 *                                    their own client_id from the JWT.
 * @param {string} [args.token]
 * @param {AbortSignal} [args.signal]
 */
export const uploadDocument = async ({ file, templateId, clientId, token, signal } = {}) => {
  if (!file) throw new Error("Choose a file to upload");
  if (templateId == null) throw new Error("Pick a template before uploading");
  guardToken(token);
  const form = new FormData();
  form.append("file", file);
  form.append("template_id", String(templateId));
  if (clientId != null) form.append("client_id", String(clientId));
  const response = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    headers: buildHeaders(token),
    body: form,
    signal,
  });
  if (!response.ok) throw await parseError(response);
  return response.json();
};

/**
 * Run the OCR + LLM pipeline on a document. Returns the new status and the
 * count of extractions stored.
 */
export const processDocument = (id, { token, signal } = {}) =>
  requestJson(`${API_BASE}/${id}/process`, { method: "POST", token, signal });

/**
 * Re-run the pipeline (used to re-extract after fixing the template).
 */
export const reprocessDocument = (id, { token, signal } = {}) =>
  requestJson(`${API_BASE}/${id}/reprocess`, { method: "PUT", token, signal });

/**
 * Compact JSON keyed by field name (the production output the SaaS returns).
 */
export const fetchDocumentSummary = (id, { token, signal } = {}) =>
  requestJson(`${API_BASE}/${id}/extractions/summary`, { token, signal });

/**
 * Detailed per-field extraction with confidence scores and labels.
 */
export const fetchDocumentExtractions = (id, { token, signal } = {}) =>
  requestJson(`${API_BASE}/${id}/extractions`, { token, signal });

export const deleteDocument = (id, { token, signal } = {}) =>
  requestJson(`${API_BASE}/${id}`, { method: "DELETE", token, signal });

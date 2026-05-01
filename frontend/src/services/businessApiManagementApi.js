/**
 * Business API Management - central service for API keys, webhooks, logs, usage, health, security.
 * Same shape as enterprise; endpoints expect backend under /api/v1/business/api
 */
import { notifySessionExpired } from "../context/AuthContext";

const BASE = `${(import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "")}/api/v1/business/api`;

const buildHeaders = (token, extra = {}) => {
  const headers = { "Content-Type": "application/json", ...extra };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

const normalizePayload = (payload) => {
  if (payload && typeof payload === "object" && "data" in payload) return payload.data;
  return payload ?? null;
};

const fetchJson = async (path, { token, signal, method = "GET", body } = {}) => {
  const response = await fetch(path, {
    method,
    headers: buildHeaders(token),
    signal,
    ...(body != null && { body: JSON.stringify(body) }),
  });
  if (response.status === 401) {
    notifySessionExpired("unauthorized");
  }
  if (!response.ok) {
    const err = new Error(`Request failed: ${response.status}`);
    err.status = response.status;
    throw err;
  }
  if (response.status === 204) return null;
  const payload = await response.json().catch(() => null);
  return normalizePayload(payload);
};

const queryString = (params) => {
  const search = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v != null && v !== "") search.set(k, String(v));
  });
  const s = search.toString();
  return s ? `?${s}` : "";
};

/* API Keys */
export const fetchApiKeys = ({ token, signal } = {}) =>
  fetchJson(`${BASE}/keys`, { token, signal });

export const createApiKey = ({ token, signal, name, environment } = {}) =>
  fetchJson(`${BASE}/keys`, { token, signal, method: "POST", body: { name, environment } });

export const revokeApiKey = ({ token, signal, keyId } = {}) =>
  fetchJson(`${BASE}/keys/${encodeURIComponent(keyId)}/revoke`, { token, signal, method: "POST" });

export const rotateApiKey = ({ token, signal, keyId } = {}) =>
  fetchJson(`${BASE}/keys/${encodeURIComponent(keyId)}/rotate`, { token, signal, method: "POST" });

/* Webhook */
export const fetchWebhookConfig = ({ token, signal } = {}) =>
  fetchJson(`${BASE}/webhook`, { token, signal });

export const saveWebhookConfig = ({ token, signal, url, enabled, events } = {}) =>
  fetchJson(`${BASE}/webhook`, {
    token,
    signal,
    method: "PUT",
    body: { url: url || null, enabled: Boolean(enabled), events: events || [] },
  });

export const validateWebhook = ({ token, signal, url } = {}) =>
  fetchJson(`${BASE}/webhook/validate`, {
    token,
    signal,
    method: "POST",
    body: { url },
  });

/* Request logs */
export const fetchRequestLogs = ({ token, signal, search, status, page = 1, perPage = 20 } = {}) =>
  fetchJson(
    `${BASE}/logs${queryString({ search, status, page, per_page: perPage })}`,
    { token, signal }
  );

export const getRequestLogsExportUrl = ({ format = "csv", search, status } = {}) =>
  `${BASE}/logs/export${queryString({ format, search, status })}`;

export const downloadRequestLogs = async ({ token, signal, format = "csv", search, status } = {}) => {
  const url = getRequestLogsExportUrl({ format, search, status });
  const response = await fetch(url, { headers: buildHeaders(token), signal });
  if (response.status === 401) {
    notifySessionExpired("unauthorized");
  }
  if (!response.ok) throw new Error(`Export failed: ${response.status}`);
  return response.blob();
};

/* Usage analytics */
export const fetchApiUsage = ({ token, signal, period = "24h" } = {}) =>
  fetchJson(`${BASE}/usage${queryString({ period })}`, { token, signal });

/* Rate limiting */
export const fetchRateLimits = ({ token, signal } = {}) =>
  fetchJson(`${BASE}/rate-limits`, { token, signal });

/* Health */
export const fetchApiHealth = ({ token, signal } = {}) =>
  fetchJson(`${BASE}/health`, { token, signal });

/* Security & compliance */
export const fetchApiSecurity = ({ token, signal } = {}) =>
  fetchJson(`${BASE}/security`, { token, signal });

export const fetchKeyAuditLog = ({ token, signal, limit = 50 } = {}) =>
  fetchJson(`${BASE}/security/key-audit?limit=${limit}`, { token, signal });

export const fetchWebhookDeliveries = ({ token, signal, limit = 20 } = {}) =>
  fetchJson(`${BASE}/security/webhook-deliveries?limit=${limit}`, { token, signal });

/* Support */
export const fetchApiSupport = ({ token, signal } = {}) =>
  fetchJson(`${BASE}/support`, { token, signal });

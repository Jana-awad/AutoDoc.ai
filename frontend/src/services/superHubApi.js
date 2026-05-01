import { getApiBaseUrl } from "../api/config";
import { notifySessionExpired } from "../context/AuthContext";

const BASE = `${getApiBaseUrl()}/super`;

const headers = (token, extra = {}) => {
  const h = { Accept: "application/json", ...extra };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
};

const parseError = async (response) => {
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    /* ignore */
  }
  const detail = payload?.detail ?? payload?.message ?? payload?.error;
  const message = Array.isArray(detail)
    ? detail.map((d) => d?.msg || d).join(", ")
    : detail;
  if (response.status === 401) {
    notifySessionExpired("api-401");
    throw new Error("Your session has expired. Please log in again.");
  }
  const err = new Error(message || `Request failed: ${response.status}`);
  err.status = response.status;
  throw err;
};

const requestJson = async (path, { token, method = "GET", body, signal } = {}) => {
  if (token === null || token === undefined) {
    notifySessionExpired("missing-token");
    throw new Error("Your session has expired. Please log in again.");
  }
  const init = {
    method,
    headers: headers(token, body != null ? { "Content-Type": "application/json" } : {}),
    signal,
  };
  if (body != null) init.body = JSON.stringify(body);
  const response = await fetch(`${BASE}${path}`, init);
  if (!response.ok) throw await parseError(response);
  if (response.status === 204) return null;
  return response.json();
};

export function fetchDashboardBundle({ token, signal } = {}) {
  return requestJson("/dashboard-bundle", { token, signal });
}

export function fetchMonitoringStatus({ token, signal } = {}) {
  return requestJson("/monitoring-status", { token, signal });
}

export function fetchPlatformConfig({ token, signal } = {}) {
  return requestJson("/platform-config", { token, signal });
}

export function patchPlatformConfig({ token, body, signal } = {}) {
  return requestJson("/platform-config", { token, method: "PATCH", body, signal });
}

export function fetchSuperActivity({ token, params = {}, signal } = {}) {
  const q = new URLSearchParams();
  if (params.limit) q.set("limit", String(params.limit));
  if (params.client_id != null) q.set("client_id", String(params.client_id));
  if (params.from) q.set("from", params.from);
  if (params.to) q.set("to", params.to);
  const s = q.toString();
  return requestJson(`/activity${s ? `?${s}` : ""}`, { token, signal });
}

export function fetchClient360({ token, clientId, signal } = {}) {
  return requestJson(`/clients/${encodeURIComponent(clientId)}/360`, { token, signal });
}

export function fetchTemplateHealth({ token, signal } = {}) {
  return requestJson("/template-health", { token, signal });
}

export function fetchPipelineDiagnostics({ token, limit = 40, signal } = {}) {
  return requestJson(`/pipeline-diagnostics?limit=${limit}`, { token, signal });
}

export function fetchPaymentsReconciliation({ token, signal } = {}) {
  return requestJson("/payments-reconciliation", { token, signal });
}

export function fetchWebhooksSummary({ token, signal } = {}) {
  return requestJson("/webhooks-summary", { token, signal });
}

export function fetchOnboardingChecklist({ token, signal } = {}) {
  return requestJson("/onboarding-checklist", { token, signal });
}

export async function downloadClientsCsv({ token, signal } = {}) {
  const response = await fetch(`${BASE}/export/clients.csv`, {
    headers: headers(token),
    signal,
  });
  if (!response.ok) throw await parseError(response);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "clients_export.csv";
  a.click();
  URL.revokeObjectURL(url);
}

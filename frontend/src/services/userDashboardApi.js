import { getApiBaseUrl } from "../api/config";

const apiRoot = () => getApiBaseUrl().replace(/\/$/, "");

const authHeaders = (token, extra = {}) => {
  const h = { ...extra };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
};

async function throwApiError(response) {
  const payload = await response.json().catch(() => null);
  const detail = payload?.detail ?? payload?.message ?? payload?.error;
  const message = Array.isArray(detail)
    ? detail.map((item) => (typeof item === "object" ? item?.msg || JSON.stringify(item) : item)).join(", ")
    : typeof detail === "string"
      ? detail
      : detail != null
        ? JSON.stringify(detail)
        : `Request failed (${response.status})`;
  const err = new Error(message);
  err.status = response.status;
  err.payload = payload;
  throw err;
}

export async function fetchUserProfile({ token, signal } = {}) {
  const response = await fetch(`${apiRoot()}/users/me`, {
    headers: authHeaders(token),
    signal,
  });
  if (!response.ok) await throwApiError(response);
  return response.json();
}

export async function fetchUserKpis({ token, signal } = {}) {
  const response = await fetch(`${apiRoot()}/dashboard/kpis`, {
    headers: authHeaders(token),
    signal,
  });
  if (!response.ok) await throwApiError(response);
  return response.json();
}

export async function fetchUserLogs({ token, signal } = {}) {
  const response = await fetch(`${apiRoot()}/logs`, {
    headers: authHeaders(token),
    signal,
  });
  if (!response.ok) await throwApiError(response);
  return response.json();
}

export async function fetchLogDetail({ token, id, signal } = {}) {
  const response = await fetch(`${apiRoot()}/logs/${encodeURIComponent(id)}`, {
    headers: authHeaders(token),
    signal,
  });
  if (!response.ok) await throwApiError(response);
  return response.json();
}

export async function fetchAccessibleTemplates({ token, signal } = {}) {
  const response = await fetch(`${apiRoot()}/templates/accessible`, {
    headers: authHeaders(token),
    signal,
  });
  if (!response.ok) await throwApiError(response);
  return response.json();
}

export async function submitProcessDocument({ token, templateId, file, signal } = {}) {
  const body = new FormData();
  body.append("template_id", String(templateId));
  body.append("file", file);
  const response = await fetch(`${apiRoot()}/process`, {
    method: "POST",
    headers: authHeaders(token),
    body,
    signal,
  });
  if (!response.ok) await throwApiError(response);
  return response.json();
}

export async function changeUserPassword({ token, currentPassword, newPassword, signal } = {}) {
  const response = await fetch(`${apiRoot()}/users/change-password`, {
    method: "POST",
    headers: authHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    signal,
  });
  if (response.status === 204) return null;
  if (!response.ok) await throwApiError(response);
  return response.json();
}

import { getApiBaseUrl } from "../api/config";
import { notifySessionExpired } from "../context/AuthContext";

const API_BASE = `${getApiBaseUrl()}/v1/business`;

const buildHeaders = (token) => {
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

const normalizePayload = (payload) => {
  if (payload && typeof payload === "object" && "data" in payload) {
    return payload.data;
  }
  return payload ?? null;
};

const requestJson = async (path, { method = "GET", token, signal, body } = {}) => {
  const options = {
    method,
    headers: buildHeaders(token),
    signal,
  };

  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(path, options);
  if (response.status === 204) return null;

  if (response.status === 401) {
    notifySessionExpired("unauthorized");
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const detail = payload?.detail ?? payload?.message ?? payload?.error;
    const message = Array.isArray(detail)
      ? detail.map((item) => item?.msg || item).join(", ")
      : detail;
    const error = new Error(message || `Request failed: ${response.status}`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return normalizePayload(payload);
};

const fetchJson = (path, options) => requestJson(path, { ...options, method: "GET" });

export const fetchBusinessProfile = ({ token, signal } = {}) =>
  fetchJson(`${API_BASE}/profile`, { token, signal });

export const fetchBusinessAccountInfo = ({ token, signal } = {}) =>
  fetchJson(`${API_BASE}/profile/account`, { token, signal });

export const fetchBusinessUsers = ({ token, signal } = {}) =>
  fetchJson(`${API_BASE}/profile/users`, { token, signal });

export const fetchBusinessSettings = ({ token, signal } = {}) =>
  fetchJson(`${API_BASE}/profile/settings`, { token, signal });

export const fetchBusinessBilling = ({ token, signal } = {}) =>
  fetchJson(`${API_BASE}/profile/billing`, { token, signal });

export const fetchBusinessInvoices = ({ token, signal } = {}) =>
  fetchJson(`${API_BASE}/profile/billing/invoices`, { token, signal });

export const fetchBusinessBillingHistory = ({ token, signal } = {}) =>
  fetchJson(`${API_BASE}/profile/billing/history`, { token, signal });

export const clearBusinessBillingHistory = ({ token, signal } = {}) =>
  requestJson(`${API_BASE}/profile/billing/history`, {
    method: "DELETE",
    token,
    signal,
  });

export const updateBusinessAccountInfo = ({ token, signal, data } = {}) =>
  requestJson(`${API_BASE}/profile/account`, {
    method: "PUT",
    token,
    signal,
    body: data,
  });

export const changeBusinessPassword = ({ token, signal, currentPassword, newPassword } = {}) =>
  requestJson(`${API_BASE}/profile/change-password`, {
    method: "POST",
    token,
    signal,
    body: { current_password: currentPassword, new_password: newPassword },
  });

export const createBusinessUser = ({ token, signal, data } = {}) =>
  requestJson(`${API_BASE}/profile/users`, {
    method: "POST",
    token,
    signal,
    body: data,
  });

export const updateBusinessUser = ({ token, signal, userId, data } = {}) =>
  requestJson(`${API_BASE}/profile/users/${userId}`, {
    method: "PATCH",
    token,
    signal,
    body: data,
  });

export const removeBusinessUser = ({ token, signal, userId } = {}) =>
  requestJson(`${API_BASE}/profile/users/${userId}`, {
    method: "DELETE",
    token,
    signal,
  });

export const updateBusinessSettings = ({ token, signal, data } = {}) =>
  requestJson(`${API_BASE}/profile/settings`, {
    method: "PUT",
    token,
    signal,
    body: data,
  });

export const changeBusinessPlan = ({ token, signal, planId } = {}) =>
  requestJson(`${API_BASE}/profile/billing/plan`, {
    method: "POST",
    token,
    signal,
    body: { planId },
  });

export const fetchBusinessMetrics = ({ token, signal } = {}) =>
  fetchJson(`${API_BASE}/dashboard/metrics`, { token, signal });

export const fetchBusinessTopActiveUsers = ({ token, signal } = {}) =>
  fetchJson(`${API_BASE}/dashboard/top-users`, { token, signal });

export const fetchBusinessRecentActivity = ({ token, signal, limit = 8 } = {}) =>
  fetchJson(`${API_BASE}/dashboard/activity?limit=${limit}`, { token, signal });

export const fetchBusinessSystemHealth = ({ token, signal } = {}) =>
  fetchJson(`${API_BASE}/dashboard/system-health`, { token, signal });

export const fetchBusinessAiProcessingAnalytics = ({ token, signal } = {}) =>
  fetchJson(`${API_BASE}/dashboard/ai-analytics`, { token, signal });

export const fetchBusinessTemplateIntelligence = ({ token, signal } = {}) =>
  fetchJson(`${API_BASE}/dashboard/template-intelligence`, { token, signal });

export const fetchBusinessApiUsageMonitoring = ({ token, signal } = {}) =>
  fetchJson(`${API_BASE}/dashboard/api-usage`, { token, signal });

export const fetchBusinessAuditCompliance = ({ token, signal } = {}) =>
  fetchJson(`${API_BASE}/dashboard/audit-log`, { token, signal });

export const fetchBusinessSupportSla = ({ token, signal } = {}) =>
  fetchJson(`${API_BASE}/dashboard/support-sla`, { token, signal });

export const fetchBusinessSecurityAccessOverview = ({ token, signal } = {}) =>
  fetchJson(`${API_BASE}/dashboard/security-overview`, { token, signal });

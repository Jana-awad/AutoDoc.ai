import { getApiBaseUrl } from "../api/config";

const API_BASE = `${getApiBaseUrl()}/v1/enterprise/profile`;

const buildHeaders = (token) => {
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
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
  return payload?.data !== undefined ? payload.data : payload;
};

const fetchJson = (path, options) => requestJson(path, { ...options, method: "GET" });

export const fetchEnterpriseProfile = ({ token, signal } = {}) =>
  fetchJson(`${API_BASE}`, { token, signal });

export const fetchEnterpriseAccountInfo = ({ token, signal } = {}) =>
  fetchJson(`${API_BASE}/account`, { token, signal });

export const fetchEnterpriseUsers = ({ token, signal } = {}) =>
  fetchJson(`${API_BASE}/users`, { token, signal });

export const fetchEnterpriseSettings = ({ token, signal } = {}) =>
  fetchJson(`${API_BASE}/settings`, { token, signal });

export const fetchEnterpriseBilling = ({ token, signal } = {}) =>
  fetchJson(`${API_BASE}/billing`, { token, signal });

export const fetchEnterpriseInvoices = ({ token, signal } = {}) =>
  fetchJson(`${API_BASE}/billing/invoices`, { token, signal });

export const fetchEnterpriseBillingHistory = ({ token, signal } = {}) =>
  fetchJson(`${API_BASE}/billing/history`, { token, signal });

export const clearEnterpriseBillingHistory = ({ token, signal } = {}) =>
  requestJson(`${API_BASE}/billing/history`, { method: "DELETE", token, signal });

export const updateEnterpriseAccountInfo = ({ token, signal, data } = {}) =>
  requestJson(`${API_BASE}/account`, { method: "PUT", token, signal, body: data });

export const changeEnterprisePassword = ({ token, signal, currentPassword, newPassword } = {}) =>
  requestJson(`${API_BASE}/change-password`, {
    method: "POST",
    token,
    signal,
    body: { current_password: currentPassword, new_password: newPassword },
  });

export const createEnterpriseUser = ({ token, signal, data } = {}) =>
  requestJson(`${API_BASE}/users`, { method: "POST", token, signal, body: data });

export const updateEnterpriseUser = ({ token, signal, userId, data } = {}) =>
  requestJson(`${API_BASE}/users/${userId}`, { method: "PATCH", token, signal, body: data });

export const removeEnterpriseUser = ({ token, signal, userId } = {}) =>
  requestJson(`${API_BASE}/users/${userId}`, { method: "DELETE", token, signal });

export const updateEnterpriseSettings = ({ token, signal, data } = {}) =>
  requestJson(`${API_BASE}/settings`, { method: "PUT", token, signal, body: data });

export const changeEnterprisePlan = ({ token, signal, planId } = {}) =>
  requestJson(`${API_BASE}/billing/plan`, { method: "POST", token, signal, body: { planId } });

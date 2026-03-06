import { getApiBaseUrl } from "../api/config";

const API_BASE = getApiBaseUrl();

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
  return payload;
};

const fetchJson = (path, options) => requestJson(path, { ...options, method: "GET" });

/** GET /clients/stats - Super Admin stats for the 4 cards */
export const fetchClientsStats = ({ token, signal } = {}) =>
  fetchJson(`${API_BASE}/clients/stats`, { token, signal });

/** GET /clients - List clients with optional search, plan, status filters */
export const fetchClients = ({ token, signal, search, plan, status } = {}) => {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (plan) params.set("plan", plan);
  if (status) params.set("status", status);
  const qs = params.toString();
  return fetchJson(`${API_BASE}/clients${qs ? `?${qs}` : ""}`, { token, signal });
};

/** GET /clients/:id/details - Full client details for drawer */
export const fetchClientDetails = ({ clientId, token, signal } = {}) =>
  fetchJson(`${API_BASE}/clients/${clientId}/details`, { token, signal });

/** GET /clients/:id/users - Users for a client */
export const fetchClientUsers = ({ clientId, token, signal } = {}) =>
  fetchJson(`${API_BASE}/clients/${clientId}/users`, { token, signal });

/** POST /clients/:id/reset-api-key */
export const resetClientApiKey = ({ clientId, token, signal } = {}) =>
  requestJson(`${API_BASE}/clients/${clientId}/reset-api-key`, {
    method: "POST",
    token,
    signal,
  });

/** POST /clients - Create client */
export const createClient = ({ token, signal, data } = {}) =>
  requestJson(`${API_BASE}/clients`, {
    method: "POST",
    token,
    signal,
    body: data,
  });

/** DELETE /clients/:id - Delete client and all related data */
export const deleteClient = ({ clientId, token, signal } = {}) =>
  requestJson(`${API_BASE}/clients/${clientId}`, {
    method: "DELETE",
    token,
    signal,
  });

/** GET /plans - List plans (for filters and upgrade/downgrade) */
export const fetchPlans = ({ token, signal } = {}) =>
  fetchJson(`${API_BASE}/plans`, { token, signal });

/** POST /subscriptions/change-plan - Change client plan (query: client_id, new_plan_id) */
export const changeClientPlan = ({ token, signal, clientId, newPlanId } = {}) =>
  requestJson(
    `${API_BASE}/subscriptions/change-plan?client_id=${clientId}&new_plan_id=${newPlanId}`,
    { method: "POST", token, signal }
  );

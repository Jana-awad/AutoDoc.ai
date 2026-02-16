const API_BASE = "/api/v1/business";

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

const fetchJson = async (path, { token, signal } = {}) => {
  const response = await fetch(path, {
    method: "GET",
    headers: buildHeaders(token),
    signal,
  });

  if (!response.ok) {
    const error = new Error(`Request failed: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) return null;
  const payload = await response.json().catch(() => null);
  return normalizePayload(payload);
};

export const fetchBusinessProfile = ({ token, signal } = {}) =>
  fetchJson(`${API_BASE}/profile`, { token, signal });

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

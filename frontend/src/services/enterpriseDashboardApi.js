const API_BASE = "/api/v1/enterprise";

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

export const fetchEnterpriseProfile = ({ token, signal } = {}) =>
  fetchJson(`${API_BASE}/profile`, { token, signal });

export const fetchEnterpriseMetrics = ({ token, signal } = {}) =>
  fetchJson(`${API_BASE}/dashboard/metrics`, { token, signal });

export const fetchTopActiveUsers = ({ token, signal } = {}) =>
  fetchJson(`${API_BASE}/dashboard/top-users`, { token, signal });

export const fetchRecentActivity = ({ token, signal, limit = 12 } = {}) =>
  fetchJson(`${API_BASE}/dashboard/activity?limit=${limit}`, { token, signal });

export const fetchSystemHealth = ({ token, signal } = {}) =>
  fetchJson(`${API_BASE}/dashboard/system-health`, { token, signal });

export const fetchAiProcessingAnalytics = ({ token, signal } = {}) =>
  fetchJson(`${API_BASE}/dashboard/ai-analytics`, { token, signal });

export const fetchTemplateIntelligence = ({ token, signal } = {}) =>
  fetchJson(`${API_BASE}/dashboard/template-intelligence`, { token, signal });

export const fetchApiUsageMonitoring = ({ token, signal } = {}) =>
  fetchJson(`${API_BASE}/dashboard/api-usage`, { token, signal });

export const fetchAuditCompliance = ({ token, signal } = {}) =>
  fetchJson(`${API_BASE}/dashboard/audit-log`, { token, signal });

export const fetchSupportSla = ({ token, signal } = {}) =>
  fetchJson(`${API_BASE}/dashboard/support-sla`, { token, signal });

export const fetchSecurityAccessOverview = ({ token, signal } = {}) =>
  fetchJson(`${API_BASE}/dashboard/security-overview`, { token, signal });

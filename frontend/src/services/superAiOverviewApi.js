import { getApiBaseUrl } from "../api/config";
import { notifySessionExpired } from "../context/AuthContext";

const URL = `${getApiBaseUrl()}/super/ai-overview`;

const buildHeaders = (token) => {
  const headers = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
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
    const err = new Error("Your session has expired. Please log in again.");
    err.status = 401;
    throw err;
  }
  const err = new Error(message || `Request failed: ${response.status}`);
  err.status = response.status;
  throw err;
};

/**
 * Super-admin snapshot: OpenAI + Vision OCR env, tenant API keys / webhooks, usage from api_logs + documents.
 * @param {{ token?: string | null, signal?: AbortSignal }} [opts]
 */
export async function fetchSuperAiOverview({ token, signal } = {}) {
  if (token === null || token === undefined) {
    notifySessionExpired("missing-token");
    throw new Error("Your session has expired. Please log in again.");
  }
  const response = await fetch(URL, { headers: buildHeaders(token), signal });
  if (!response.ok) throw await parseError(response);
  return response.json();
}

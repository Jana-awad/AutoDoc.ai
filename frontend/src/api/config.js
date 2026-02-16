/**
 * Backend API base URL.
 * - In dev: use '/api' so Vite proxy forwards to backend (no CORS, correct port).
 * - Set VITE_API_BASE_URL in .env to override (e.g. production or direct backend URL).
 */
export function getApiBaseUrl() {
  const env = import.meta.env.VITE_API_BASE_URL
  if (env && typeof env === 'string' && env.trim() !== '') {
    return env.replace(/\/$/, '') // no trailing slash
  }
  return '/api'
}

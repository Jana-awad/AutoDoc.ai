/**
 * Backend API base URL.
 *
 * Returning a relative '/api' by default keeps the API on the same origin as
 * the page. That works for:
 *   - dev:  Vite proxy forwards /api/* to http://127.0.0.1:8000/* (see vite.config.js)
 *   - prod: the reverse proxy in deploy/ serves https://<host>/api/* from the
 *           same origin as the SPA, so the scheme (http vs https) is inherited
 *           from the page automatically and there is no CORS preflight.
 *
 * Override VITE_API_BASE_URL only when hosting the API on a different origin
 * (e.g. https://api.your-domain.com). Always use https:// in that case to
 * avoid mixed-content blocks when the SPA itself is loaded over HTTPS.
 */
export function getApiBaseUrl() {
  const env = import.meta.env.VITE_API_BASE_URL
  if (env && typeof env === 'string' && env.trim() !== '') {
    return env.replace(/\/$/, '') // no trailing slash
  }
  return '/api'
}

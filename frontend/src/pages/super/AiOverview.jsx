import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  KeyRound,
  Loader2,
  RefreshCw,
  ScanLine,
  Sparkles,
  Webhook,
  Zap,
} from "lucide-react";
import "../../components/variables.css";
import SuperNav from "../../components/SuperNav";
import { useAuth } from "../../context/AuthContext";
import { fetchUserProfile } from "../../services/userDashboardApi";
import { fetchSuperAiOverview } from "../../services/superAiOverviewApi";
import "./AiOverview.css";

/** Example snapshot so the page always renders (demo / offline / API error). */
const PLACEHOLDER_SNAPSHOT = {
  openai: {
    configured: true,
    key_hint: "…x7k2",
    default_model: "gpt-4o-mini",
  },
  ocr: {
    engine: "google_cloud_vision",
    service_account_env_set: true,
    service_account_file_exists: true,
    quota_project_id: "autodoc-demo",
    pdf_ocr_dpi: 300,
    pdf_embedded_min_chars_skip_ocr: 40,
    max_image_edge_px: 2400,
  },
  tenants: {
    total_clients: 14,
    clients_with_programmatic_api_key: 9,
    clients_with_webhook_url: 4,
  },
  usage: {
    api_requests_logged_24h: 1824,
    api_requests_logged_7d: 11208,
    http_2xx_7d: 10542,
    http_4xx_7d: 598,
    http_5xx_7d: 68,
    documents_created_7d: 312,
    documents_completed_7d: 298,
    extractions_created_7d: 2650,
    top_endpoints_7d: [
      { endpoint: "POST /documents", count: 312 },
      { endpoint: "POST /documents/128/process", count: 298 },
      { endpoint: "GET /templates", count: 890 },
      { endpoint: "GET /v1/enterprise/dashboard/metrics", count: 420 },
      { endpoint: "POST /auth/login", count: 156 },
      { endpoint: "GET /users/me", count: 142 },
    ],
  },
};

function StatusDot({ ok, label }) {
  return (
    <span className={`ai-overview-status ${ok ? "ai-overview-status--ok" : "ai-overview-status--bad"}`}>
      <span className="ai-overview-status-dot" aria-hidden />
      {label}
    </span>
  );
}

function AiOverview() {
  const { token } = useAuth();
  const [userName, setUserName] = useState("Super Admin");
  const [userEmail, setUserEmail] = useState("admin@autodoc.ai");
  const [data, setData] = useState(PLACEHOLDER_SNAPSHOT);
  /** `live` = loaded from GET /super/ai-overview; otherwise example numbers stay visible */
  const [source, setSource] = useState("placeholder");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (token == null || token === "") {
      setData(PLACEHOLDER_SNAPSHOT);
      setSource("placeholder");
      return;
    }
    setLoading(true);
    try {
      const json = await fetchSuperAiOverview({ token });
      setData(json);
      setSource("live");
    } catch {
      setData(PLACEHOLDER_SNAPSHOT);
      setSource("placeholder");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (token == null || token === "") return;
    let cancelled = false;
    (async () => {
      try {
        const profile = await fetchUserProfile({ token });
        if (cancelled || !profile) return;
        if (profile.username) setUserName(profile.username);
        if (profile.email) setUserEmail(profile.email);
      } catch {
        /* defaults */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const ocr = data?.ocr;
  const openai = data?.openai;
  const tenants = data?.tenants;
  const usage = data?.usage;

  const visionOk = Boolean(ocr?.service_account_file_exists);
  const visionEnvButMissingFile = Boolean(ocr?.service_account_env_set && !ocr?.service_account_file_exists);

  return (
    <div className="super-ai-overview">
      <SuperNav
        userName={userName}
        userEmail={userEmail}
        onLogout={() => {}}
        onSettings={() => {}}
      />
      <main id="main-content" className="super-ai-overview-main" role="main">
        <div className="super-ai-overview-container">
          <header className="super-ai-overview-header">
            <div className="super-ai-overview-header-icon" aria-hidden>
              <Sparkles size={32} strokeWidth={1.5} />
            </div>
            <h1 className="super-ai-overview-title">AI &amp; platform integrations</h1>
            <p className="super-ai-overview-subtitle">
              Server-side <strong>OpenAI</strong> and <strong>Google Cloud Vision</strong> credentials, tenant{' '}
              <strong>programmatic API keys</strong> and <strong>webhook URLs</strong>, plus request and pipeline usage
              derived from live database signals.
            </p>
          </header>

          <div className="ai-overview-toolbar-top">
            <button type="button" className="ai-overview-retry" onClick={load} disabled={loading}>
              <RefreshCw size={16} className={loading ? "ai-overview-spin" : ""} aria-hidden />
              Refresh
            </button>
          </div>

          {source === "placeholder" ? (
            <div className="ai-overview-banner ai-overview-banner--info" role="status">
              <p>
                Showing <strong>example data</strong> for layout preview. With a super-admin session and running API,
                use <strong>Refresh</strong> to load live OpenAI, Vision OCR, tenant keys, webhooks, and usage.
              </p>
            </div>
          ) : null}

          {loading ? (
            <div className="ai-overview-kpis-loading" aria-busy="true">
              <Loader2 className="ai-overview-spin" size={28} aria-hidden />
              <span>Syncing live integration snapshot…</span>
            </div>
          ) : null}

          <>
              <section className="ai-overview-integrations" aria-label="Platform integrations">
                <h2 className="ai-overview-section-title">LLM &amp; OCR (platform)</h2>
                <p className="ai-overview-section-lede">
                  These power every document pipeline: OCR first, then structured extraction. Values come from the
                  running server environment (<code className="ai-overview-code">backend/.env</code>); keys are never
                  returned in full.
                </p>
                <div className="ai-overview-int-grid">
                  <article className="ai-overview-int-card">
                    <div className="ai-overview-int-head">
                      <Zap size={22} aria-hidden />
                      <h3>OpenAI (LLM)</h3>
                    </div>
                    <StatusDot ok={openai?.configured} label={openai?.configured ? "API key configured" : "Not configured"} />
                    <dl className="ai-overview-dl">
                      <div>
                        <dt>Default model</dt>
                        <dd>{openai?.default_model || "—"}</dd>
                      </div>
                      <div>
                        <dt>Key hint</dt>
                        <dd>{openai?.key_hint || "—"}</dd>
                      </div>
                    </dl>
                    <p className="ai-overview-int-note">
                      Per-template model overrides live in the{' '}
                      <Link to="/super/templates-ai/builder">template builder</Link>.
                    </p>
                  </article>

                  <article className="ai-overview-int-card">
                    <div className="ai-overview-int-head">
                      <ScanLine size={22} aria-hidden />
                      <h3>Google Cloud Vision (OCR)</h3>
                    </div>
                    <StatusDot ok={visionOk} label={visionOk ? "Service account file found" : "Not ready"} />
                    {visionEnvButMissingFile ? (
                      <p className="ai-overview-int-warn" role="status">
                        <code>GOOGLE_APPLICATION_CREDENTIALS</code> is set but the file path is missing or unreadable.
                      </p>
                    ) : null}
                    {!ocr?.service_account_env_set ? (
                      <p className="ai-overview-int-warn" role="status">
                        Set <code>GOOGLE_APPLICATION_CREDENTIALS</code> to your Vision-enabled service account JSON (see{' '}
                        <code>backend/README.md</code>).
                      </p>
                    ) : null}
                    <dl className="ai-overview-dl">
                      <div>
                        <dt>Quota project</dt>
                        <dd>{ocr?.quota_project_id || "—"}</dd>
                      </div>
                      <div>
                        <dt>PDF OCR DPI</dt>
                        <dd>{ocr?.pdf_ocr_dpi ?? "—"}</dd>
                      </div>
                      <div>
                        <dt>Skip OCR if embedded chars ≥</dt>
                        <dd>{ocr?.pdf_embedded_min_chars_skip_ocr ?? "—"}</dd>
                      </div>
                      <div>
                        <dt>Max image edge (px)</dt>
                        <dd>{ocr?.max_image_edge_px ?? "—"}</dd>
                      </div>
                    </dl>
                  </article>

                  <article className="ai-overview-int-card">
                    <div className="ai-overview-int-head">
                      <KeyRound size={22} aria-hidden />
                      <h3>Tenant API keys</h3>
                    </div>
                    <p className="ai-overview-int-lede">
                      Each client can have one <strong>programmatic API key</strong> for server-to-server calls (separate
                      from user JWT login).
                    </p>
                    <dl className="ai-overview-dl">
                      <div>
                        <dt>Clients with key issued</dt>
                        <dd>
                          {tenants?.clients_with_programmatic_api_key ?? 0} / {tenants?.total_clients ?? 0}
                        </dd>
                      </div>
                    </dl>
                    <Link className="ai-overview-cta ai-overview-cta--inline" to="/super/clients-plans">
                      Manage clients &amp; plans
                    </Link>
                  </article>

                  <article className="ai-overview-int-card">
                    <div className="ai-overview-int-head">
                      <Webhook size={22} aria-hidden />
                      <h3>Webhooks</h3>
                    </div>
                    <p className="ai-overview-int-lede">
                      Webhook URLs are stored per tenant in workspace settings (Business / Enterprise profiles). The
                      product UI for URL, validation, and delivery logs lives in each tenant&apos;s{' '}
                      <strong>API &amp; integrations</strong> area.
                    </p>
                    <dl className="ai-overview-dl">
                      <div>
                        <dt>Tenants with webhook URL saved</dt>
                        <dd>{tenants?.clients_with_webhook_url ?? 0}</dd>
                      </div>
                    </dl>
                    <p className="ai-overview-int-note">
                      Super admin does not edit another tenant&apos;s webhook from here — use impersonation or support
                      flows when you add them.
                    </p>
                  </article>
                </div>
              </section>

              <section className="ai-overview-usage" aria-label="Usage and traffic">
                <h2 className="ai-overview-section-title">Usage &amp; traffic</h2>
                <p className="ai-overview-section-lede">
                  HTTP rows come from <code className="ai-overview-code">api_logs</code> (middleware). Document and
                  extraction counts reflect pipeline output in the last 7 days.
                </p>
                <div className="ai-overview-usage-kpis">
                  <article className="ai-overview-kpi">
                    <span className="ai-overview-kpi-label">API requests (24h)</span>
                    <strong className="ai-overview-kpi-value">{usage?.api_requests_logged_24h ?? 0}</strong>
                    <span className="ai-overview-kpi-hint">Logged requests</span>
                  </article>
                  <article className="ai-overview-kpi">
                    <span className="ai-overview-kpi-label">API requests (7d)</span>
                    <strong className="ai-overview-kpi-value">{usage?.api_requests_logged_7d ?? 0}</strong>
                    <span className="ai-overview-kpi-hint">Logged requests</span>
                  </article>
                  <article className="ai-overview-kpi">
                    <span className="ai-overview-kpi-label">2xx / 4xx / 5xx (7d)</span>
                    <strong className="ai-overview-kpi-value ai-overview-kpi-value--compact">
                      {usage?.http_2xx_7d ?? 0}
                      <span className="ai-overview-kpi-sep">/</span>
                      {usage?.http_4xx_7d ?? 0}
                      <span className="ai-overview-kpi-sep">/</span>
                      {usage?.http_5xx_7d ?? 0}
                    </strong>
                    <span className="ai-overview-kpi-hint">From api_logs status codes</span>
                  </article>
                  <article className="ai-overview-kpi">
                    <span className="ai-overview-kpi-label">Documents (7d)</span>
                    <strong className="ai-overview-kpi-value ai-overview-kpi-value--compact">
                      {usage?.documents_created_7d ?? 0}
                      <span className="ai-overview-kpi-sep">↑</span>
                      {usage?.documents_completed_7d ?? 0}
                    </strong>
                    <span className="ai-overview-kpi-hint">Uploaded · completed (done)</span>
                  </article>
                  <article className="ai-overview-kpi">
                    <span className="ai-overview-kpi-label">Extractions (7d)</span>
                    <strong className="ai-overview-kpi-value">{usage?.extractions_created_7d ?? 0}</strong>
                    <span className="ai-overview-kpi-hint">LLM field rows stored</span>
                  </article>
                  <article className="ai-overview-kpi">
                    <span className="ai-overview-kpi-label">Vision env</span>
                    <strong className="ai-overview-kpi-value ai-overview-kpi-value--sm">
                      {visionOk ? "OK" : visionEnvButMissingFile ? "Path" : "Off"}
                    </strong>
                    <span className="ai-overview-kpi-hint">OCR dependency</span>
                  </article>
                </div>

                <div className="ai-overview-table-wrap">
                  <div className="ai-overview-table-cap">
                    <Activity size={18} aria-hidden />
                    <span>Top logged endpoints (7 days)</span>
                  </div>
                  <table className="ai-overview-table">
                    <thead>
                      <tr>
                        <th scope="col">Endpoint</th>
                        <th scope="col" className="ai-overview-th-num">
                          Hits
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(!usage?.top_endpoints_7d || usage.top_endpoints_7d.length === 0) && (
                        <tr>
                          <td colSpan={2} className="ai-overview-table-empty">
                            No API log traffic in the last 7 days yet.
                          </td>
                        </tr>
                      )}
                      {(usage?.top_endpoints_7d || []).map((row) => (
                        <tr key={row.endpoint}>
                          <td>
                            <code className="ai-overview-code ai-overview-code--block">{row.endpoint}</code>
                          </td>
                          <td className="ai-overview-td-num">{row.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <footer className="ai-overview-footnote">
                <p>
                  <strong>Security:</strong> OpenAI and Google credentials stay on the API server only. Tenant
                  programmatic keys can be rotated from <Link to="/super/clients-plans">Clients &amp; plans</Link>.
                  End-user JWT sessions are unrelated to those keys.
                </p>
              </footer>
          </>
        </div>
      </main>
    </div>
  );
}

export default AiOverview;

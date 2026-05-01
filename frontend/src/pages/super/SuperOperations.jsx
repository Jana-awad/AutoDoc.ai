import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SuperNav from "../../components/SuperNav";
import { useAuth } from "../../context/AuthContext";
import {
  downloadClientsCsv,
  fetchOnboardingChecklist,
  fetchPaymentsReconciliation,
  fetchPipelineDiagnostics,
  fetchPlatformConfig,
  fetchSuperActivity,
  fetchTemplateHealth,
  fetchWebhooksSummary,
  patchPlatformConfig,
} from "../../services/superHubApi";
import { fetchUserProfile } from "../../services/userDashboardApi";
import "./superOperations.css";

const TABS = [
  { id: "platform", label: "Platform & flags" },
  { id: "activity", label: "API activity" },
  { id: "templates", label: "Template health" },
  { id: "pipeline", label: "Pipeline failures" },
  { id: "payments", label: "Payments" },
  { id: "webhooks", label: "Webhooks" },
  { id: "onboarding", label: "Deployment checklist" },
  { id: "compliance", label: "Security roadmap" },
];

function SuperOperations() {
  const { token } = useAuth();
  const [userName, setUserName] = useState("Super Admin");
  const [userEmail, setUserEmail] = useState("admin@autodoc.ai");
  const [tab, setTab] = useState("platform");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [platform, setPlatform] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activity, setActivity] = useState([]);
  const [tplHealth, setTplHealth] = useState([]);
  const [pipeline, setPipeline] = useState([]);
  const [payments, setPayments] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  const [checklist, setChecklist] = useState(null);

  const load = useCallback(async () => {
    if (!token) {
      setError("Sign in to use the operations hub.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const results = await Promise.allSettled([
      fetchPlatformConfig({ token }),
      fetchSuperActivity({ token, params: { limit: 80 } }),
      fetchTemplateHealth({ token }),
      fetchPipelineDiagnostics({ token, limit: 50 }),
      fetchPaymentsReconciliation({ token }),
      fetchWebhooksSummary({ token }),
      fetchOnboardingChecklist({ token }),
    ]);
    const [pc, act, th, pipe, pay, wh, ob] = results;
    setPlatform(pc.status === "fulfilled" ? pc.value : null);
    setActivity(act.status === "fulfilled" && Array.isArray(act.value) ? act.value : []);
    setTplHealth(th.status === "fulfilled" && Array.isArray(th.value) ? th.value : []);
    setPipeline(pipe.status === "fulfilled" && Array.isArray(pipe.value) ? pipe.value : []);
    setPayments(pay.status === "fulfilled" && Array.isArray(pay.value) ? pay.value : []);
    setWebhooks(wh.status === "fulfilled" && Array.isArray(wh.value) ? wh.value : []);
    setChecklist(ob.status === "fulfilled" ? ob.value : null);
    const failures = results
      .map((r, i) => (r.status === "rejected" ? TABS[i]?.label || "section" : null))
      .filter(Boolean);
    if (failures.length === results.length) {
      setError(results[0].reason?.message || "Failed to load operations data.");
    } else if (failures.length > 0) {
      setError(`Some sections failed to load: ${failures.join(", ")}. Other tabs are still usable.`);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!token) return;
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

  const savePlatform = async (patch) => {
    if (!token) return;
    setSaving(true);
    try {
      const next = await patchPlatformConfig({ token, body: patch });
      setPlatform(next);
    } catch (e) {
      setError(e.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="super-ops">
      <SuperNav userName={userName} userEmail={userEmail} onLogout={() => {}} onSettings={() => {}} />
      <main id="main-content" className="super-ops-main" role="main">
        <div className="super-ops-container">
          <header className="super-ops-header">
            <h1>Operations hub</h1>
            <p>
              Platform kill switches, LLM governance lists, global API activity, template and pipeline diagnostics,
              billing reconciliation, and webhook coverage. Changes to flags are written to the database and audited.
            </p>
            <div className="super-ops-header-actions">
              <button type="button" className="super-ops-btn" onClick={load} disabled={loading}>
                {loading ? "Loading…" : "Refresh all"}
              </button>
              <button
                type="button"
                className="super-ops-btn super-ops-btn--secondary"
                onClick={() => downloadClientsCsv({ token })}
                disabled={!token}
              >
                Export clients CSV
              </button>
              <Link className="super-ops-btn super-ops-btn--link" to="/super/monitoring">
                Open monitoring
              </Link>
            </div>
          </header>

          {error ? (
            <div className="super-ops-banner super-ops-banner--error" role="alert">
              {error}
            </div>
          ) : null}

          <div className="super-ops-tabs" role="tablist" aria-label="Operations sections">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                className={`super-ops-tab ${tab === t.id ? "active" : ""}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="super-ops-panel">
            {tab === "platform" && (
              <section aria-labelledby="ops-platform-h">
                <h2 id="ops-platform-h">Kill switches &amp; governance</h2>
                {loading || !platform ? (
                  <p className="super-ops-muted">Loading…</p>
                ) : (
                  <div className="super-ops-grid2">
                    <div className="super-ops-card">
                      <h3>Processing &amp; uploads</h3>
                      <label className="super-ops-toggle">
                        <input
                          type="checkbox"
                          checked={platform.document_processing_enabled}
                          onChange={(e) =>
                            savePlatform({ document_processing_enabled: e.target.checked })
                          }
                          disabled={saving}
                        />
                        <span>Document processing enabled (OCR + LLM pipeline)</span>
                      </label>
                      <label className="super-ops-toggle">
                        <input
                          type="checkbox"
                          checked={platform.uploads_paused}
                          onChange={(e) => savePlatform({ uploads_paused: e.target.checked })}
                          disabled={saving}
                        />
                        <span>Pause new uploads (503 on POST /documents/upload)</span>
                      </label>
                    </div>
                    <div className="super-ops-card">
                      <h3>Incident &amp; SLO</h3>
                      <label className="super-ops-field">
                        Incident title
                        <input
                          type="text"
                          defaultValue={platform.incident_title || ""}
                          key={platform.updated_at || "i"}
                          onBlur={(e) => {
                            const v = e.target.value.trim();
                            if (v !== (platform.incident_title || "")) savePlatform({ incident_title: v || null });
                          }}
                          disabled={saving}
                        />
                      </label>
                      <label className="super-ops-field">
                        Incident / status note
                        <textarea
                          rows={3}
                          defaultValue={platform.incident_body || ""}
                          key={(platform.updated_at || "") + "b"}
                          onBlur={(e) => {
                            const v = e.target.value.trim();
                            if (v !== (platform.incident_body || "")) savePlatform({ incident_body: v || null });
                          }}
                          disabled={saving}
                        />
                      </label>
                      <label className="super-ops-field">
                        SLO target (% success)
                        <input
                          type="number"
                          step="0.1"
                          defaultValue={platform.slo_target_percent ?? ""}
                          key={(platform.updated_at || "") + "s"}
                          onBlur={(e) => {
                            const raw = e.target.value.trim();
                            if (!raw) {
                              savePlatform({ slo_target_percent: null });
                              return;
                            }
                            const n = parseFloat(raw);
                            if (!Number.isNaN(n)) savePlatform({ slo_target_percent: n });
                          }}
                          disabled={saving}
                        />
                      </label>
                    </div>
                    <div className="super-ops-card super-ops-card--wide">
                      <h3>LLM allow-list &amp; blocklist (JSON arrays of strings)</h3>
                      <p className="super-ops-muted">
                        When <code>allowed_llm_models</code> is non-empty, only those model names may run. When{" "}
                        <code>blocked_prompt_substrings</code> matches assembled prompt text, extraction aborts.
                      </p>
                      <label className="super-ops-field">
                        allowed_llm_models (JSON array)
                        <textarea
                          rows={2}
                          defaultValue={JSON.stringify(platform.allowed_llm_models || [])}
                          key={(platform.updated_at || "") + "a"}
                          onBlur={(e) => {
                            try {
                              const parsed = JSON.parse(e.target.value);
                              if (Array.isArray(parsed)) savePlatform({ allowed_llm_models: parsed });
                            } catch {
                              setError("allowed_llm_models must be valid JSON array.");
                            }
                          }}
                          disabled={saving}
                        />
                      </label>
                      <label className="super-ops-field">
                        blocked_prompt_substrings (JSON array)
                        <textarea
                          rows={2}
                          defaultValue={JSON.stringify(platform.blocked_prompt_substrings || [])}
                          key={(platform.updated_at || "") + "x"}
                          onBlur={(e) => {
                            try {
                              const parsed = JSON.parse(e.target.value);
                              if (Array.isArray(parsed)) savePlatform({ blocked_prompt_substrings: parsed });
                            } catch {
                              setError("blocked_prompt_substrings must be valid JSON array.");
                            }
                          }}
                          disabled={saving}
                        />
                      </label>
                    </div>
                  </div>
                )}
              </section>
            )}

            {tab === "activity" && (
              <section aria-labelledby="ops-act-h">
                <h2 id="ops-act-h">Recent API requests</h2>
                <p className="super-ops-muted">From <code>api_logs</code> middleware. Filter by client in a future iteration.</p>
                <div className="super-ops-tablewrap">
                  <table className="super-ops-table">
                    <thead>
                      <tr>
                        <th>When</th>
                        <th>Client</th>
                        <th>Message</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activity.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="super-ops-empty">
                            No activity rows.
                          </td>
                        </tr>
                      ) : (
                        activity.map((row) => (
                          <tr key={row.id}>
                            <td>{row.timestamp || "—"}</td>
                            <td>{row.client_id ?? "—"}</td>
                            <td>{row.message}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {tab === "templates" && (
              <section aria-labelledby="ops-tpl-h">
                <h2 id="ops-tpl-h">Template health (7 days)</h2>
                <div className="super-ops-tablewrap">
                  <table className="super-ops-table">
                    <thead>
                      <tr>
                        <th>Template</th>
                        <th>Status</th>
                        <th>Docs 7d</th>
                        <th>Failures</th>
                        <th>Fail %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tplHealth.map((r) => (
                        <tr key={r.id}>
                          <td>
                            <Link to={`/super/templates-ai/builder?edit=${r.id}`}>{r.name}</Link>
                            <div className="super-ops-sub">{r.template_key}</div>
                          </td>
                          <td>{r.status}</td>
                          <td>{r.documents_7d}</td>
                          <td>{r.failures_7d}</td>
                          <td>{r.failure_rate_percent}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {tab === "pipeline" && (
              <section aria-labelledby="ops-pipe-h">
                <h2 id="ops-pipe-h">Failed documents (30 days)</h2>
                <p className="super-ops-muted">
                  No per-row error text in DB yet — correlate with server logs. Document IDs are safe to share with
                  engineering.
                </p>
                <div className="super-ops-tablewrap">
                  <table className="super-ops-table">
                    <thead>
                      <tr>
                        <th>Doc ID</th>
                        <th>Client</th>
                        <th>Template</th>
                        <th>Created</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pipeline.map((r) => (
                        <tr key={r.document_id}>
                          <td>{r.document_id}</td>
                          <td>{r.client_name || r.client_id}</td>
                          <td>{r.template_name || r.template_id || "—"}</td>
                          <td>{r.created_at}</td>
                          <td>
                            <Link className="super-ops-inline" to={`/super/clients/${r.client_id}/lens`}>
                              Lens view
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {tab === "payments" && (
              <section aria-labelledby="ops-pay-h">
                <h2 id="ops-pay-h">Payments reconciliation</h2>
                <div className="super-ops-tablewrap">
                  <table className="super-ops-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Client</th>
                        <th>Subscription</th>
                        <th>Status</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p) => (
                        <tr key={p.id}>
                          <td>{p.id}</td>
                          <td>{p.client_name || p.client_id}</td>
                          <td>{p.subscription_id}</td>
                          <td>{p.status}</td>
                          <td>{p.created_at ? new Date(p.created_at).toLocaleString() : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {tab === "webhooks" && (
              <section aria-labelledby="ops-wh-h">
                <h2 id="ops-wh-h">Webhook URL coverage</h2>
                <p className="super-ops-muted">
                  Derived from <code>clients.settings.webhookUrl</code>. Tenant delivery logs live in Business /
                  Enterprise API consoles when those APIs exist.
                </p>
                <div className="super-ops-tablewrap">
                  <table className="super-ops-table">
                    <thead>
                      <tr>
                        <th>Client</th>
                        <th>Configured</th>
                      </tr>
                    </thead>
                    <tbody>
                      {webhooks.map((w) => (
                        <tr key={w.client_id}>
                          <td>
                            <Link to={`/super/clients/${w.client_id}/lens`}>{w.client_name}</Link>
                          </td>
                          <td>{w.webhook_configured ? "Yes" : "No"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {tab === "onboarding" && checklist && (
              <section aria-labelledby="ops-onb-h">
                <h2 id="ops-onb-h">Deployment checklist</h2>
                <ul className="super-ops-checklist">
                  {checklist.items.map((it) => (
                    <li key={it.id} className={it.done ? "done" : ""}>
                      <span className="super-ops-check-ico" aria-hidden>
                        {it.done ? "✓" : "○"}
                      </span>
                      {it.label}
                    </li>
                  ))}
                </ul>
                <p className="super-ops-muted">
                  Postgres: {checklist.postgres_ok ? "OK" : "fix"} · OpenAI: {checklist.openai_configured ? "OK" : "fix"}{" "}
                  · Vision: {checklist.vision_configured ? "OK" : "fix"} · Clients: {checklist.has_clients ? "yes" : "no"}{" "}
                  · Active templates: {checklist.has_active_template ? "yes" : "no"}
                </p>
              </section>
            )}

            {tab === "compliance" && (
              <section aria-labelledby="ops-comp-h">
                <h2 id="ops-comp-h">Security &amp; compliance roadmap</h2>
                <div className="super-ops-card super-ops-card--wide">
                  <ul className="super-ops-roadmap">
                    <li>
                      <strong>Admin sessions</strong> — Central session revoke and device list require a token store or
                      IdP integration (not shipped in this build).
                    </li>
                    <li>
                      <strong>2FA / SSO</strong> — Wire super accounts to your enterprise IdP (OIDC/SAML) before
                      production.
                    </li>
                    <li>
                      <strong>GDPR deletion</strong> — Add a reviewed workflow: export → confirm → soft-delete → purge
                      job; log in <code>super_audit_logs</code>.
                    </li>
                    <li>
                      <strong>Impersonation</strong> — Use <Link to="/super/clients-plans">Clients &amp; plans</Link>{" "}
                      and the read-only <em>Tenant lens</em> route for support viewing without tenant JWTs.
                    </li>
                  </ul>
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default SuperOperations;

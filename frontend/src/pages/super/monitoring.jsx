import { useCallback, useEffect, useState } from "react";
import SuperNav from "../../components/SuperNav";
import { useAuth } from "../../context/AuthContext";
import { fetchMonitoringStatus } from "../../services/superHubApi";
import { fetchUserProfile } from "../../services/userDashboardApi";
import "./monitoring.css";

function Monitoring() {
  const { token } = useAuth();
  const [userName, setUserName] = useState("Super Admin");
  const [userEmail, setUserEmail] = useState("admin@autodoc.ai");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!token) {
      setError("Sign in to view monitoring.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const json = await fetchMonitoringStatus({ token });
      setData(json);
    } catch (e) {
      setError(e.message || "Could not load monitoring.");
      setData(null);
    } finally {
      setLoading(false);
    }
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

  const checks = data?.checks || [];
  const platform = data?.platform || {};

  return (
    <div className="super-monitoring">
      <SuperNav
        userName={userName}
        userEmail={userEmail}
        onLogout={() => {}}
        onSettings={() => {}}
      />
      <main id="main-content" className="super-monitoring-main" role="main">
        <div className="super-monitoring-container">
          <header className="super-monitoring-header">
            <h1>Monitoring</h1>
            <p>
              Live dependency checks (database, Redis when configured, upload path, credentials). Use{" "}
              <strong>Operations hub</strong> for kill switches and incident notes.
            </p>
            <button type="button" className="super-monitoring-refresh" onClick={load} disabled={loading}>
              {loading ? "Checking…" : "Re-run checks"}
            </button>
          </header>

          {error ? (
            <div className="super-monitoring-banner super-monitoring-banner--error" role="alert">
              {error}
            </div>
          ) : null}

          <section className="super-monitoring-section" aria-label="Dependency checks">
            <h2 className="super-monitoring-h2">Infrastructure</h2>
            <ul className="super-monitoring-checks">
              {loading && !checks.length ? (
                <li className="super-monitoring-check super-monitoring-check--loading">Running checks…</li>
              ) : null}
              {checks.map((c) => (
                <li key={c.id} className={`super-monitoring-check ${c.ok ? "ok" : "bad"}`}>
                  <span className="super-monitoring-check-dot" aria-hidden />
                  <div>
                    <strong>{c.label}</strong>
                    <span className="super-monitoring-check-detail">{c.detail}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="super-monitoring-section" aria-label="Platform flags snapshot">
            <h2 className="super-monitoring-h2">Platform flags</h2>
            <dl className="super-monitoring-dl">
              <div>
                <dt>Document processing</dt>
                <dd>{platform.document_processing_enabled ? "Enabled" : "Disabled"}</dd>
              </div>
              <div>
                <dt>Uploads</dt>
                <dd>{platform.uploads_paused ? "Paused" : "Accepting uploads"}</dd>
              </div>
              <div>
                <dt>SLO target (%)</dt>
                <dd>{platform.slo_target_percent ?? "—"}</dd>
              </div>
            </dl>
          </section>
        </div>
      </main>
    </div>
  );
}

export default Monitoring;

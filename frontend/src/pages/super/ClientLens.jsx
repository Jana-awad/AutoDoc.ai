import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import SuperNav from "../../components/SuperNav";
import { useAuth } from "../../context/AuthContext";
import { fetchClient360 } from "../../services/superHubApi";
import { fetchUserProfile } from "../../services/userDashboardApi";
import "./clientLens.css";

function ClientLens() {
  const { clientId } = useParams();
  const { token } = useAuth();
  const [userName, setUserName] = useState("Super Admin");
  const [userEmail, setUserEmail] = useState("admin@autodoc.ai");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!token || !clientId) return;
    setLoading(true);
    setError(null);
    try {
      const json = await fetchClient360({ token, clientId });
      setData(json);
    } catch (e) {
      setError(e.message || "Could not load tenant snapshot.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [token, clientId]);

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

  const c = data?.client;

  return (
    <div className="client-lens">
      <SuperNav userName={userName} userEmail={userEmail} onLogout={() => {}} onSettings={() => {}} />
      <div className="client-lens-banner" role="status">
        <strong>Read-only tenant lens</strong> — You are still authenticated as super admin. No tenant JWT is issued;
        this view loads aggregated data only.
      </div>
      <main id="main-content" className="client-lens-main" role="main">
        <div className="client-lens-container">
          <header className="client-lens-header">
            <h1>{c?.name || "Client"}</h1>
            <p>
              Client ID {clientId} ·{" "}
              <Link className="client-lens-link" to="/super/clients-plans">
                Back to directory
              </Link>
            </p>
          </header>

          {error ? (
            <div className="client-lens-error" role="alert">
              {error}
            </div>
          ) : null}
          {loading ? <p className="client-lens-muted">Loading snapshot…</p> : null}

          {!loading && data && (
            <>
              <section className="client-lens-section" aria-label="Documents">
                <h2>Documents</h2>
                <dl className="client-lens-dl">
                  <div>
                    <dt>Total</dt>
                    <dd>{data.documents?.total ?? 0}</dd>
                  </div>
                  <div>
                    <dt>Completed</dt>
                    <dd>{data.documents?.completed ?? 0}</dd>
                  </div>
                  <div>
                    <dt>Failed</dt>
                    <dd>{data.documents?.failed ?? 0}</dd>
                  </div>
                </dl>
              </section>

              <section className="client-lens-section" aria-label="Webhook">
                <h2>Webhook</h2>
                <p>
                  Configured: <strong>{data.webhook?.configured ? "Yes" : "No"}</strong>
                  {data.webhook?.url_hint ? (
                    <>
                      {" "}
                      · Hint: <code>{data.webhook.url_hint}</code>
                    </>
                  ) : null}
                </p>
              </section>

              <section className="client-lens-section" aria-label="Subscriptions">
                <h2>Subscription history</h2>
                <div className="client-lens-tablewrap">
                  <table className="client-lens-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Plan</th>
                        <th>Status</th>
                        <th>End</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.subscriptions || []).length === 0 ? (
                        <tr>
                          <td colSpan={4} className="client-lens-empty">
                            No subscriptions.
                          </td>
                        </tr>
                      ) : (
                        (data.subscriptions || []).map((s) => (
                          <tr key={s.id}>
                            <td>{s.id}</td>
                            <td>{s.plan_name || "—"}</td>
                            <td>{s.status}</td>
                            <td>{s.end_date || "—"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="client-lens-section" aria-label="Payments">
                <h2>Recent payments</h2>
                <div className="client-lens-tablewrap">
                  <table className="client-lens-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Status</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.payments || []).length === 0 ? (
                        <tr>
                          <td colSpan={3} className="client-lens-empty">
                            No payments.
                          </td>
                        </tr>
                      ) : (
                        (data.payments || []).map((p) => (
                          <tr key={p.id}>
                            <td>{p.id}</td>
                            <td>{p.status}</td>
                            <td>{p.created_at || "—"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default ClientLens;

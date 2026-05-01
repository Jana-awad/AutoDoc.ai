import { useEffect, useState, useCallback } from "react";
import SuperNav from "../../components/SuperNav";
import { useAuth } from "../../context/AuthContext";
import { fetchDashboardBundle } from "../../services/superHubApi";
import { fetchUserProfile } from "../../services/userDashboardApi";
import EDashboardHeader from "./components/EDashboardHeader";
import EMetricsGrid from "./components/EMetricsGrid";
import EUserRanking from "./components/EUserRanking";
import EActivityFeed from "./components/EActivityFeed";
import ESystemHealth from "./components/ESystemHealth";
import EAIProcessingAnalytics from "./components/EAIProcessingAnalytics";
import ETemplateIntelligence from "./components/ETemplateIntelligence";
import ELiveApiUsage from "./components/ELiveApiUsage";
import EAuditCompliance from "./components/EAuditCompliance";
import ESupportSLA from "./components/ESupportSLA";
import ESecurityAccess from "./components/ESecurityAccess";
import "./Sdashboard.css";

function Sdashboard() {
  const { token } = useAuth();
  const [userName, setUserName] = useState("Super Admin");
  const [userEmail, setUserEmail] = useState("admin@autodoc.ai");
  const [keyMetrics, setKeyMetrics] = useState(null);
  const [topClients, setTopClients] = useState(null);
  const [recentActivity, setRecentActivity] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [aiAnalytics, setAiAnalytics] = useState(null);
  const [templateIntel, setTemplateIntel] = useState(null);
  const [liveApiUsage, setLiveApiUsage] = useState(null);
  const [auditLog, setAuditLog] = useState(null);
  const [supportSLA, setSupportSLA] = useState(null);
  const [securityAccess, setSecurityAccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const loadAll = useCallback(async () => {
    if (!token) {
      setError("Sign in to load live dashboard metrics.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const bundle = await fetchDashboardBundle({ token });
      setKeyMetrics(bundle.keyMetrics);
      setTopClients(bundle.topClients);
      setRecentActivity(bundle.recentActivity);
      setSystemHealth(bundle.systemHealth);
      setAiAnalytics(bundle.aiAnalytics);
      setTemplateIntel(bundle.templateIntelligence);
      setLiveApiUsage(bundle.liveApiUsage);
      setAuditLog(bundle.auditLog);
      setSupportSLA(bundle.supportSLA);
      setSecurityAccess(bundle.securityAccess);
    } catch (err) {
      setError(err?.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

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
        /* keep defaults */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(loadAll, 60000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadAll]);

  return (
    <div className="super-dashboard">
      <SuperNav
        userName={userName}
        userEmail={userEmail}
        onLogout={() => {}}
        onSettings={() => {}}
      />
      <main id="main-content" className="super-dashboard-main" role="main">
        <div className="super-dashboard-container">
          <div className="super-dashboard-toolbar">
            <EDashboardHeader
              title="Super Dashboard"
              description="Live metrics from PostgreSQL: documents, API traffic, templates, and platform health."
              userName={userName}
            />
            <div className="super-dashboard-actions">
              <label className="super-dashboard-auto-refresh">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                />
                <span>Auto-refresh</span>
              </label>
              <button
                type="button"
                className="super-dashboard-refresh-btn"
                onClick={loadAll}
                disabled={loading}
              >
                {loading ? "Loading…" : "Refresh"}
              </button>
            </div>
          </div>

          {error && (
            <div className="super-dashboard-error" role="alert">
              {error}
            </div>
          )}

          <section className="super-dashboard-section" aria-label="Key metrics">
            <EMetricsGrid data={keyMetrics} loading={loading} error={error} />
          </section>

          <div className="super-dashboard-grid super-dashboard-grid--two">
            <EUserRanking data={topClients} loading={loading} error={null} />
            <EActivityFeed data={recentActivity} loading={loading} error={null} />
          </div>

          <section className="super-dashboard-section" aria-label="System health">
            <ESystemHealth data={systemHealth} loading={loading} error={null} />
          </section>

          <div className="super-dashboard-grid super-dashboard-grid--three">
            <EAIProcessingAnalytics data={aiAnalytics} loading={loading} error={null} />
            <ETemplateIntelligence data={templateIntel} loading={loading} error={null} />
            <ELiveApiUsage data={liveApiUsage} loading={loading} error={null} />
          </div>

          <div className="super-dashboard-grid super-dashboard-grid--two">
            <EAuditCompliance data={auditLog} loading={loading} error={null} />
            <ESupportSLA data={supportSLA} loading={loading} error={null} />
          </div>

          <section className="super-dashboard-section" aria-label="Security overview">
            <ESecurityAccess data={securityAccess} loading={loading} error={null} />
          </section>
        </div>
      </main>
    </div>
  );
}

export default Sdashboard;

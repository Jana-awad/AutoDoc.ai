import { useEffect, useState, useCallback } from "react";
import SuperNav from "../../components/SuperNav";
import {
  fetchKeyMetrics,
  fetchTopActiveClients,
  fetchRecentActivity,
  fetchSystemHealth,
  fetchAIProcessingAnalytics,
  fetchTemplateIntelligence,
  fetchLiveApiUsage,
  fetchAuditLog,
  fetchSupportSLA,
  fetchSecurityAccess,
  fetchCurrentUser,
} from "../../services/superDashboardService";
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
    setLoading(true);
    setError(null);
    try {
      const [user, metrics, clients, activity, health, ai, templates, apiUsage, audit, support, security] =
        await Promise.all([
          fetchCurrentUser(),
          fetchKeyMetrics(),
          fetchTopActiveClients(),
          fetchRecentActivity(),
          fetchSystemHealth(),
          fetchAIProcessingAnalytics(),
          fetchTemplateIntelligence(),
          fetchLiveApiUsage(),
          fetchAuditLog(),
          fetchSupportSLA(),
          fetchSecurityAccess(),
        ]);
      if (user?.name) setUserName(user.name);
      if (user?.email) setUserEmail(user.email);
      setKeyMetrics(metrics);
      setTopClients(clients);
      setRecentActivity(activity);
      setSystemHealth(health);
      setAiAnalytics(ai);
      setTemplateIntel(templates);
      setLiveApiUsage(apiUsage);
      setAuditLog(audit);
      setSupportSLA(support);
      setSecurityAccess(security);
    } catch (err) {
      setError(err?.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

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
        onSearch={() => {}}
      />
      <main className="super-dashboard-main">
        <div className="super-dashboard-container">
          <div className="super-dashboard-toolbar">
            <EDashboardHeader
              title="Super Dashboard"
              description="Here’s what’s happening across your platform."
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

          <section className="super-dashboard-section">
            <EMetricsGrid data={keyMetrics} loading={loading} error={error} />
          </section>

          <div className="super-dashboard-grid super-dashboard-grid--two">
            <EUserRanking data={topClients} loading={loading} error={null} />
            <EActivityFeed data={recentActivity} loading={loading} error={null} />
          </div>

          <section className="super-dashboard-section">
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

          <section className="super-dashboard-section">
            <ESecurityAccess data={securityAccess} loading={loading} error={null} />
          </section>
        </div>
      </main>
    </div>
  );
}

export default Sdashboard;

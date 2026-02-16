import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchSecurityAccessOverview } from "../services/enterpriseDashboardApi";
import EDashboardCard from "./EDashboardCard";
import { ECardState } from "./EDashboardStates";

function ESecurityAccess() {
  const { token } = useAuth();
  const [security, setSecurity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadSecurity = async (signal) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSecurityAccessOverview({ token, signal });
      setSecurity(data);
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err);
        setSecurity(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    loadSecurity(controller.signal);
    return () => controller.abort();
  }, [token]);

  return (
    <EDashboardCard
      title="Security & Access"
      subtitle="Sessions, roles, and security alerts."
      className="edashboard-card--security"
    >
      {loading && <div className="edashboard-security-skeleton" />}
      {!loading && error && (
        <ECardState
          title="Unable to load security overview"
          message="Security insights are currently unavailable."
          actionLabel="Retry"
          onAction={() => loadSecurity()}
          type="error"
        />
      )}
      {!loading && !error && !security && (
        <ECardState
          title="No security data"
          message="Security metrics will appear once monitoring is enabled."
          type="empty"
        />
      )}
      {!loading && !error && security && (
        <div className="edashboard-security-grid">
          <div className="edashboard-security-metric">
            <span className="edashboard-security-label">Active sessions</span>
            <span className="edashboard-security-value">{security.activeSessions ?? "—"}</span>
          </div>
          <div className="edashboard-security-metric">
            <span className="edashboard-security-label">Role distribution</span>
            <div className="edashboard-security-roles">
              {Array.isArray(security.roleDistribution) &&
                security.roleDistribution.map((role, index) => (
                  <span key={role.role || index} className="edashboard-security-role">
                    {role.role}: {role.count ?? "—"}
                  </span>
                ))}
            </div>
          </div>
          <div className="edashboard-security-metric">
            <span className="edashboard-security-label">Security alerts</span>
            {Array.isArray(security.alerts) && security.alerts.length > 0 ? (
              <ul className="edashboard-security-alerts">
                {security.alerts.map((alert, index) => (
                  <li key={alert.id || index}>{alert.message}</li>
                ))}
              </ul>
            ) : (
              <span className="edashboard-security-empty">No active alerts</span>
            )}
          </div>
        </div>
      )}
    </EDashboardCard>
  );
}

export default ESecurityAccess;

import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchBusinessSecurityAccessOverview } from "../services/businessDashboardApi";
import BDashboardCard from "./BDashboardCard";
import { BCardState } from "./BDashboardStates";

function BSecurityAccess({ refreshKey }) {
  const { token } = useAuth();
  const [security, setSecurity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadSecurity = async (signal) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBusinessSecurityAccessOverview({ token, signal });
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
  }, [token, refreshKey]);

  return (
    <BDashboardCard
      title="Security & Access"
      subtitle="Sessions, roles, and security alerts."
      className="bdashboard-card--security"
    >
      {loading && <div className="bdashboard-security-skeleton" />}
      {!loading && error && (
        <BCardState
          title="Unable to load security overview"
          message="Security insights are currently unavailable."
          actionLabel="Retry"
          onAction={() => loadSecurity()}
          type="error"
        />
      )}
      {!loading && !error && !security && (
        <BCardState
          title="No security data"
          message="Security metrics will appear once monitoring is enabled."
          type="empty"
        />
      )}
      {!loading && !error && security && (
        <div className="bdashboard-security-grid">
          <div className="bdashboard-security-metric">
            <span className="bdashboard-security-label">Active Sessions</span>
            <span className="bdashboard-security-value">{security.activeSessions ?? "—"}</span>
          </div>
          <div className="bdashboard-security-metric">
            <span className="bdashboard-security-label">MFA Adoption</span>
            <span className="bdashboard-security-value">
              {security.mfaAdoption ?? "—"}%
            </span>
          </div>
          <div className="bdashboard-security-metric">
            <span className="bdashboard-security-label">Role Distribution</span>
            <div className="bdashboard-security-roles">
              {Array.isArray(security.roleDistribution) &&
                security.roleDistribution.map((role, index) => (
                  <span key={role.role || index} className="bdashboard-security-role">
                    {role.role}: {role.count ?? "—"}
                  </span>
                ))}
            </div>
          </div>
          <div className="bdashboard-security-metric">
            <span className="bdashboard-security-label">Security Alerts</span>
            {Array.isArray(security.alerts) && security.alerts.length > 0 ? (
              <ul className="bdashboard-security-alerts">
                {security.alerts.map((alert, index) => (
                  <li key={alert.id || index}>{alert.message}</li>
                ))}
              </ul>
            ) : (
              <span className="bdashboard-security-empty">No active alerts</span>
            )}
          </div>
        </div>
      )}
    </BDashboardCard>
  );
}

export default BSecurityAccess;

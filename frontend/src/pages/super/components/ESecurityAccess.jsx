import "./ESecurityAccess.css";
import EDashboardCard from "./EDashboardCard";
import ELoadingSkeleton from "./ELoadingSkeleton";
import EEmptyState from "./EEmptyState";

function ESecurityAccess({ data, loading, error }) {
  if (error) {
    return (
      <EDashboardCard title="Security & Access Overview">
        <div className="e-security-error" role="alert">
          {error}
        </div>
      </EDashboardCard>
    );
  }

  if (loading) {
    return (
      <EDashboardCard title="Security & Access Overview">
        <ELoadingSkeleton variant="card" />
      </EDashboardCard>
    );
  }

  const d = data || {};
  const roles = d.roleDistribution || {};
  const alerts = Array.isArray(d.securityAlerts) ? d.securityAlerts : [];

  return (
    <EDashboardCard title="Security & Access Overview">
      <div className="e-security-grid">
        <div className="e-security-item">
          <span className="e-security-label">Active sessions</span>
          <span className="e-security-value">{d.activeSessions ?? 0}</span>
        </div>
        <div className="e-security-roles">
          <span className="e-security-label">Role distribution</span>
          <ul className="e-security-role-list">
            <li><span>Admin</span> <strong>{roles.admin ?? 0}</strong></li>
            <li><span>Editor</span> <strong>{roles.editor ?? 0}</strong></li>
            <li><span>Viewer</span> <strong>{roles.viewer ?? 0}</strong></li>
          </ul>
        </div>
      </div>
      <div className="e-security-alerts">
        <h4 className="e-security-alerts-title">Security alerts</h4>
        {alerts.length === 0 ? (
          <EEmptyState message="No security alerts" submessage="All clear." />
        ) : (
          <ul className="e-security-alert-list">
            {alerts.map((a, i) => (
              <li key={a.id || i} className={`e-security-alert e-security-alert--${(a.severity || "info").toLowerCase()}`}>
                <span>{a.message || a.title || "Alert"}</span>
                {a.timestamp && <time>{a.timestamp}</time>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </EDashboardCard>
  );
}

export default ESecurityAccess;

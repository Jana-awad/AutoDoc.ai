import "./ESystemHealth.css";
import EDashboardCard from "./EDashboardCard";
import ELoadingSkeleton from "./ELoadingSkeleton";

const statusLabels = {
  operational: "Operational",
  degraded: "Degraded",
  down: "Down",
};

function ESystemHealth({ data, loading, error }) {
  if (error) {
    return (
      <EDashboardCard title="System Health & Status">
        <div className="e-system-health-error" role="alert">
          {error}
        </div>
      </EDashboardCard>
    );
  }

  if (loading) {
    return (
      <EDashboardCard title="System Health & Status">
        <div className="e-system-health-loading">
          <ELoadingSkeleton variant="card" />
        </div>
      </EDashboardCard>
    );
  }

  const d = data || {};
  const apiStatus = (d.apiStatus || "operational").toLowerCase();
  const trend = (d.trend || "neutral").toLowerCase();

  return (
    <EDashboardCard title="System Health & Status">
      <div className="e-system-health-grid">
        <div className={`e-system-health-item e-system-health-status e-system-health-status--${apiStatus}`}>
          <span className="e-system-health-dot" aria-hidden />
          <div>
            <strong>API Status</strong>
            <span>{statusLabels[apiStatus] || d.apiStatus || "Operational"}</span>
          </div>
        </div>
        <div className="e-system-health-item">
          <strong>Error spike</strong>
          <span>{d.errorSpike ? "Yes — review logs" : "None"}</span>
        </div>
        <div className="e-system-health-item">
          <strong>Avg. processing time</strong>
          <span>{d.avgProcessingTimeMs != null ? `${d.avgProcessingTimeMs} ms` : "—"}</span>
        </div>
        <div className={`e-system-health-item e-system-health-trend e-system-health-trend--${trend}`}>
          <strong>Performance trend</strong>
          <span>
            {trend === "up" && "↑ Improving"}
            {trend === "down" && "↓ Degrading"}
            {trend === "neutral" && "→ Stable"}
          </span>
        </div>
      </div>
    </EDashboardCard>
  );
}

export default ESystemHealth;

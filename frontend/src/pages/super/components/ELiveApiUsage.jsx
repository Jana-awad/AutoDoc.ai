import "./ELiveApiUsage.css";
import EDashboardCard from "./EDashboardCard";
import ELoadingSkeleton from "./ELoadingSkeleton";

function ELiveApiUsage({ data, loading, error }) {
  if (error) {
    return (
      <EDashboardCard title="Live API Usage" badge="Live">
        <div className="e-live-api-error" role="alert">
          {error}
        </div>
      </EDashboardCard>
    );
  }

  if (loading) {
    return (
      <EDashboardCard title="Live API Usage" badge="Live">
        <ELoadingSkeleton variant="card" />
      </EDashboardCard>
    );
  }

  const d = data || {};
  return (
    <EDashboardCard title="Live API Usage" badge="Live">
      <div className="e-live-api-grid">
        <div className="e-live-api-item">
          <span className="e-live-api-label">Requests / min</span>
          <span className="e-live-api-value">{d.requestsPerMinute ?? "—"}</span>
        </div>
        <div className="e-live-api-item">
          <span className="e-live-api-label">Success rate</span>
          <span className="e-live-api-value e-live-api-value--success">
            {d.successRate != null ? `${d.successRate}%` : "—"}
          </span>
        </div>
        <div className="e-live-api-item">
          <span className="e-live-api-label">Error rate</span>
          <span className="e-live-api-value e-live-api-value--error">
            {d.errorRate != null ? `${d.errorRate}%` : "—"}
          </span>
        </div>
        <div className="e-live-api-item">
          <span className="e-live-api-label">Throttling</span>
          <span className="e-live-api-value">
            {d.throttlingActive ? "Active" : "Inactive"}
          </span>
        </div>
        {d.unlimitedUsage && (
          <div className="e-live-api-unlimited">
            <span className="e-live-api-badge">Unlimited usage</span>
            <span className="e-live-api-badge-desc">Enterprise plan</span>
          </div>
        )}
      </div>
    </EDashboardCard>
  );
}

export default ELiveApiUsage;

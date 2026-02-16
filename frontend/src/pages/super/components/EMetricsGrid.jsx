import "./EMetricsGrid.css";
import ELoadingSkeleton from "./ELoadingSkeleton";

/**
 * Key metrics cards: documents, success rate, API calls, active users, quota, etc.
 * changePercent: number or null; negative = red, positive = green.
 */
function MetricCard({ label, value, changePercent, suffix = "", unlimited }) {
  const changeUp = changePercent != null && changePercent > 0;
  const changeDown = changePercent != null && changePercent < 0;

  return (
    <div className="e-metric-card">
      <span className="e-metric-label">{label}</span>
      <div className="e-metric-value-row">
        <span className="e-metric-value">
          {unlimited ? "Unlimited" : (value != null ? String(value) : "—")}
          {!unlimited && suffix}
        </span>
        {changePercent != null && !unlimited && (
          <span
            className={`e-metric-change ${changeUp ? "up" : ""} ${changeDown ? "down" : ""}`}
            aria-label={`${changePercent > 0 ? "Up" : "Down"} ${Math.abs(changePercent)}%`}
          >
            {changePercent > 0 ? "↑" : "↓"} {Math.abs(changePercent)}%
          </span>
        )}
      </div>
    </div>
  );
}

function EMetricsGrid({ data, loading, error }) {
  if (error) {
    return (
      <div className="e-metrics-grid-wrap">
        <div className="e-metrics-error" role="alert">
          {error}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="e-metrics-grid">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="e-metric-card e-metric-card-skeleton">
            <ELoadingSkeleton variant="metric" />
          </div>
        ))}
      </div>
    );
  }

  const d = data || {};
  const ch = d.changes || {};

  return (
    <div className="e-metrics-grid">
      <MetricCard
        label="Total Documents Processed"
        value={d.totalDocuments}
        changePercent={ch.totalDocuments}
      />
      <MetricCard
        label="Success Rate"
        value={d.successRate}
        suffix="%"
        changePercent={ch.successRate}
      />
      <MetricCard
        label="API Calls Today"
        value={d.apiCallsToday}
        changePercent={ch.apiCallsToday}
      />
      <MetricCard
        label="Active Users"
        value={d.activeUsers}
        changePercent={ch.activeUsers}
      />
      <MetricCard
        label="Quota"
        value={d.quotaRemaining}
        unlimited={d.quotaUnlimited}
      />
      <MetricCard label="Total Clients" value={d.totalClients} />
      <MetricCard label="Total Templates" value={d.totalTemplates} />
      <MetricCard
        label="Accuracy"
        value={d.accuracyPercent}
        suffix="%"
        changePercent={ch.accuracyPercent}
      />
      <MetricCard label="Failed Documents" value={d.failedDocs} />
    </div>
  );
}

export default EMetricsGrid;

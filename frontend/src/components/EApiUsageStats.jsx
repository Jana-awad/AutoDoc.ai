/**
 * EApiUsageStats - Requests per period, success/failure rate, latency trends, unlimited badge.
 */
import "./EApiUsageStats.css";

function EApiUsageStats({ data = null, loading = false, error = null, onRetry, isUnlimited }) {
  if (loading) {
    return (
      <div className="e-api-usage glass-card">
        <div className="e-api-usage__header">
          <h3 className="e-api-usage__title">API usage analytics</h3>
          <div className="e-api-usage__skeleton e-api-usage__skeleton--bar" />
        </div>
        <div className="e-api-usage__grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="e-api-usage__skeleton e-api-usage__skeleton--card" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="e-api-usage glass-card">
        <h3 className="e-api-usage__title">API usage analytics</h3>
        <div className="e-api-usage__error">
          <p>Unable to load usage data.</p>
          {onRetry && (
            <button type="button" className="e-api-usage__retry" onClick={onRetry}>
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  const stats = data || {};
  const requestsPerMin = stats.requests_per_minute ?? stats.requestsPerMinute ?? "—";
  const requestsPerHour = stats.requests_per_hour ?? stats.requestsPerHour ?? "—";
  const requestsPerDay = stats.requests_per_day ?? stats.requestsPerDay ?? "—";
  const successRate = stats.success_rate ?? stats.successRate;
  const failureRate = stats.failure_rate ?? stats.failureRate;
  const avgLatencyMs = stats.avg_latency_ms ?? stats.avgLatencyMs;
  const latencyTrend = stats.latency_trend ?? stats.latencyTrend;

  return (
    <div className="e-api-usage glass-card">
      <div className="e-api-usage__header">
        <h3 className="e-api-usage__title">API usage analytics</h3>
        {isUnlimited && (
          <span className="e-api-usage__badge">Unlimited · Enterprise</span>
        )}
      </div>
      <p className="e-api-usage__subtitle">
        Requests per minute/hour/day, success vs failure rate, latency trends.
      </p>
      <div className="e-api-usage__grid">
        <div className="e-api-usage__card">
          <span className="e-api-usage__label">Requests / min</span>
          <span className="e-api-usage__value">{formatNum(requestsPerMin)}</span>
        </div>
        <div className="e-api-usage__card">
          <span className="e-api-usage__label">Requests / hour</span>
          <span className="e-api-usage__value">{formatNum(requestsPerHour)}</span>
        </div>
        <div className="e-api-usage__card">
          <span className="e-api-usage__label">Requests / day</span>
          <span className="e-api-usage__value">{formatNum(requestsPerDay)}</span>
        </div>
        <div className="e-api-usage__card">
          <span className="e-api-usage__label">Success rate</span>
          <span className="e-api-usage__value e-api-usage__value--success">
            {successRate != null ? `${Number(successRate).toFixed(1)}%` : "—"}
          </span>
        </div>
        <div className="e-api-usage__card">
          <span className="e-api-usage__label">Failure rate</span>
          <span className="e-api-usage__value e-api-usage__value--failure">
            {failureRate != null ? `${Number(failureRate).toFixed(1)}%` : "—"}
          </span>
        </div>
        <div className="e-api-usage__card">
          <span className="e-api-usage__label">Avg latency</span>
          <span className="e-api-usage__value">
            {avgLatencyMs != null ? `${avgLatencyMs} ms` : "—"}
          </span>
        </div>
      </div>
      {latencyTrend != null && (
        <div className="e-api-usage__trend">
          <span className="e-api-usage__label">Latency trend</span>
          <span className={`e-api-usage__trend-value e-api-usage__trend-value--${latencyTrend}`}>
            {String(latencyTrend)}
          </span>
        </div>
      )}
    </div>
  );
}

function formatNum(v) {
  if (v == null || v === "—") return "—";
  const n = Number(v);
  return isNaN(n) ? String(v) : n.toLocaleString();
}

export default EApiUsageStats;

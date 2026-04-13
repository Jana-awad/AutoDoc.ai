/**
 * ERateLimitPanel - Current limits, throttled count, burst allowance, enterprise unlimited.
 */
import "./ERateLimitPanel.css";

function ERateLimitPanel({ data = null, loading = false, error = null, onRetry, isUnlimited }) {
  if (loading) {
    return (
      <div className="e-rate-limit glass-card">
        <h3 className="e-rate-limit__title">Rate limiting & throttling</h3>
        <div className="e-rate-limit__skeleton" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="e-rate-limit glass-card">
        <h3 className="e-rate-limit__title">Rate limiting & throttling</h3>
        <div className="e-rate-limit__error">
          <p>Unable to load rate limit data.</p>
          {onRetry && (
            <button type="button" className="e-rate-limit__retry" onClick={onRetry}>
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  const limits = data || {};
  const limitPerMin = limits.requests_per_minute ?? limits.requestsPerMinute;
  const limitPerHour = limits.requests_per_hour ?? limits.requestsPerHour;
  const throttledCount = limits.throttled_requests ?? limits.throttledRequests ?? 0;
  const burstAllowance = limits.burst_allowance ?? limits.burstAllowance;

  return (
    <div className="e-rate-limit glass-card">
      <div className="e-rate-limit__header">
        <h3 className="e-rate-limit__title">Rate limiting & throttling</h3>
        {isUnlimited && (
          <span className="e-rate-limit__badge">Unlimited · Enterprise</span>
        )}
      </div>
      <p className="e-rate-limit__subtitle">
        Current limits and throttled request count. Burst allowance for traffic spikes.
      </p>
      <div className="e-rate-limit__grid">
        <div className="e-rate-limit__item">
          <span className="e-rate-limit__label">Limit (per min)</span>
          <span className="e-rate-limit__value">
            {isUnlimited ? "Unlimited" : limitPerMin != null ? formatNum(limitPerMin) : "—"}
          </span>
        </div>
        <div className="e-rate-limit__item">
          <span className="e-rate-limit__label">Limit (per hour)</span>
          <span className="e-rate-limit__value">
            {isUnlimited ? "Unlimited" : limitPerHour != null ? formatNum(limitPerHour) : "—"}
          </span>
        </div>
        <div className="e-rate-limit__item">
          <span className="e-rate-limit__label">Throttled requests</span>
          <span className="e-rate-limit__value e-rate-limit__value--warn">
            {formatNum(throttledCount)}
          </span>
        </div>
        <div className="e-rate-limit__item">
          <span className="e-rate-limit__label">Burst allowance</span>
          <span className="e-rate-limit__value">
            {isUnlimited ? "Unlimited" : burstAllowance != null ? formatNum(burstAllowance) : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}

function formatNum(v) {
  if (v == null) return "—";
  const n = Number(v);
  return isNaN(n) ? String(v) : n.toLocaleString();
}

export default ERateLimitPanel;

/**
 * EApiHealthMonitor - Service status, endpoint availability, error spike, incident alerts.
 */
import "./EApiHealthMonitor.css";

function EApiHealthMonitor({ data = null, loading = false, error = null, onRetry }) {
  if (loading) {
    return (
      <div className="e-api-health glass-card">
        <h3 className="e-api-health__title">API health monitoring</h3>
        <div className="e-api-health__skeleton" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="e-api-health glass-card">
        <h3 className="e-api-health__title">API health monitoring</h3>
        <div className="e-api-health__error">
          <p>Unable to load health status.</p>
          {onRetry && (
            <button type="button" className="e-api-health__retry" onClick={onRetry}>
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  const health = data || {};
  const status = health.status ?? health.overall ?? "unknown";
  const endpoints = health.endpoints ?? [];
  const errorSpike = health.error_spike ?? health.errorSpike ?? false;
  const incident = health.incident ?? health.active_incident ?? null;

  const statusClass =
    status === "healthy" || status === "up"
      ? "e-api-health__status--up"
      : status === "degraded"
      ? "e-api-health__status--degraded"
      : "e-api-health__status--down";

  return (
    <div className="e-api-health glass-card">
      <h3 className="e-api-health__title">API health monitoring</h3>
      <p className="e-api-health__subtitle">
        Service status, endpoint availability, error spike detection, incident alerts.
      </p>
      <div className="e-api-health__overview">
        <div className="e-api-health__status-wrap">
          <span className={`e-api-health__status ${statusClass}`}>
            {String(status).charAt(0).toUpperCase() + String(status).slice(1)}
          </span>
          {errorSpike && (
            <span className="e-api-health__spike">Error spike detected</span>
          )}
        </div>
        {incident && (
          <div className="e-api-health__incident">
            <span className="e-api-health__incident-label">Active incident</span>
            <p className="e-api-health__incident-text">{incident.message || incident.description || "Ongoing investigation."}</p>
            {incident.url && (
              <a href={incident.url} className="e-api-health__incident-link" target="_blank" rel="noopener noreferrer">
                Status page →
              </a>
            )}
          </div>
        )}
      </div>
      {endpoints.length > 0 && (
        <ul className="e-api-health__endpoints">
          {endpoints.map((ep) => (
            <li key={ep.name || ep.endpoint} className="e-api-health__endpoint">
              <span className="e-api-health__endpoint-name">{ep.name || ep.endpoint || "—"}</span>
              <span
                className={`e-api-health__endpoint-dot ${
                  ep.available !== false ? "e-api-health__endpoint-dot--up" : "e-api-health__endpoint-dot--down"
                }`}
                title={ep.available !== false ? "Available" : "Unavailable"}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default EApiHealthMonitor;

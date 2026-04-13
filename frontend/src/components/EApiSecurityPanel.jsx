/**
 * EApiSecurityPanel - IP allowlist/denylist, key usage audit, webhook delivery log, security alerts.
 */
import "./EApiSecurityPanel.css";

function EApiSecurityPanel({
  data = null,
  keyAudit = [],
  webhookDeliveries = [],
  loading = false,
  error = null,
  onRetry,
}) {
  if (loading) {
    return (
      <div className="e-api-security glass-card">
        <h3 className="e-api-security__title">Security & compliance</h3>
        <div className="e-api-security__skeleton" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="e-api-security glass-card">
        <h3 className="e-api-security__title">Security & compliance</h3>
        <div className="e-api-security__error">
          <p>Unable to load security data.</p>
          {onRetry && (
            <button type="button" className="e-api-security__retry" onClick={onRetry}>
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  const security = data || {};
  const ipAllowlist = security.ip_allowlist ?? security.ipAllowlist ?? [];
  const ipDenylist = security.ip_denylist ?? security.ipDenylist ?? [];
  const alerts = security.alerts ?? [];

  return (
    <div className="e-api-security glass-card">
      <h3 className="e-api-security__title">Security & compliance</h3>
      <p className="e-api-security__subtitle">
        IP allowlist/denylist, key usage audit, webhook delivery attempts, security alerts.
      </p>

      {(ipAllowlist.length > 0 || ipDenylist.length > 0) && (
        <div className="e-api-security__section">
          <h4 className="e-api-security__section-title">IP access</h4>
          <div className="e-api-security__ip-grid">
            {ipAllowlist.length > 0 && (
              <div className="e-api-security__ip-list">
                <span className="e-api-security__ip-label">Allowlist</span>
                <ul>
                  {ipAllowlist.slice(0, 5).map((ip) => (
                    <li key={ip}><code>{ip}</code></li>
                  ))}
                </ul>
              </div>
            )}
            {ipDenylist.length > 0 && (
              <div className="e-api-security__ip-list">
                <span className="e-api-security__ip-label">Denylist</span>
                <ul>
                  {ipDenylist.slice(0, 5).map((ip) => (
                    <li key={ip}><code>{ip}</code></li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {alerts.length > 0 && (
        <div className="e-api-security__alerts">
          {alerts.map((alert) => (
            <div key={alert.id || alert.message} className="e-api-security__alert">
              <span className="e-api-security__alert-badge">{alert.severity || "Alert"}</span>
              {alert.message}
            </div>
          ))}
        </div>
      )}

      {keyAudit.length > 0 && (
        <div className="e-api-security__section">
          <h4 className="e-api-security__section-title">Key usage audit (recent)</h4>
          <ul className="e-api-security__audit-list">
            {keyAudit.slice(0, 5).map((entry) => (
              <li key={entry.id || entry.timestamp}>
                <span className="e-api-security__audit-time">{formatTime(entry.timestamp)}</span>
                <span className="e-api-security__audit-action">{entry.action || "—"}</span>
                <span className="e-api-security__audit-detail">{entry.detail || entry.key_id || ""}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {webhookDeliveries.length > 0 && (
        <div className="e-api-security__section">
          <h4 className="e-api-security__section-title">Webhook delivery attempts</h4>
          <ul className="e-api-security__delivery-list">
            {webhookDeliveries.slice(0, 5).map((d) => (
              <li key={d.id || d.timestamp}>
                <span className="e-api-security__delivery-time">{formatTime(d.timestamp)}</span>
                <span className={`e-api-security__delivery-status e-api-security__delivery-status--${d.success ? "ok" : "fail"}`}>
                  {d.success ? "Delivered" : "Failed"}
                </span>
                {d.status_code && <span className="e-api-security__delivery-code">{d.status_code}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {ipAllowlist.length === 0 && ipDenylist.length === 0 && alerts.length === 0 && (!keyAudit || keyAudit.length === 0) && (!webhookDeliveries || webhookDeliveries.length === 0) && (
        <div className="e-api-security__empty">
          <p>No security entries to display. IP lists and audit data will appear here when configured.</p>
        </div>
      )}
    </div>
  );
}

function formatTime(value) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return isNaN(d.getTime()) ? "—" : d.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
}

export default EApiSecurityPanel;

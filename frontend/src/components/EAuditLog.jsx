/**
 * EAuditLog - Audit log for template changes.
 */
import { useState, useEffect } from "react";
import { fetchAuditLog } from "../services/enterpriseTemplatesApi";
import "./EAuditLog.css";

function EAuditLog() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetchAuditLog();
        if (!cancelled) setEntries(res.data || []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleString(undefined, {
        dateStyle: "short",
        timeStyle: "short",
      });
    } catch {
      return iso;
    }
  };

  if (loading) {
    return (
      <div className="e-audit-log glass-card">
        <h3 className="e-audit-log-title">Audit log</h3>
        <div className="e-audit-log-loading">Loading audit log…</div>
      </div>
    );
  }

  return (
    <div className="e-audit-log glass-card">
      <h3 className="e-audit-log-title">Audit log</h3>
      <p className="e-audit-log-desc">Recent template and system changes.</p>
      <div className="e-audit-log-list">
        {entries.length === 0 ? (
          <div className="e-audit-log-empty">No audit entries yet.</div>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="e-audit-log-entry">
              <div className="e-audit-log-entry-header">
                <span className="e-audit-log-action">{entry.action}</span>
                <span className="e-audit-log-time">{formatDate(entry.timestamp)}</span>
              </div>
              <div className="e-audit-log-entry-meta">
                <span className="e-audit-log-user">{entry.user}</span>
                <span className="e-audit-log-role">{entry.role}</span>
              </div>
              {entry.details && (
                <p className="e-audit-log-details">{entry.details}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default EAuditLog;

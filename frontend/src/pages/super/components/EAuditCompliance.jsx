import "./EAuditCompliance.css";
import EDashboardCard from "./EDashboardCard";
import ELoadingSkeleton from "./ELoadingSkeleton";
import EEmptyState from "./EEmptyState";

function EAuditCompliance({ data, loading, error }) {
  const entries = Array.isArray(data) ? data : [];

  if (error) {
    return (
      <EDashboardCard title="Audit & Compliance">
        <div className="e-audit-error" role="alert">
          {error}
        </div>
      </EDashboardCard>
    );
  }

  if (loading) {
    return (
      <EDashboardCard title="Audit & Compliance">
        <ELoadingSkeleton variant="list" lines={5} />
      </EDashboardCard>
    );
  }

  if (entries.length === 0) {
    return (
      <EDashboardCard title="Audit & Compliance">
        <EEmptyState
          message="No audit entries yet"
          submessage="Admin actions, template edits, and access changes will appear here."
        />
      </EDashboardCard>
    );
  }

  return (
    <EDashboardCard title="Audit & Compliance">
      <ul className="e-audit-list">
        {entries.map((entry, i) => (
          <li key={entry.id || i} className="e-audit-item">
            <span className="e-audit-action">{entry.action || entry.type || "Action"}</span>
            {entry.detail && <span className="e-audit-detail">{entry.detail}</span>}
            {entry.timestamp && (
              <time className="e-audit-time">{entry.timestamp}</time>
            )}
          </li>
        ))}
      </ul>
    </EDashboardCard>
  );
}

export default EAuditCompliance;

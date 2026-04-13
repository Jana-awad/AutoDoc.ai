import "./ETemplateIntelligence.css";
import EDashboardCard from "./EDashboardCard";
import ELoadingSkeleton from "./ELoadingSkeleton";
import EEmptyState from "./EEmptyState";

function ETemplateIntelligence({ data, loading, error }) {
  if (error) {
    return (
      <EDashboardCard title="Template Intelligence Overview">
        <div className="e-template-intel-error" role="alert">
          {error}
        </div>
      </EDashboardCard>
    );
  }

  if (loading) {
    return (
      <EDashboardCard title="Template Intelligence Overview">
        <ELoadingSkeleton variant="card" />
      </EDashboardCard>
    );
  }

  const d = data || {};
  const recent = Array.isArray(d.recentlyUpdated) ? d.recentlyUpdated : [];

  return (
    <EDashboardCard
      title="Template Intelligence Overview"
      actionTo="/super/templates-ai"
      actionLabel="Manage templates"
    >
      <div className="e-template-intel-grid">
        <div className="e-template-intel-stat">
          <span className="e-template-intel-stat-value">{d.activeCount ?? 0}</span>
          <span className="e-template-intel-stat-label">Active templates</span>
        </div>
        <div className="e-template-intel-stat">
          <span className="e-template-intel-stat-value">{d.inTrainingCount ?? 0}</span>
          <span className="e-template-intel-stat-label">In training</span>
        </div>
        <div className="e-template-intel-stat">
          <span className="e-template-intel-stat-value">{d.failedCount ?? 0}</span>
          <span className="e-template-intel-stat-label">Failed</span>
        </div>
      </div>
      <div className="e-template-intel-recent">
        <h4 className="e-template-intel-recent-title">Recently updated</h4>
        {recent.length === 0 ? (
          <EEmptyState message="No recent template updates" />
        ) : (
          <ul className="e-template-intel-list">
            {recent.map((t, i) => (
              <li key={t.id || i}>
                <span>{t.name || "Unnamed template"}</span>
                {t.updatedAt && <time>{t.updatedAt}</time>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </EDashboardCard>
  );
}

export default ETemplateIntelligence;

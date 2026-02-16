import "./EActivityFeed.css";
import EDashboardCard from "./EDashboardCard";
import ELoadingSkeleton from "./ELoadingSkeleton";
import EEmptyState from "./EEmptyState";

const typeIcons = {
  template: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  ),
  failed: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M15 9l-6 6M9 9l6 6" />
    </svg>
  ),
  api_error: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  ),
  user: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  default: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  ),
};

function ActivityItem({ type, message, timestamp }) {
  const icon = typeIcons[type] || typeIcons.default;
  return (
    <div className="e-activity-item">
      <span className={`e-activity-icon e-activity-icon--${type || "default"}`}>{icon}</span>
      <div className="e-activity-content">
        <span className="e-activity-message">{message || "Activity"}</span>
        {timestamp && <time className="e-activity-time">{timestamp}</time>}
      </div>
    </div>
  );
}

function EActivityFeed({ data, loading, error }) {
  const items = Array.isArray(data) ? data : [];

  return (
    <EDashboardCard title="Recent Activity" badge="Live">
      {error && (
        <div className="e-activity-feed-error" role="alert">
          {error}
        </div>
      )}
      {loading && (
        <div className="e-activity-feed-loading">
          <ELoadingSkeleton variant="list" lines={6} />
        </div>
      )}
      {!loading && !error && items.length === 0 && (
        <EEmptyState
          message="No recent activity"
          submessage="Template updates, failures, and API events will show here."
        />
      )}
      {!loading && !error && items.length > 0 && (
        <ul className="e-activity-list">
          {items.map((item, i) => (
            <li key={item.id || i}>
              <ActivityItem
                type={item.type}
                message={item.message}
                timestamp={item.timestamp}
              />
            </li>
          ))}
        </ul>
      )}
    </EDashboardCard>
  );
}

export default EActivityFeed;

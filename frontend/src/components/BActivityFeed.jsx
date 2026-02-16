import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchBusinessRecentActivity } from "../services/businessDashboardApi";
import BDashboardCard from "./BDashboardCard";
import { BCardState } from "./BDashboardStates";

const getStatusClass = (status) => {
  switch ((status || "").toLowerCase()) {
    case "success":
      return "is-success";
    case "warning":
      return "is-warning";
    case "error":
      return "is-error";
    default:
      return "is-neutral";
  }
};

function BActivityFeed({ refreshKey }) {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadActivity = useCallback(
    async ({ signal, isRefresh = false } = {}) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      try {
        const data = await fetchBusinessRecentActivity({ token, signal });
        setItems(Array.isArray(data?.items) ? data.items : []);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err);
          setItems([]);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token]
  );

  useEffect(() => {
    const controller = new AbortController();
    loadActivity({ signal: controller.signal });
    const interval = setInterval(() => loadActivity({ isRefresh: true }), 30000);
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [loadActivity, refreshKey]);

  return (
    <BDashboardCard
      title="Recent Activity"
      subtitle="Live events across automation, API, and teams."
      actions={
        <button
          type="button"
          className={`btn btn-glass ${refreshing ? "is-loading" : ""}`}
          onClick={() => loadActivity({ isRefresh: true })}
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      }
      className="bdashboard-card--activity"
    >
      {loading && <div className="bdashboard-activity-skeleton" />}
      {!loading && error && (
        <BCardState
          title="Unable to load activity"
          message="Activity stream could not be refreshed."
          actionLabel="Retry"
          onAction={() => loadActivity()}
          type="error"
        />
      )}
      {!loading && !error && items.length === 0 && (
        <BCardState
          title="No recent activity"
          message="New events will appear as your team works."
          type="empty"
        />
      )}
      {!loading && !error && items.length > 0 && (
        <ul className="bdashboard-activity-list">
          {items.map((item, index) => (
            <li key={item.id || index} className="bdashboard-activity-item">
              <span className={`bdashboard-activity-status ${getStatusClass(item.status)}`} />
              <div className="bdashboard-activity-content">
                <span className="bdashboard-activity-title">{item.title}</span>
                <span className="bdashboard-activity-meta">
                  {item.actor || "—"} • {item.timestamp || "—"}
                </span>
              </div>
              <span className="bdashboard-activity-type">{item.category || "—"}</span>
            </li>
          ))}
        </ul>
      )}
    </BDashboardCard>
  );
}

export default BActivityFeed;

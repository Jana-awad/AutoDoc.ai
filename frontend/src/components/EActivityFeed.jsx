import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchRecentActivity } from "../services/enterpriseDashboardApi";
import EDashboardCard from "./EDashboardCard";
import { ECardState } from "./EDashboardStates";

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

function EActivityFeed() {
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
        const data = await fetchRecentActivity({ token, signal });
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
  }, [loadActivity]);

  return (
    <EDashboardCard
      title="Recent Activity"
      subtitle="Live events from templates, API, and users."
      actions={
        <button
          type="button"
          className={`btn btn-glass ${refreshing ? "is-loading" : ""}`}
          onClick={() => loadActivity({ isRefresh: true })}
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      }
      className="edashboard-card--activity"
    >
      {loading && <div className="edashboard-activity-skeleton" />}
      {!loading && error && (
        <ECardState
          title="Unable to load activity"
          message="Activity stream could not be refreshed."
          actionLabel="Retry"
          onAction={() => loadActivity()}
          type="error"
        />
      )}
      {!loading && !error && items.length === 0 && (
        <ECardState
          title="No recent activity"
          message="New events will appear as your team works."
          type="empty"
        />
      )}
      {!loading && !error && items.length > 0 && (
        <ul className="edashboard-activity-list">
          {items.map((item, index) => (
            <li key={item.id || index} className="edashboard-activity-item">
              <span className={`edashboard-activity-status ${getStatusClass(item.status)}`} />
              <div className="edashboard-activity-content">
                <span className="edashboard-activity-title">{item.title}</span>
                <span className="edashboard-activity-meta">
                  {item.actor || "—"} • {item.timestamp || "—"}
                </span>
              </div>
              <span className="edashboard-activity-type">{item.category || "—"}</span>
            </li>
          ))}
        </ul>
      )}
    </EDashboardCard>
  );
}

export default EActivityFeed;

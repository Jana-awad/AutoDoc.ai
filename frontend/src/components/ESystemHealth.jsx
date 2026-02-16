import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchSystemHealth } from "../services/enterpriseDashboardApi";
import EDashboardCard from "./EDashboardCard";
import { ECardState } from "./EDashboardStates";

const getHealthTone = (status) => {
  switch ((status || "").toLowerCase()) {
    case "operational":
      return "is-success";
    case "degraded":
      return "is-warning";
    case "down":
      return "is-error";
    default:
      return "is-neutral";
  }
};

function ESystemHealth() {
  const { token } = useAuth();
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadHealth = async (signal) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSystemHealth({ token, signal });
      setHealth(data);
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err);
        setHealth(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    loadHealth(controller.signal);
    return () => controller.abort();
  }, [token]);

  return (
    <EDashboardCard
      title="System Health"
      subtitle="Service uptime and performance signals."
      className="edashboard-card--health"
    >
      {loading && <div className="edashboard-health-skeleton" />}
      {!loading && error && (
        <ECardState
          title="Unable to load system health"
          message="Health indicators are unavailable."
          actionLabel="Retry"
          onAction={() => loadHealth()}
          type="error"
        />
      )}
      {!loading && !error && !health && (
        <ECardState
          title="No health data yet"
          message="Health metrics will appear once monitoring is active."
          type="empty"
        />
      )}
      {!loading && !error && health && (
        <div className="edashboard-health-grid">
          <div className="edashboard-health-item">
            <span className="edashboard-health-label">API Status</span>
            <span className={`edashboard-health-value ${getHealthTone(health.apiStatus)}`}>
              {health.apiStatus || "—"}
            </span>
          </div>
          <div className="edashboard-health-item">
            <span className="edashboard-health-label">Error Spike Alert</span>
            <span className={`edashboard-health-value ${getHealthTone(health.errorSpikeStatus)}`}>
              {health.errorSpikeStatus || "—"}
            </span>
          </div>
          <div className="edashboard-health-item">
            <span className="edashboard-health-label">Avg Processing Time</span>
            <span className="edashboard-health-value">
              {health.avgProcessingTime ?? "—"} ms
            </span>
          </div>
          <div className="edashboard-health-item">
            <span className="edashboard-health-label">Performance Trend</span>
            <span className={`edashboard-health-value ${getHealthTone(health.performanceTrend)}`}>
              {health.performanceTrend || "—"}
            </span>
          </div>
        </div>
      )}
    </EDashboardCard>
  );
}

export default ESystemHealth;

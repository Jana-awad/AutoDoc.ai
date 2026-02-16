import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchBusinessSystemHealth } from "../services/businessDashboardApi";
import BDashboardCard from "./BDashboardCard";
import { BCardState } from "./BDashboardStates";

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

const formatDuration = (value) => {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") return `${value}s`;
  return value;
};

const formatPercent = (value) => {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") return `${value}%`;
  return value;
};

function BSystemHealth({ refreshKey }) {
  const { token } = useAuth();
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadHealth = async (signal) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBusinessSystemHealth({ token, signal });
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
  }, [token, refreshKey]);

  return (
    <BDashboardCard
      title="System Health"
      subtitle="Operational uptime and performance signals."
      className="bdashboard-card--health"
    >
      {loading && <div className="bdashboard-health-skeleton" />}
      {!loading && error && (
        <BCardState
          title="Unable to load system health"
          message="Health indicators are unavailable."
          actionLabel="Retry"
          onAction={() => loadHealth()}
          type="error"
        />
      )}
      {!loading && !error && !health && (
        <BCardState
          title="No health data yet"
          message="Health metrics will appear once monitoring is active."
          type="empty"
        />
      )}
      {!loading && !error && health && (
        <div className="bdashboard-health-grid">
          <div className="bdashboard-health-item">
            <span className="bdashboard-health-label">API Status</span>
            <span className={`bdashboard-health-value ${getHealthTone(health.apiStatus)}`}>
              {health.apiStatus || "—"}
            </span>
          </div>
          <div className="bdashboard-health-item">
            <span className="bdashboard-health-label">Error Spike Alerts</span>
            <span className={`bdashboard-health-value ${getHealthTone(health.errorSpikeStatus)}`}>
              {health.errorSpikeStatus || "—"}
            </span>
          </div>
          <div className="bdashboard-health-item">
            <span className="bdashboard-health-label">Avg Processing Time</span>
            <span className="bdashboard-health-value">
              {formatDuration(health.avgProcessingTime)}
            </span>
          </div>
          <div className="bdashboard-health-item">
            <span className="bdashboard-health-label">Uptime</span>
            <span className="bdashboard-health-value">
              {formatPercent(health.uptime)}
            </span>
          </div>
          <div className="bdashboard-health-item">
            <span className="bdashboard-health-label">Performance Trend</span>
            <span className={`bdashboard-health-value ${getHealthTone(health.performanceTrend)}`}>
              {health.performanceTrend || "—"}
            </span>
          </div>
          <div className="bdashboard-health-item">
            <span className="bdashboard-health-label">Last Incident</span>
            <span className="bdashboard-health-value">{health.lastIncident || "—"}</span>
          </div>
        </div>
      )}
    </BDashboardCard>
  );
}

export default BSystemHealth;

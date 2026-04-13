import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchBusinessApiUsageMonitoring } from "../services/businessDashboardApi";
import BDashboardCard from "./BDashboardCard";
import { BCardState } from "./BDashboardStates";
function BApiUsageMonitor({ refreshKey }) {
  const { token } = useAuth();
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadUsage = async (signal) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBusinessApiUsageMonitoring({ token, signal });
      setUsage(data);
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err);
        setUsage(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    loadUsage(controller.signal);
    return () => controller.abort();
  }, [token, refreshKey]);

  const planUsed = usage?.planUsage?.used ?? usage?.planUsage?.current;
  const planLimit = usage?.planUsage?.limit ?? usage?.planUsage?.total;
  const usagePercent =
    planUsed !== null &&
    planUsed !== undefined &&
    planLimit !== null &&
    planLimit !== undefined
      ? Math.min((planUsed / planLimit) * 100, 100)
      : null;

  return (
    <BDashboardCard
      title="Live API Usage"
      subtitle="Real-time throughput, success rate, and throttling."
      className="bdashboard-card--api-usage"
    >
      {loading && <div className="bdashboard-api-skeleton" />}
      {!loading && error && (
        <BCardState
          title="Unable to load API usage"
          message="Usage monitoring data is unavailable."
          actionLabel="Retry"
          onAction={() => loadUsage()}
          type="error"
        />
      )}
      {!loading && !error && !usage && (
        <BCardState
          title="No usage data"
          message="Live usage metrics will appear once API traffic is detected."
          type="empty"
        />
      )}
      {!loading && !error && usage && (
        <div className="bdashboard-api-grid">
          <div className="bdashboard-api-metric">
            <span className="bdashboard-api-label">Req / min</span>
            <span className="bdashboard-api-value">{usage.requestsPerMinute ?? "—"}</span>
          </div>
          <div className="bdashboard-api-metric">
            <span className="bdashboard-api-label">Success</span>
            <span className="bdashboard-api-value">{usage.successRate ?? "—"}%</span>
          </div>
          <div className="bdashboard-api-metric">
            <span className="bdashboard-api-label">Errors</span>
            <span className="bdashboard-api-value">{usage.errorRate ?? "—"}%</span>
          </div>
          <div className="bdashboard-api-metric">
            <span className="bdashboard-api-label">Throttling</span>
            <span className="bdashboard-api-value">{usage.throttlingStatus || "—"}</span>
          </div>
          <div className="bdashboard-api-usage">
            <span className="bdashboard-api-label">
              Plan Usage
            </span>
            <div className="bdashboard-api-usage__value">
              {planUsed ?? "—"} / {planLimit ?? "—"}
            </div>
            <div className="bdashboard-api-usage__bar">
              <span
                className="bdashboard-api-usage__fill"
                style={{ width: usagePercent ? `${usagePercent}%` : "0%" }}
              />
            </div>
            <span className="bdashboard-api-usage__percent">
              {usagePercent !== null ? `${usagePercent.toFixed(1)}% used` : "—"}
            </span>
          </div>
        </div>
      )}
    </BDashboardCard>
  );
}

export default BApiUsageMonitor;

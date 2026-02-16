import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchApiUsageMonitoring } from "../services/enterpriseDashboardApi";
import EDashboardCard from "./EDashboardCard";
import { ECardState } from "./EDashboardStates";
import EUnlimitedBadge from "./EUnlimitedBadge";

function EApiUsageMonitor() {
  const { token } = useAuth();
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadUsage = async (signal) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchApiUsageMonitoring({ token, signal });
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
  }, [token]);

  return (
    <EDashboardCard
      title="Live API Usage"
      subtitle="Real-time throughput and throttling visibility."
      actions={<EUnlimitedBadge compact />}
      className="edashboard-card--api-usage"
    >
      {loading && <div className="edashboard-api-skeleton" />}
      {!loading && error && (
        <ECardState
          title="Unable to load API usage"
          message="Usage monitoring data is unavailable."
          actionLabel="Retry"
          onAction={() => loadUsage()}
          type="error"
        />
      )}
      {!loading && !error && !usage && (
        <ECardState
          title="No usage data"
          message="Live usage metrics will appear once API traffic is detected."
          type="empty"
        />
      )}
      {!loading && !error && usage && (
        <div className="edashboard-api-grid">
          <div className="edashboard-api-metric">
            <span className="edashboard-api-label">Requests / minute</span>
            <span className="edashboard-api-value">{usage.requestsPerMinute ?? "—"}</span>
          </div>
          <div className="edashboard-api-metric">
            <span className="edashboard-api-label">Success rate</span>
            <span className="edashboard-api-value">{usage.successRate ?? "—"}%</span>
          </div>
          <div className="edashboard-api-metric">
            <span className="edashboard-api-label">Error rate</span>
            <span className="edashboard-api-value">{usage.errorRate ?? "—"}%</span>
          </div>
          <div className="edashboard-api-metric">
            <span className="edashboard-api-label">Throttling status</span>
            <span className="edashboard-api-value">{usage.throttlingStatus || "—"}</span>
          </div>
          {Array.isArray(usage.trafficTrend) && usage.trafficTrend.length > 0 && (
            <div className="edashboard-api-trend">
              <span className="edashboard-api-label">Traffic trend</span>
              <div className="edashboard-api-bars">
                {usage.trafficTrend.map((point, index) => (
                  <span
                    key={`traffic-${index}`}
                    className="edashboard-api-bar"
                    style={{ height: `${Math.min(Math.max(point, 8), 100)}%` }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </EDashboardCard>
  );
}

export default EApiUsageMonitor;

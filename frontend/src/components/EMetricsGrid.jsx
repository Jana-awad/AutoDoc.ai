import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchEnterpriseMetrics } from "../services/enterpriseDashboardApi";
import { ECardState, ESkeletonGrid } from "./EDashboardStates";

const formatValue = (value) => {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") return value.toLocaleString();
  return value;
};

function EMetricsGrid() {
  const { token } = useAuth();
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadMetrics = async (signal) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchEnterpriseMetrics({ token, signal });
      setMetrics(Array.isArray(data?.metrics) ? data.metrics : []);
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err);
        setMetrics([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    loadMetrics(controller.signal);
    return () => controller.abort();
  }, [token]);

  return (
    <div className="edashboard-metrics">
      <div className="edashboard-section__header">
        <div>
          <h2 className="edashboard-section__title">Key Metrics</h2>
          <p className="edashboard-section__subtitle">Enterprise-wide AI processing insights.</p>
        </div>
      </div>

      {loading && <ESkeletonGrid count={6} />}

      {!loading && error && (
        <ECardState
          title="Unable to load metrics"
          message="We could not fetch the latest analytics."
          actionLabel="Retry"
          onAction={() => loadMetrics()}
          type="error"
        />
      )}

      {!loading && !error && metrics.length === 0 && (
        <ECardState
          title="No metrics available"
          message="New metrics will appear once data is processed."
          type="empty"
        />
      )}

      {!loading && !error && metrics.length > 0 && (
        <div className="edashboard-metrics-grid">
          {metrics.map((metric, index) => {
            const trend = metric?.trend || "neutral";
            const change = metric?.changePercent;
            return (
              <div
                key={metric.id || metric.label || index}
                className="edashboard-metric-card glass-card"
                style={{ "--delay": `${index * 70}ms` }}
              >
                <div className="edashboard-metric-card__header">
                  <span className="edashboard-metric-card__label">{metric.label}</span>
                  {metric?.badge && <span className="edashboard-pill">{metric.badge}</span>}
                </div>
                <div className="edashboard-metric-card__value">
                  {formatValue(metric.value)}
                  {metric?.unit && <span className="edashboard-metric-card__unit">{metric.unit}</span>}
                </div>
                <div className="edashboard-metric-card__meta">
                  {change !== null && change !== undefined && (
                    <span className={`edashboard-metric-card__change is-${trend}`}>
                      {trend === "down" ? "▼" : trend === "up" ? "▲" : "■"} {change}%
                    </span>
                  )}
                  {metric?.caption && <span className="edashboard-metric-card__caption">{metric.caption}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default EMetricsGrid;

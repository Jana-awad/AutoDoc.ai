import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchBusinessMetrics } from "../services/businessDashboardApi";
import { BCardState, BSkeletonGrid } from "./BDashboardStates";

const formatValue = (value, format) => {
  if (value === null || value === undefined) return "—";
  if (format === "percent") {
    if (typeof value === "number") return `${value.toFixed(1)}%`;
    return `${value}%`;
  }
  if (typeof value === "number") return value.toLocaleString();
  return value;
};

const metricConfig = [
  { key: "totalDocuments", label: "Total Documents", format: "number" },
  { key: "successRate", label: "Success Rate", format: "percent" },
  { key: "apiCallsToday", label: "API Calls Today", format: "number" },
  { key: "activeUsers", label: "Active Users", format: "number" },
  { key: "remainingQuota", label: "Remaining Quota", format: "number" },
];

function normalizeMetric(metric, fallbackLabel) {
  return {
    label: metric?.label || fallbackLabel,
    value: metric?.value ?? metric?.current ?? metric?.count ?? metric?.remaining ?? metric?.percentage,
    unit: metric?.unit,
    changePercent: metric?.changePercent ?? metric?.delta,
    trend: metric?.trend || (metric?.delta > 0 ? "up" : metric?.delta < 0 ? "down" : "neutral"),
    format: metric?.format,
  };
}

function BMetricsGrid({ refreshKey }) {
  const { token } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadMetrics = async (signal) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBusinessMetrics({ token, signal });
      if (Array.isArray(data?.metrics)) {
        setMetrics(data.metrics);
      } else {
        setMetrics(data || null);
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err);
        setMetrics(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    loadMetrics(controller.signal);
    return () => controller.abort();
  }, [token, refreshKey]);

  const metricList = useMemo(() => {
    if (!metrics) return [];
    if (Array.isArray(metrics)) {
      return metrics.map((metric) => normalizeMetric(metric, metric?.label));
    }
    return metricConfig.map((config) =>
      normalizeMetric(metrics[config.key], config.label)
    );
  }, [metrics]);

  const hasMetrics = metricList.some((metric) => metric.value !== null && metric.value !== undefined);

  return (
    <div className="bdashboard-metrics">
      {loading && <BSkeletonGrid count={5} />}

      {!loading && error && (
        <BCardState
          title="Unable to load metrics"
          message="We could not fetch the latest business analytics."
          actionLabel="Retry"
          onAction={() => loadMetrics()}
          type="error"
        />
      )}

      {!loading && !error && !hasMetrics && (
        <BCardState
          title="No metrics available"
          message="New metrics will appear once data is processed."
          type="empty"
        />
      )}

      {!loading && !error && hasMetrics && (
        <div className="bdashboard-metrics-grid">
          {metricList.map((metric, index) => {
            const trend = metric?.trend || "neutral";
            const change = metric?.changePercent;
            return (
              <div
                key={`${metric.label}-${index}`}
                className="bdashboard-metric-card glass-card"
                style={{ "--delay": `${index * 70}ms` }}
              >
                <span className={`bdashboard-metric-change is-${trend}`}>
                  {change !== null && change !== undefined
                    ? `${trend === "down" ? "▼" : trend === "up" ? "▲" : "•"} ${change}%`
                    : "—"}
                </span>
                <span className="bdashboard-metric-value">
                  {formatValue(metric.value, metric.format || metricConfig[index]?.format)}
                </span>
                <span className="bdashboard-metric-label">{metric.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default BMetricsGrid;

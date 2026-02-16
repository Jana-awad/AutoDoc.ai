import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchBusinessAiProcessingAnalytics } from "../services/businessDashboardApi";
import BDashboardCard from "./BDashboardCard";
import { BCardState } from "./BDashboardStates";

function BAIProcessingAnalytics({ refreshKey }) {
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAnalytics = async (signal) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBusinessAiProcessingAnalytics({ token, signal });
      setAnalytics(data);
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err);
        setAnalytics(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    loadAnalytics(controller.signal);
    return () => controller.abort();
  }, [token, refreshKey]);

  return (
    <BDashboardCard
      title="AI Processing Analytics"
      subtitle="Accuracy, confidence, and latency trends."
      className="bdashboard-card--analytics"
    >
      {loading && <div className="bdashboard-analytics-skeleton" />}
      {!loading && error && (
        <BCardState
          title="Unable to load analytics"
          message="AI processing analytics are unavailable."
          actionLabel="Retry"
          onAction={() => loadAnalytics()}
          type="error"
        />
      )}
      {!loading && !error && !analytics && (
        <BCardState
          title="No analytics yet"
          message="Insights will appear once AI processing resumes."
          type="empty"
        />
      )}
      {!loading && !error && analytics && (
        <div className="bdashboard-analytics-grid">
          <div className="bdashboard-analytics-item">
            <span className="bdashboard-analytics-label">OCR Accuracy</span>
            <span className="bdashboard-analytics-value">{analytics.ocrAccuracy ?? "—"}%</span>
          </div>
          <div className="bdashboard-analytics-item">
            <span className="bdashboard-analytics-label">Extraction Confidence</span>
            <span className="bdashboard-analytics-value">
              {analytics.extractionConfidence ?? "—"}%
            </span>
          </div>
          <div className="bdashboard-analytics-item">
            <span className="bdashboard-analytics-label">Template Performance</span>
            <span className="bdashboard-analytics-value">
              {analytics.templatePerformance ?? "—"}%
            </span>
          </div>
          <div className="bdashboard-analytics-item">
            <span className="bdashboard-analytics-label">Avg Processing Latency</span>
            <span className="bdashboard-analytics-value">
              {analytics.processingLatency === null || analytics.processingLatency === undefined
                ? "—"
                : typeof analytics.processingLatency === "number"
                ? `${analytics.processingLatency}s`
                : analytics.processingLatency}
            </span>
          </div>
          <div className="bdashboard-analytics-trend">
            <span className="bdashboard-analytics-label">Trend</span>
            <span className={`bdashboard-analytics-trend-value is-${analytics.trend || "neutral"}`}>
              {analytics.trend || "—"}
            </span>
          </div>
        </div>
      )}
    </BDashboardCard>
  );
}

export default BAIProcessingAnalytics;

import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchAiProcessingAnalytics } from "../services/enterpriseDashboardApi";
import EDashboardCard from "./EDashboardCard";
import { ECardState } from "./EDashboardStates";

function EAIProcessingAnalytics() {
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAnalytics = async (signal) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAiProcessingAnalytics({ token, signal });
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
  }, [token]);

  return (
    <EDashboardCard
      title="AI Processing Analytics"
      subtitle="Model accuracy, confidence, and latency trends."
      className="edashboard-card--analytics"
    >
      {loading && <div className="edashboard-analytics-skeleton" />}
      {!loading && error && (
        <ECardState
          title="Unable to load analytics"
          message="AI processing analytics are unavailable."
          actionLabel="Retry"
          onAction={() => loadAnalytics()}
          type="error"
        />
      )}
      {!loading && !error && !analytics && (
        <ECardState
          title="No analytics yet"
          message="Insights will appear once AI processing resumes."
          type="empty"
        />
      )}
      {!loading && !error && analytics && (
        <div className="edashboard-analytics-grid">
          <div className="edashboard-analytics-item">
            <span className="edashboard-analytics-label">OCR accuracy</span>
            <span className="edashboard-analytics-value">{analytics.ocrAccuracy ?? "—"}%</span>
          </div>
          <div className="edashboard-analytics-item">
            <span className="edashboard-analytics-label">Extraction confidence</span>
            <span className="edashboard-analytics-value">{analytics.extractionConfidence ?? "—"}%</span>
          </div>
          <div className="edashboard-analytics-item">
            <span className="edashboard-analytics-label">Template performance</span>
            <span className="edashboard-analytics-value">{analytics.templatePerformance ?? "—"}%</span>
          </div>
          <div className="edashboard-analytics-item">
            <span className="edashboard-analytics-label">Processing latency</span>
            <span className="edashboard-analytics-value">
              {analytics.processingLatency ?? "—"} ms
            </span>
          </div>
          {Array.isArray(analytics.latencyTrend) && analytics.latencyTrend.length > 0 && (
            <div className="edashboard-analytics-trend">
              <span className="edashboard-analytics-label">Latency trend</span>
              <div className="edashboard-analytics-bars">
                {analytics.latencyTrend.map((point, index) => (
                  <span
                    key={`latency-${index}`}
                    className="edashboard-analytics-bar"
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

export default EAIProcessingAnalytics;

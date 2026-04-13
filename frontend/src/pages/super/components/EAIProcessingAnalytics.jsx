import "./EAIProcessingAnalytics.css";
import EDashboardCard from "./EDashboardCard";
import ELoadingSkeleton from "./ELoadingSkeleton";

function EAIProcessingAnalytics({ data, loading, error }) {
  if (error) {
    return (
      <EDashboardCard title="AI Processing Analytics">
        <div className="e-ai-analytics-error" role="alert">
          {error}
        </div>
      </EDashboardCard>
    );
  }

  if (loading) {
    return (
      <EDashboardCard title="AI Processing Analytics">
        <ELoadingSkeleton variant="card" />
      </EDashboardCard>
    );
  }

  const d = data || {};
  return (
    <EDashboardCard title="AI Processing Analytics">
      <div className="e-ai-analytics-grid">
        <div className="e-ai-analytics-item">
          <span className="e-ai-analytics-label">OCR accuracy rate</span>
          <span className="e-ai-analytics-value">
            {d.ocrAccuracyRate != null ? `${d.ocrAccuracyRate}%` : "—"}
          </span>
        </div>
        <div className="e-ai-analytics-item">
          <span className="e-ai-analytics-label">Extraction confidence score</span>
          <span className="e-ai-analytics-value">
            {d.extractionConfidenceScore != null ? `${d.extractionConfidenceScore}%` : "—"}
          </span>
        </div>
        <div className="e-ai-analytics-item e-ai-analytics-item--full">
          <span className="e-ai-analytics-label">Processing latency trend</span>
          <span className="e-ai-analytics-value">
            {Array.isArray(d.latencyTrend) && d.latencyTrend.length
              ? `${d.latencyTrend.length} data points`
              : "No trend data"}
          </span>
        </div>
      </div>
    </EDashboardCard>
  );
}

export default EAIProcessingAnalytics;

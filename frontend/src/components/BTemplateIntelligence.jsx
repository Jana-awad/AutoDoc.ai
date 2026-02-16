import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchBusinessTemplateIntelligence } from "../services/businessDashboardApi";
import BDashboardCard from "./BDashboardCard";
import { BCardState } from "./BDashboardStates";

function BTemplateIntelligence({ refreshKey }) {
  const { token } = useAuth();
  const [intel, setIntel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadIntel = async (signal) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBusinessTemplateIntelligence({ token, signal });
      setIntel(data);
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err);
        setIntel(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    loadIntel(controller.signal);
    return () => controller.abort();
  }, [token, refreshKey]);

  return (
    <BDashboardCard
      title="Template Intelligence"
      subtitle="Template health, training, and recent updates."
      actions={
        <Link className="btn btn-glass" to="/business/api">
          Manage Templates →
        </Link>
      }
      className="bdashboard-card--templates"
    >
      {loading && <div className="bdashboard-template-skeleton" />}
      {!loading && error && (
        <BCardState
          title="Unable to load workflows"
          message="Workflow intelligence data could not be retrieved."
          actionLabel="Retry"
          onAction={() => loadIntel()}
          type="error"
        />
      )}
      {!loading && !error && !intel && (
        <BCardState
          title="No workflow insights"
          message="Workflow intelligence will appear once data is available."
          type="empty"
        />
      )}
      {!loading && !error && intel && (
        <div className="bdashboard-template-grid">
          <div className="bdashboard-template-metric">
            <span className="bdashboard-template-label">Active</span>
            <span className="bdashboard-template-value">{intel.activeTemplates ?? "—"}</span>
          </div>
          <div className="bdashboard-template-metric">
            <span className="bdashboard-template-label">Training</span>
            <span className="bdashboard-template-value">{intel.templatesInTraining ?? "—"}</span>
          </div>
          <div className="bdashboard-template-metric">
            <span className="bdashboard-template-label">Failed</span>
            <span className="bdashboard-template-value">{intel.failedTemplates ?? "—"}</span>
          </div>
          <div className="bdashboard-template-metric">
            <span className="bdashboard-template-label">Updated</span>
            <span className="bdashboard-template-value">{intel.updatedThisWeek ?? "—"}</span>
          </div>
          {Array.isArray(intel.recentUpdates) && intel.recentUpdates.length > 0 && (
            <div className="bdashboard-template-updates">
              <span className="bdashboard-template-label">Recent Updates</span>
              <ul>
                {intel.recentUpdates.map((item, index) => (
                  <li key={item.id || index}>
                    <span>{item.name}</span>
                    <span className={`bdashboard-template-status is-${item.status || "neutral"}`}>
                      {item.status || "—"}
                    </span>
                    <span>{item.updatedAt}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </BDashboardCard>
  );
}

export default BTemplateIntelligence;

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchTemplateIntelligence } from "../services/enterpriseDashboardApi";
import EDashboardCard from "./EDashboardCard";
import { ECardState } from "./EDashboardStates";

function ETemplateIntelligence() {
  const { token } = useAuth();
  const [intel, setIntel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadIntel = async (signal) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTemplateIntelligence({ token, signal });
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
  }, [token]);

  return (
    <EDashboardCard
      title="Template Intelligence"
      subtitle="Template health, training, and latest updates."
      actions={
        <Link className="btn btn-glass" to="/enterprise/templates-ai">
          Manage templates
        </Link>
      }
      className="edashboard-card--templates"
    >
      {loading && <div className="edashboard-template-skeleton" />}
      {!loading && error && (
        <ECardState
          title="Unable to load templates"
          message="Template intelligence data could not be retrieved."
          actionLabel="Retry"
          onAction={() => loadIntel()}
          type="error"
        />
      )}
      {!loading && !error && !intel && (
        <ECardState
          title="No template insights"
          message="Template intelligence will appear once data is available."
          type="empty"
        />
      )}
      {!loading && !error && intel && (
        <div className="edashboard-template-grid">
          <div className="edashboard-template-metric">
            <span className="edashboard-template-label">Active templates</span>
            <span className="edashboard-template-value">{intel.activeTemplates ?? "—"}</span>
          </div>
          <div className="edashboard-template-metric">
            <span className="edashboard-template-label">In training</span>
            <span className="edashboard-template-value">{intel.templatesInTraining ?? "—"}</span>
          </div>
          <div className="edashboard-template-metric">
            <span className="edashboard-template-label">Failed templates</span>
            <span className="edashboard-template-value">{intel.failedTemplates ?? "—"}</span>
          </div>
          <div className="edashboard-template-metric">
            <span className="edashboard-template-label">Updated this week</span>
            <span className="edashboard-template-value">{intel.updatedThisWeek ?? "—"}</span>
          </div>
          {Array.isArray(intel.recentUpdates) && intel.recentUpdates.length > 0 && (
            <div className="edashboard-template-updates">
              <span className="edashboard-template-label">Recent updates</span>
              <ul>
                {intel.recentUpdates.map((item, index) => (
                  <li key={item.id || index}>
                    <span>{item.name}</span>
                    <span>{item.updatedAt}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </EDashboardCard>
  );
}

export default ETemplateIntelligence;

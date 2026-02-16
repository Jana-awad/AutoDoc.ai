import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchBusinessSupportSla } from "../services/businessDashboardApi";
import BDashboardCard from "./BDashboardCard";
import { BCardState } from "./BDashboardStates";

function BSupportSla({ refreshKey }) {
  const { token } = useAuth();
  const [support, setSupport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadSupport = async (signal) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBusinessSupportSla({ token, signal });
      setSupport(data);
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err);
        setSupport(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    loadSupport(controller.signal);
    return () => controller.abort();
  }, [token, refreshKey]);

  return (
    <BDashboardCard
      title="Support"
      subtitle="Business support coverage and SLA status."
      className="bdashboard-card--support"
    >
      {loading && <div className="bdashboard-support-skeleton" />}
      {!loading && error && (
        <BCardState
          title="Unable to load support details"
          message="Support and SLA details are unavailable."
          actionLabel="Retry"
          onAction={() => loadSupport()}
          type="error"
        />
      )}
      {!loading && !error && !support && (
        <BCardState
          title="No support data"
          message="Support information will appear once configured."
          type="empty"
        />
      )}
      {!loading && !error && support && (
        <div className="bdashboard-support-grid">
          <div className="bdashboard-support-badge">
            <span className="bdashboard-pill bdashboard-pill--solid">
              {support.supportLabel || "Business Support"}
            </span>
            <span className="bdashboard-support-sla">SLA: {support.slaStatus || "—"}</span>
          </div>
          <div className="bdashboard-support-stat">
            <span className="bdashboard-support-label">Response Time</span>
            <span className="bdashboard-support-value">{support.responseTime || "—"}</span>
          </div>
          <div className="bdashboard-support-stat">
            <span className="bdashboard-support-label">Open Tickets</span>
            <span className="bdashboard-support-value">{support.openTickets ?? "—"}</span>
          </div>
          <div className="bdashboard-support-stat">
            <span className="bdashboard-support-label">Resolved (Month)</span>
            <span className="bdashboard-support-value">{support.resolvedTickets ?? "—"}</span>
          </div>
          <div className="bdashboard-support-actions">
            {support.contactEmail ? (
              <a className="btn btn-secondary" href={`mailto:${support.contactEmail}`}>
                Contact Support
              </a>
            ) : (
              <button className="btn btn-secondary" type="button" disabled>
                Contact Support
              </button>
            )}
            {support.ticketsUrl ? (
              <a className="btn btn-glass" href={support.ticketsUrl} target="_blank" rel="noreferrer">
                View Tickets →
              </a>
            ) : (
              <button className="btn btn-glass" type="button" disabled>
                View Tickets →
              </button>
            )}
          </div>
        </div>
      )}
    </BDashboardCard>
  );
}

export default BSupportSla;

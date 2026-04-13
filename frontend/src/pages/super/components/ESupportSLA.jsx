import "./ESupportSLA.css";
import EDashboardCard from "./EDashboardCard";
import ELoadingSkeleton from "./ELoadingSkeleton";

function ESupportSLA({ data, loading, error }) {
  if (error) {
    return (
      <EDashboardCard title="Support & SLA">
        <div className="e-support-error" role="alert">
          {error}
        </div>
      </EDashboardCard>
    );
  }

  if (loading) {
    return (
      <EDashboardCard title="Support & SLA">
        <ELoadingSkeleton variant="card" />
      </EDashboardCard>
    );
  }

  const d = data || {};
  const slaStatus = (d.slaStatus || "met").toLowerCase();

  return (
    <EDashboardCard title="Support & SLA" badge={d.prioritySupport24_7 ? "24/7" : null}>
      <div className="e-support-grid">
        {d.prioritySupport24_7 && (
          <div className="e-support-badge-row">
            <span className="e-support-badge">24/7 Priority Support</span>
          </div>
        )}
        <div className="e-support-row">
          <span className="e-support-label">Account Manager</span>
          <span className="e-support-value">
            {d.accountManager || "Not assigned"}
          </span>
        </div>
        <div className="e-support-row">
          <span className="e-support-label">SLA status</span>
          <span className={`e-support-value e-support-sla e-support-sla--${slaStatus}`}>
            {slaStatus === "met" && "Met"}
            {slaStatus === "at_risk" && "At risk"}
            {slaStatus === "breach" && "Breach"}
            {!["met", "at_risk", "breach"].includes(slaStatus) && d.slaStatus}
          </span>
        </div>
        <div className="e-support-actions">
          <button type="button" className="e-support-btn">
            Contact support
          </button>
          <button type="button" className="e-support-btn e-support-btn--secondary">
            Open ticket
          </button>
        </div>
      </div>
    </EDashboardCard>
  );
}

export default ESupportSLA;

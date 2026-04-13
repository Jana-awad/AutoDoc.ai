import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchSupportSla } from "../services/enterpriseDashboardApi";
import EDashboardCard from "./EDashboardCard";
import { ECardState } from "./EDashboardStates";

function ESupportSla() {
  const { token } = useAuth();
  const [support, setSupport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadSupport = async (signal) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSupportSla({ token, signal });
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
  }, [token]);

  return (
    <EDashboardCard
      title="Enterprise Support & SLA"
      subtitle="Priority support coverage and account management."
      className="edashboard-card--support"
    >
      {loading && <div className="edashboard-support-skeleton" />}
      {!loading && error && (
        <ECardState
          title="Unable to load support details"
          message="Support and SLA details are unavailable."
          actionLabel="Retry"
          onAction={() => loadSupport()}
          type="error"
        />
      )}
      {!loading && !error && !support && (
        <ECardState
          title="No support data"
          message="Support information will appear once configured."
          type="empty"
        />
      )}
      {!loading && !error && support && (
        <div className="edashboard-support-grid">
          <div className="edashboard-support-badge">
            <span className="edashboard-pill edashboard-pill--primary">
              {support.prioritySupportLabel || "—"}
            </span>
          </div>
          <div className="edashboard-support-info">
            <span className="edashboard-support-label">Account manager</span>
            <span className="edashboard-support-value">{support.accountManager?.name ?? "—"}</span>
            <span className="edashboard-support-sub">{support.accountManager?.email}</span>
          </div>
          <div className="edashboard-support-info">
            <span className="edashboard-support-label">SLA status</span>
            <span className="edashboard-support-value">{support.slaStatus ?? "—"}</span>
            <span className="edashboard-support-sub">{support.slaDetails}</span>
          </div>
          <div className="edashboard-support-actions">
            {support.accountManager?.email && (
              <a className="btn btn-secondary" href={`mailto:${support.accountManager.email}`}>
                Email support
              </a>
            )}
            {support.accountManager?.phone && (
              <a className="btn btn-glass" href={`tel:${support.accountManager.phone}`}>
                Call manager
              </a>
            )}
          </div>
        </div>
      )}
    </EDashboardCard>
  );
}

export default ESupportSla;

import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchAuditCompliance } from "../services/enterpriseDashboardApi";
import EDashboardCard from "./EDashboardCard";
import { ECardState } from "./EDashboardStates";

function EAuditCompliance() {
  const { token } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadEntries = async (signal) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAuditCompliance({ token, signal });
      setEntries(Array.isArray(data?.entries) ? data.entries : []);
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err);
        setEntries([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    loadEntries(controller.signal);
    return () => controller.abort();
  }, [token]);

  return (
    <EDashboardCard
      title="Audit & Compliance"
      subtitle="Administrative actions and governance tracking."
      className="edashboard-card--audit"
    >
      {loading && <div className="edashboard-audit-skeleton" />}
      {!loading && error && (
        <ECardState
          title="Unable to load audit log"
          message="Compliance events could not be retrieved."
          actionLabel="Retry"
          onAction={() => loadEntries()}
          type="error"
        />
      )}
      {!loading && !error && entries.length === 0 && (
        <ECardState
          title="No audit entries"
          message="Audit events will appear as changes are logged."
          type="empty"
        />
      )}
      {!loading && !error && entries.length > 0 && (
        <ul className="edashboard-audit-list">
          {entries.map((entry, index) => (
            <li key={entry.id || index} className="edashboard-audit-item">
              <div className="edashboard-audit-meta">
                <span className="edashboard-audit-action">{entry.action}</span>
                <span className="edashboard-audit-time">{entry.timestamp}</span>
              </div>
              <span className="edashboard-audit-details">{entry.details}</span>
              <span className="edashboard-audit-user">{entry.actor}</span>
            </li>
          ))}
        </ul>
      )}
    </EDashboardCard>
  );
}

export default EAuditCompliance;

import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchBusinessAuditCompliance } from "../services/businessDashboardApi";
import BDashboardCard from "./BDashboardCard";
import { BCardState } from "./BDashboardStates";

function BAuditCompliance({ refreshKey }) {
  const { token } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadEntries = async (signal) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBusinessAuditCompliance({ token, signal });
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
  }, [token, refreshKey]);

  return (
    <BDashboardCard
      title="Audit & Compliance"
      subtitle="Administrative actions and governance tracking."
      className="bdashboard-card--audit"
    >
      {loading && <div className="bdashboard-audit-skeleton" />}
      {!loading && error && (
        <BCardState
          title="Unable to load audit log"
          message="Compliance events could not be retrieved."
          actionLabel="Retry"
          onAction={() => loadEntries()}
          type="error"
        />
      )}
      {!loading && !error && entries.length === 0 && (
        <BCardState
          title="No audit entries"
          message="Audit events will appear as changes are logged."
          type="empty"
        />
      )}
      {!loading && !error && entries.length > 0 && (
        <ul className="bdashboard-audit-list">
          {entries.map((entry, index) => (
            <li key={entry.id || index} className="bdashboard-audit-item">
              <div className="bdashboard-audit-meta">
                <span className="bdashboard-audit-action">{entry.action}</span>
                <span className="bdashboard-audit-time">{entry.timestamp}</span>
              </div>
              <span className="bdashboard-audit-details">{entry.details}</span>
              <span className="bdashboard-audit-user">{entry.actor}</span>
            </li>
          ))}
        </ul>
      )}
    </BDashboardCard>
  );
}

export default BAuditCompliance;

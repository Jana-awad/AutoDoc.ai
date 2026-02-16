import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchTopActiveUsers } from "../services/enterpriseDashboardApi";
import EDashboardCard from "./EDashboardCard";
import { ECardState } from "./EDashboardStates";

function ETopActiveUsers() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadUsers = async (signal) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTopActiveUsers({ token, signal });
      setUsers(Array.isArray(data?.users) ? data.users : []);
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err);
        setUsers([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    loadUsers(controller.signal);
    return () => controller.abort();
  }, [token]);

  return (
    <EDashboardCard
      title="Top Active Users"
      subtitle="Ranked by document throughput and API usage."
      className="edashboard-card--list"
    >
      {loading && <div className="edashboard-list-skeleton" />}
      {!loading && error && (
        <ECardState
          title="Unable to load users"
          message="Check your connection and try again."
          actionLabel="Retry"
          onAction={() => loadUsers()}
          type="error"
        />
      )}
      {!loading && !error && users.length === 0 && (
        <ECardState
          title="No active users yet"
          message="Active user rankings will appear once activity is tracked."
          type="empty"
        />
      )}
      {!loading && !error && users.length > 0 && (
        <ul className="edashboard-ranked-list">
          {users.map((user, index) => (
            <li key={user.id || user.email || index} className="edashboard-ranked-item">
              <div className="edashboard-ranked-item__rank">
                <span className={`edashboard-rank-badge rank-${user.rank || index + 1}`}>
                  {user.rank || index + 1}
                </span>
              </div>
              <div className="edashboard-ranked-item__info">
                <span className="edashboard-ranked-item__name">{user.name || user.email || "—"}</span>
                <span className="edashboard-ranked-item__role">{user.role || "—"}</span>
              </div>
              <div className="edashboard-ranked-item__metrics">
                <div>
                  <span className="edashboard-ranked-item__label">Docs</span>
                  <span className="edashboard-ranked-item__value">
                    {user.documentsProcessed?.toLocaleString() ?? "—"}
                  </span>
                </div>
                <div>
                  <span className="edashboard-ranked-item__label">API Calls</span>
                  <span className="edashboard-ranked-item__value">
                    {user.apiCalls?.toLocaleString() ?? "—"}
                  </span>
                </div>
                <div>
                  <span className="edashboard-ranked-item__label">Errors</span>
                  <span className="edashboard-ranked-item__value">
                    {user.errorCount?.toLocaleString() ?? "—"}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </EDashboardCard>
  );
}

export default ETopActiveUsers;

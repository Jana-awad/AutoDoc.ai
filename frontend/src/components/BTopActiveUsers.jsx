import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchBusinessTopActiveUsers } from "../services/businessDashboardApi";
import BDashboardCard from "./BDashboardCard";
import { BCardState } from "./BDashboardStates";

const getInitials = (name, email) => {
  if (name) {
    return name
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return "—";
};

function BTopActiveUsers({ refreshKey }) {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadUsers = async (signal) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBusinessTopActiveUsers({ token, signal });
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
  }, [token, refreshKey]);

  return (
    <BDashboardCard
      title="Top Active Users"
      subtitle="Ranked by document throughput and operational impact."
      className="bdashboard-card--users"
    >
      {loading && <div className="bdashboard-list-skeleton" />}
      {!loading && error && (
        <BCardState
          title="Unable to load users"
          message="Check your connection and try again."
          actionLabel="Retry"
          onAction={() => loadUsers()}
          type="error"
        />
      )}
      {!loading && !error && users.length === 0 && (
        <BCardState
          title="No active users yet"
          message="Active user rankings will appear once activity is tracked."
          type="empty"
        />
      )}
      {!loading && !error && users.length > 0 && (
        <div className="bdashboard-table">
          <div className="bdashboard-table__head">
            <span>Rank</span>
            <span>User</span>
            <span>Documents</span>
            <span>API Calls</span>
            <span>Errors</span>
          </div>
          {users.map((user, index) => (
            <div key={user.id || user.email || index} className="bdashboard-table__row">
              <div className="bdashboard-table__rank">
                <span className={`bdashboard-rank-badge rank-${user.rank || index + 1}`}>
                  {user.rank || index + 1}
                </span>
              </div>
              <div className="bdashboard-table__user">
                <span className="bdashboard-avatar">{getInitials(user.name, user.email)}</span>
                <div>
                  <span className="bdashboard-user__name">{user.name || "—"}</span>
                  <span className="bdashboard-user__email">{user.email || "—"}</span>
                </div>
              </div>
              <span className="bdashboard-table__value">
                {user.documentsProcessed?.toLocaleString() ?? "—"}
              </span>
              <span className="bdashboard-table__value">
                {user.apiCalls?.toLocaleString() ?? "—"}
              </span>
              <span className="bdashboard-table__value">
                {user.errorCount?.toLocaleString() ?? "—"}
              </span>
            </div>
          ))}
        </div>
      )}
    </BDashboardCard>
  );
}

export default BTopActiveUsers;

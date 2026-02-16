import "./EUserRanking.css";
import EDashboardCard from "./EDashboardCard";
import ELoadingSkeleton from "./ELoadingSkeleton";
import EEmptyState from "./EEmptyState";

function RankBadge({ rank }) {
  const isTop = rank <= 3;
  return (
    <span className={`e-rank-badge ${isTop ? `e-rank-badge--${rank}` : ""}`}>
      #{rank}
    </span>
  );
}

function EUserRanking({ data, loading, error }) {
  const list = Array.isArray(data) ? data : [];

  return (
    <EDashboardCard title="Top Active Clients">
      {error && (
        <div className="e-user-ranking-error" role="alert">
          {error}
        </div>
      )}
      {loading && (
        <div className="e-user-ranking-loading">
          <ELoadingSkeleton variant="list" lines={5} />
        </div>
      )}
      {!loading && !error && list.length === 0 && (
        <EEmptyState
          message="No client activity yet"
          submessage="Usage will appear here once clients use the platform."
        />
      )}
      {!loading && !error && list.length > 0 && (
        <div className="e-user-ranking-table-wrap">
          <table className="e-user-ranking-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>User</th>
                <th>Documents</th>
                <th>API calls</th>
                <th>Errors</th>
              </tr>
            </thead>
            <tbody>
              {list.map((row, idx) => (
                <tr key={row.id || idx}>
                  <td>
                    <RankBadge rank={idx + 1} />
                  </td>
                  <td>
                    <span className="e-user-ranking-name">{row.name || row.email || "—"}</span>
                  </td>
                  <td>{row.documentsProcessed ?? "—"}</td>
                  <td>{row.apiCalls ?? "—"}</td>
                  <td>{row.errorCount ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </EDashboardCard>
  );
}

export default EUserRanking;

/**
 * ERequestLogsTable - Searchable, filterable API request logs with pagination and download.
 */
import { useState } from "react";
import "./ERequestLogsTable.css";

function ERequestLogsTable({
  logs = [],
  total = 0,
  page = 1,
  perPage = 20,
  loading = false,
  search = "",
  statusFilter = "",
  onSearchChange,
  onStatusFilterChange,
  onPageChange,
  onRefresh,
  onDownload,
  downloading = false,
}) {
  const [localSearch, setLocalSearch] = useState(search);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onSearchChange?.(localSearch.trim());
  };

  const statusClass = (code) => {
    if (!code) return "";
    const n = parseInt(code, 10);
    if (n >= 200 && n < 300) return "e-logs-table__status--success";
    if (n >= 400 && n < 500) return "e-logs-table__status--client";
    if (n >= 500) return "e-logs-table__status--server";
    return "";
  };

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return (
    <div className="e-logs-table glass-card">
      <div className="e-logs-table__header">
        <h3 className="e-logs-table__title">API request logs</h3>
        <p className="e-logs-table__subtitle">
          Search and filter by endpoint, status, request ID. Download logs for auditing.
        </p>
        <div className="e-logs-table__toolbar">
          <form className="e-logs-table__search-form" onSubmit={handleSearchSubmit}>
            <input
              type="search"
              className="e-logs-table__search"
              placeholder="Search endpoint or request ID…"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              disabled={loading}
            />
            <button type="submit" className="e-logs-table__btn e-logs-table__btn--search">
              Search
            </button>
          </form>
          <select
            className="e-logs-table__filter"
            value={statusFilter}
            onChange={(e) => onStatusFilterChange?.(e.target.value)}
            disabled={loading}
          >
            <option value="">All statuses</option>
            <option value="2xx">2xx Success</option>
            <option value="4xx">4xx Client error</option>
            <option value="5xx">5xx Server error</option>
          </select>
          <button
            type="button"
            className="e-logs-table__btn e-logs-table__btn--secondary"
            onClick={onRefresh}
            disabled={loading}
          >
            Refresh
          </button>
          <button
            type="button"
            className="e-logs-table__btn e-logs-table__btn--primary"
            onClick={onDownload}
            disabled={loading || downloading}
          >
            {downloading ? "Downloading…" : "Download logs"}
          </button>
        </div>
      </div>

      {loading && (
        <div className="e-logs-table__loading">
          <div className="e-logs-table__skeleton e-logs-table__skeleton--bar" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="e-logs-table__skeleton e-logs-table__skeleton--row" />
          ))}
        </div>
      )}

      {!loading && logs.length === 0 && (
        <div className="e-logs-table__empty">
          <p>No request logs found.</p>
          <p className="e-logs-table__empty-hint">Try adjusting search or filters.</p>
        </div>
      )}

      {!loading && logs.length > 0 && (
        <>
          <div className="e-logs-table__wrap">
            <table className="e-logs-table__table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Endpoint</th>
                  <th>Status</th>
                  <th>Response time</th>
                  <th>Request ID</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((row) => (
                  <tr key={row.id || row.request_id || row.timestamp + row.endpoint}>
                    <td className="e-logs-table__cell e-logs-table__cell--time">
                      {formatTime(row.timestamp)}
                    </td>
                    <td className="e-logs-table__cell e-logs-table__cell--endpoint">
                      <code>{row.endpoint || "—"}</code>
                    </td>
                    <td className="e-logs-table__cell">
                      <span className={`e-logs-table__status ${statusClass(row.status_code)}`}>
                        {row.status_code ?? "—"}
                      </span>
                    </td>
                    <td className="e-logs-table__cell e-logs-table__cell--ms">
                      {row.response_time_ms != null ? `${row.response_time_ms} ms` : "—"}
                    </td>
                    <td className="e-logs-table__cell e-logs-table__cell--id">
                      <code>{row.request_id || "—"}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="e-logs-table__pagination">
            <span className="e-logs-table__pagination-info">
              Page {page} of {totalPages} · {total} total
            </span>
            <div className="e-logs-table__pagination-btns">
              <button
                type="button"
                className="e-logs-table__btn e-logs-table__btn--pagination"
                onClick={() => onPageChange?.(page - 1)}
                disabled={!hasPrev}
              >
                Previous
              </button>
              <button
                type="button"
                className="e-logs-table__btn e-logs-table__btn--pagination"
                onClick={() => onPageChange?.(page + 1)}
                disabled={!hasNext}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function formatTime(value) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return isNaN(d.getTime()) ? "—" : d.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
}

export default ERequestLogsTable;

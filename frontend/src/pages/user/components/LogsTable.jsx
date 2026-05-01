import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./LogsTable.css";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "success", label: "Success" },
  { value: "failed", label: "Failed" },
  { value: "pending", label: "Pending" },
];

const PAGE_SIZE = 10;

const formatTs = (iso) => {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
};

const tsToDateOnly = (iso) => {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toISOString().slice(0, 10);
  } catch {
    return "";
  }
};

const templateName = (templates, id) => {
  if (id == null) return null;
  const t = templates?.find((x) => x.id === id);
  return t?.name || null;
};

const downloadFile = (filename, mime, data) => {
  const blob = new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const csvEscape = (val) => {
  if (val == null) return "";
  const s = String(val);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

const buildCsv = (rows, templates) => {
  const header = ["log_id", "document_id", "template_id", "template_name", "status", "timestamp"];
  const lines = [header.join(",")];
  rows.forEach((r) => {
    lines.push(
      [
        r.id,
        r.document_id,
        r.template_id ?? "",
        templateName(templates, r.template_id) ?? "",
        r.status,
        r.timestamp ?? "",
      ]
        .map(csvEscape)
        .join(",")
    );
  });
  return lines.join("\n");
};

function LogsTable({
  items,
  loading,
  error,
  templates,
  onViewOutput,
  onRetry,
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [templateFilter, setTemplateFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    const list = items || [];
    const q = search.trim().toLowerCase();
    return list.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (templateFilter !== "all" && String(row.template_id ?? "") !== templateFilter) return false;
      if (dateFrom) {
        const d = tsToDateOnly(row.timestamp);
        if (d && d < dateFrom) return false;
      }
      if (dateTo) {
        const d = tsToDateOnly(row.timestamp);
        if (d && d > dateTo) return false;
      }
      if (q) {
        const tName = (templateName(templates, row.template_id) || "").toLowerCase();
        const haystack = [
          String(row.id),
          String(row.document_id),
          String(row.template_id ?? ""),
          tName,
          row.status,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [items, search, statusFilter, templateFilter, dateFrom, dateTo, templates]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, statusFilter, templateFilter, dateFrom, dateTo, items]);

  const visible = filtered.slice(0, visibleCount);
  const hasFilters =
    search || statusFilter !== "all" || templateFilter !== "all" || dateFrom || dateTo;

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setTemplateFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  if (error) {
    return (
      <section className="user-logs" aria-label="API logs">
        <div className="user-logs__error" role="alert">
          <p className="user-logs__error-text">{error}</p>
          {onRetry ? (
            <button type="button" className="user-logs__retry" onClick={onRetry}>
              Retry
            </button>
          ) : null}
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="user-logs" aria-label="API logs" aria-busy="true">
        <div className="user-logs__shell user-logs__shell--loading">
          <div className="user-logs__skeleton-row" />
          <div className="user-logs__skeleton-row" />
          <div className="user-logs__skeleton-row" />
        </div>
      </section>
    );
  }

  const total = items?.length || 0;

  return (
    <section className="user-logs" aria-label="API logs">
      {total > 0 ? (
        <div className="user-logs__toolbar">
          <div className="user-logs__filters" role="search">
            <label className="user-logs__field user-logs__field--grow">
              <span className="user-logs__field-label">Search</span>
              <input
                type="search"
                placeholder="Filter by template, doc, status…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>

            <label className="user-logs__field">
              <span className="user-logs__field-label">Template</span>
              <select
                value={templateFilter}
                onChange={(e) => setTemplateFilter(e.target.value)}
              >
                <option value="all">All templates</option>
                {(templates || []).map((t) => (
                  <option key={t.id} value={String(t.id)}>
                    {t.name || `Template #${t.id}`}
                  </option>
                ))}
              </select>
            </label>

            <label className="user-logs__field">
              <span className="user-logs__field-label">Status</span>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="user-logs__field">
              <span className="user-logs__field-label">From</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                max={dateTo || undefined}
              />
            </label>

            <label className="user-logs__field">
              <span className="user-logs__field-label">To</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                min={dateFrom || undefined}
              />
            </label>
          </div>

          <div className="user-logs__actions">
            <button
              type="button"
              className="user-logs__btn user-logs__btn--ghost"
              onClick={clearFilters}
              disabled={!hasFilters}
            >
              Clear
            </button>
            <button
              type="button"
              className="user-logs__btn"
              onClick={() =>
                downloadFile(
                  `activity-${new Date().toISOString().slice(0, 10)}.csv`,
                  "text/csv",
                  buildCsv(filtered, templates)
                )
              }
              disabled={filtered.length === 0}
            >
              Export CSV
            </button>
            <button
              type="button"
              className="user-logs__btn user-logs__btn--ghost"
              onClick={() =>
                downloadFile(
                  `activity-${new Date().toISOString().slice(0, 10)}.json`,
                  "application/json",
                  JSON.stringify(filtered, null, 2)
                )
              }
              disabled={filtered.length === 0}
            >
              Export JSON
            </button>
          </div>
        </div>
      ) : null}

      <p className="user-logs__count" aria-live="polite">
        {total === 0
          ? ""
          : filtered.length === total
            ? `Showing ${Math.min(visibleCount, filtered.length)} of ${total}`
            : `Showing ${Math.min(visibleCount, filtered.length)} of ${filtered.length} (filtered from ${total})`}
      </p>

      <div className="user-logs__table-wrap">
        <table className="user-logs__table">
          <thead>
            <tr>
              <th scope="col">Log</th>
              <th scope="col">Template</th>
              <th scope="col">Document</th>
              <th scope="col">Timestamp</th>
              <th scope="col">Status</th>
              <th scope="col" className="user-logs__col-actions">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={6} className="user-logs__empty">
                  {total === 0 ? (
                    <div className="user-logs__empty-state">
                      <h3>No activity yet</h3>
                      <p>
                        Once you process a document, every run shows up here with status, template,
                        and the extracted output.
                      </p>
                      <Link className="user-logs__empty-cta" to="/user/documents">
                        Process your first document
                      </Link>
                    </div>
                  ) : (
                    <div className="user-logs__empty-state">
                      <h3>No matches</h3>
                      <p>Try widening your filters or clearing them.</p>
                      <button
                        type="button"
                        className="user-logs__empty-cta user-logs__empty-cta--ghost"
                        onClick={clearFilters}
                      >
                        Clear filters
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              visible.map((row) => {
                const tName = templateName(templates, row.template_id);
                return (
                  <tr key={row.id}>
                    <td data-label="Log">#{row.id}</td>
                    <td data-label="Template">
                      {tName ? (
                        <span className="user-logs__template-name" title={`Template #${row.template_id}`}>
                          {tName}
                        </span>
                      ) : (
                        <span className="user-logs__muted">#{row.template_id ?? "—"}</span>
                      )}
                    </td>
                    <td data-label="Document">#{row.document_id}</td>
                    <td data-label="Timestamp">{formatTs(row.timestamp)}</td>
                    <td data-label="Status">
                      <span className={`user-logs__status user-logs__status--${row.status}`}>
                        {row.status}
                      </span>
                    </td>
                    <td data-label="Actions">
                      <div className="user-logs__row-actions">
                        <button
                          type="button"
                          className="user-logs__action"
                          onClick={() => onViewOutput(row.id)}
                        >
                          View output
                        </button>
                        <Link
                          className="user-logs__action user-logs__action--ghost"
                          to="/user/documents"
                          title="Open document workspace"
                        >
                          Documents
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > visibleCount ? (
        <div className="user-logs__loadmore">
          <button
            type="button"
            className="user-logs__btn user-logs__btn--load"
            onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
          >
            Load {Math.min(PAGE_SIZE, filtered.length - visibleCount)} more
          </button>
        </div>
      ) : null}
    </section>
  );
}

export default LogsTable;

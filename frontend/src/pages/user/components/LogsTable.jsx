import "./LogsTable.css";

function formatTs(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function LogsTable({ items, loading, error, onViewOutput }) {
  if (error) {
    return (
      <section className="user-logs" aria-label="API logs">
        <p className="user-logs__error" role="alert">
          {error}
        </p>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="user-logs" aria-label="API logs">
        <div className="user-logs__shell user-logs__shell--loading">
          <div className="user-logs__skeleton-row" />
          <div className="user-logs__skeleton-row" />
          <div className="user-logs__skeleton-row" />
        </div>
      </section>
    );
  }

  const rows = items || [];

  return (
    <section className="user-logs" aria-label="API logs">
      <div className="user-logs__head">
        <h2 className="user-logs__title">Activity log</h2>
        <p className="user-logs__subtitle">Recent document processing for your organization</p>
      </div>
      <div className="user-logs__table-wrap">
        <table className="user-logs__table">
          <thead>
            <tr>
              <th scope="col">Log ID</th>
              <th scope="col">Template ID</th>
              <th scope="col">Document ID</th>
              <th scope="col">Timestamp</th>
              <th scope="col">Status</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="user-logs__empty">
                  No activity yet. Process a document to see entries here.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.template_id ?? "—"}</td>
                  <td>{row.document_id}</td>
                  <td>{formatTs(row.timestamp)}</td>
                  <td>
                    <span className={`user-logs__status user-logs__status--${row.status}`}>
                      {row.status}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="user-logs__action"
                      onClick={() => onViewOutput(row.id)}
                    >
                      View output
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default LogsTable;

/**
 * ETemplateTable - Table view for templates with sortable headers.
 * Displays: Name, Template ID, Document Type, Status, Last Updated, Actions.
 */
import "./ETemplateTable.css";

function ETemplateTable({ templates, sortBy, sortDir, onSort, onEdit, onTrain, onViewApi }) {
  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return iso;
    }
  };

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return <span className="e-template-table-sort-icon">↕</span>;
    return (
      <span className="e-template-table-sort-icon e-template-table-sort-icon--active">
        {sortDir === "asc" ? "↑" : "↓"}
      </span>
    );
  };

  const Th = ({ field, label }) => (
    <th>
      <button
        type="button"
        className="e-template-table-th-btn"
        onClick={() => onSort && onSort(field)}
      >
        {label}
        <SortIcon field={field} />
      </button>
    </th>
  );

  return (
    <div className="e-template-table-wrap">
      <table className="e-template-table">
        <thead>
          <tr>
            <Th field="name" label="Template Name" />
            <Th field="templateId" label="Template ID" />
            <Th field="documentType" label="Document Type" />
            <Th field="status" label="Status" />
            <Th field="lastUpdated" label="Last Updated" />
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {templates.map((t) => (
            <tr key={t.id}>
              <td>
                <span className="e-template-table-name">{t.name}</span>
              </td>
              <td>
                <code className="e-template-table-id">{t.templateId}</code>
              </td>
              <td>{t.documentType}</td>
              <td>
                <span
                  className={
                    t.status === "Active"
                      ? "e-template-table-status e-template-table-status--active"
                      : t.status === "Training"
                        ? "e-template-table-status e-template-table-status--training"
                        : "e-template-table-status e-template-table-status--disabled"
                  }
                >
                  {t.status}
                </span>
              </td>
              <td>{formatDate(t.lastUpdated)}</td>
              <td>
                <div className="e-template-table-actions">
                  {onEdit && (
                    <button type="button" className="e-template-table-action" onClick={() => onEdit(t)}>
                      Edit
                    </button>
                  )}
                  {t.status === "Active" && onTrain && (
                    <button type="button" className="e-template-table-action" onClick={() => onTrain(t)}>
                      Train
                    </button>
                  )}
                  {onViewApi && (
                    <button type="button" className="e-template-table-action" onClick={() => onViewApi(t)}>
                      API
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ETemplateTable;

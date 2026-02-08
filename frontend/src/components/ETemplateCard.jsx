/**
 * ETemplateCard - Single template card for card layout.
 * Displays name, ID, document type, status, last updated.
 */
import "./ETemplateCard.css";

function ETemplateCard({ template, onEdit, onTrain, onViewApi }) {
  const statusClass =
    template.status === "Active"
      ? "e-template-card-status--active"
      : template.status === "Training"
        ? "e-template-card-status--training"
        : "e-template-card-status--disabled";

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

  return (
    <div className="e-template-card glass-card">
      <div className="e-template-card-header">
        <h3 className="e-template-card-name">{template.name}</h3>
        <span className={`e-template-card-status ${statusClass}`}>{template.status}</span>
      </div>
      <div className="e-template-card-meta">
        <span className="e-template-card-id" title={template.templateId}>
          ID: {template.templateId}
        </span>
        <span className="e-template-card-type">{template.documentType}</span>
      </div>
      <div className="e-template-card-footer">
        <span className="e-template-card-date">Updated {formatDate(template.lastUpdated)}</span>
        <div className="e-template-card-actions">
          {onEdit && (
            <button type="button" className="e-template-card-btn" onClick={() => onEdit(template)}>
              Edit
            </button>
          )}
          {template.status === "Active" && onTrain && (
            <button type="button" className="e-template-card-btn" onClick={() => onTrain(template)}>
              Train
            </button>
          )}
          {onViewApi && (
            <button type="button" className="e-template-card-btn" onClick={() => onViewApi(template)}>
              API
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ETemplateCard;

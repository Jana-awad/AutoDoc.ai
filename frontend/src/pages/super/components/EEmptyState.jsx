import "./EEmptyState.css";

/**
 * Empty state for lists and sections.
 * @param {string} [message] - Primary message
 * @param {string} [submessage] - Secondary text
 * @param {React.ReactNode} [icon] - Optional icon element
 */
function EEmptyState({ message = "No data yet", submessage, icon }) {
  return (
    <div className="e-empty-state">
      {icon && <div className="e-empty-state-icon">{icon}</div>}
      <p className="e-empty-state-message">{message}</p>
      {submessage && <p className="e-empty-state-sub">{submessage}</p>}
    </div>
  );
}

export default EEmptyState;

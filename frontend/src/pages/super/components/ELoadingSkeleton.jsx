import "./ELoadingSkeleton.css";

/**
 * Loading skeleton for cards and list items.
 * @param {string} [variant] - 'card' | 'metric' | 'row' | 'list'
 * @param {number} [lines] - For list/row, number of placeholder lines
 * @param {string} [className] - Extra class names
 */
function ELoadingSkeleton({ variant = "card", lines = 4, className = "" }) {
  if (variant === "metric") {
    return (
      <div className={`e-skeleton e-skeleton-metric ${className}`.trim()}>
        <span className="e-skeleton-line e-skeleton-title" />
        <span className="e-skeleton-line e-skeleton-value" />
        <span className="e-skeleton-line e-skeleton-sub" />
      </div>
    );
  }

  if (variant === "row") {
    return (
      <div className={`e-skeleton e-skeleton-row ${className}`.trim()}>
        <span className="e-skeleton-line" />
        <span className="e-skeleton-line" />
        <span className="e-skeleton-line" />
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className={`e-skeleton e-skeleton-list ${className}`.trim()}>
        {Array.from({ length: lines }, (_, i) => (
          <div key={i} className="e-skeleton-list-item">
            <span className="e-skeleton-line" />
            <span className="e-skeleton-line short" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`e-skeleton e-skeleton-card ${className}`.trim()}>
      <span className="e-skeleton-line e-skeleton-heading" />
      <span className="e-skeleton-line" />
      <span className="e-skeleton-line" />
      <span className="e-skeleton-line short" />
    </div>
  );
}

export default ELoadingSkeleton;

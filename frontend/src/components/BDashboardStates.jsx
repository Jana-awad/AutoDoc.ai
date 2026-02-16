export const BCardState = ({ title, message, actionLabel, onAction, type = "info" }) => {
  return (
    <div className={`bdashboard-state bdashboard-state--${type}`}>
      <div className="bdashboard-state__content">
        {title && <h4 className="bdashboard-state__title">{title}</h4>}
        {message && <p className="bdashboard-state__message">{message}</p>}
      </div>
      {actionLabel && onAction && (
        <button type="button" className="bdashboard-state__action btn btn-secondary" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export const BSkeletonGrid = ({ count = 4 }) => {
  return (
    <div className="bdashboard-skeleton-grid">
      {Array.from({ length: count }).map((_, index) => (
        <div key={`skeleton-${index}`} className="bdashboard-skeleton-card" />
      ))}
    </div>
  );
};

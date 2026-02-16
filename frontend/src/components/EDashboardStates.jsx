export const ECardState = ({ title, message, actionLabel, onAction, type = "info" }) => {
  return (
    <div className={`edashboard-state edashboard-state--${type}`}>
      <div className="edashboard-state__content">
        {title && <h4 className="edashboard-state__title">{title}</h4>}
        {message && <p className="edashboard-state__message">{message}</p>}
      </div>
      {actionLabel && onAction && (
        <button type="button" className="edashboard-state__action btn btn-secondary" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export const ESkeletonGrid = ({ count = 4 }) => {
  return (
    <div className="edashboard-skeleton-grid">
      {Array.from({ length: count }).map((_, index) => (
        <div key={`skeleton-${index}`} className="edashboard-skeleton-card" />
      ))}
    </div>
  );
};

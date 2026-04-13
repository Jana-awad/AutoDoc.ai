function EDashboardCard({ title, subtitle, actions, className = "", children }) {
  return (
    <section className={`edashboard-card glass-card ${className}`}>
      {(title || actions) && (
        <header className="edashboard-card__header">
          <div>
            {title && <h3 className="edashboard-card__title">{title}</h3>}
            {subtitle && <p className="edashboard-card__subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="edashboard-card__actions">{actions}</div>}
        </header>
      )}
      <div className="edashboard-card__body">{children}</div>
    </section>
  );
}

export default EDashboardCard;

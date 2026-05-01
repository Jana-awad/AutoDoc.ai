function BDashboardCard({ title, subtitle, actions, className = "", children }) {
  return (
    <section className={`bdashboard-card glass-card ${className}`}>
      {(title || actions) && (
        <header className="bdashboard-card__header">
          <div>
            {title && <h3 className="bdashboard-card__title">{title}</h3>}
            {subtitle && <p className="bdashboard-card__subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="bdashboard-card__actions">{actions}</div>}
        </header>
      )}
      <div className="bdashboard-card__body">
        <div className="bdashboard-card__body-scroll">
          <div className="bdashboard-card__body-content">{children}</div>
        </div>
      </div>
    </section>
  );
}

export default BDashboardCard;

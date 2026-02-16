import { Link } from "react-router-dom";
import "./EDashboardCard.css";

/**
 * Glassmorphism card wrapper for dashboard sections.
 * @param {string} title - Card heading
 * @param {React.ReactNode} children - Card content
 * @param {string} [badge] - Optional badge text (e.g. "Live", "24/7")
 * @param {string} [className] - Extra class names
 * @param {string} [actionHref] - Optional external link
 * @param {string} [actionTo] - Optional internal route (uses React Router Link)
 * @param {string} [actionLabel] - Label for action link
 */
function EDashboardCard({ title, children, badge, className = "", actionHref, actionTo, actionLabel }) {
  const hasAction = (actionHref || actionTo) && actionLabel;
  return (
    <section className={`e-dashboard-card ${className}`.trim()}>
      <div className="e-dashboard-card-header">
        <h3 className="e-dashboard-card-title">{title}</h3>
        {badge && <span className="e-dashboard-card-badge">{badge}</span>}
        {hasAction && actionTo && (
          <Link to={actionTo} className="e-dashboard-card-action">
            {actionLabel}
          </Link>
        )}
        {hasAction && actionHref && !actionTo && (
          <a href={actionHref} className="e-dashboard-card-action">
            {actionLabel}
          </a>
        )}
      </div>
      <div className="e-dashboard-card-body">{children}</div>
    </section>
  );
}

export default EDashboardCard;

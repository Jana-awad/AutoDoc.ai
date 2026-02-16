import "./EDashboardHeader.css";

/**
 * Dashboard page header with title, description, and welcome back with user name.
 */
function EDashboardHeader({ title = "Super Dashboard", description, userName }) {
  return (
    <header className="e-dashboard-header">
      <div className="e-dashboard-header-welcome">
        <h1 className="e-dashboard-header-title">
          {userName ? `Welcome back, ${userName}` : title}
        </h1>
        {userName && (
          <p className="e-dashboard-header-subtitle">
            {description || "Here’s what’s happening across your platform."}
          </p>
        )}
      </div>
      {!userName && (
        <p className="e-dashboard-header-desc">
          {description || "Manage platform analytics, health, and compliance."}
        </p>
      )}
    </header>
  );
}

export default EDashboardHeader;

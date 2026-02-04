import { Link } from "react-router-dom";
import "./Edashboard.css";

function EDashboard() {
  return (
    <div className="enterprise-dashboard">
      <nav className="enterprise-nav">
        <div className="enterprise-nav-brand">AutoDoc.ai Enterprise</div>
        <div className="enterprise-nav-links">
          <Link to="/enterprise" className="enterprise-nav-link">Dashboard</Link>
          <Link to="/enterprise/template" className="enterprise-nav-link">Templates</Link>
          <Link to="/enterprise/api" className="enterprise-nav-link">API</Link>
          <Link to="/enterprise/profile" className="enterprise-nav-link">Profile</Link>
        </div>
      </nav>
      <main className="enterprise-dashboard-main">
        <h1>Enterprise Dashboard</h1>
        <p>Manage your enterprise workspace and settings.</p>
      </main>
    </div>
  );
}

export default EDashboard;
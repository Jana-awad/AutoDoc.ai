import { Link } from "react-router-dom";
import "./B_dashboard.css";

function BDashboard() {
  return (
    <div className="business-dashboard">
      <nav className="business-nav">
        <div className="business-nav-brand">AutoDoc.ai Business</div>
        <div className="business-nav-links">
          <Link to="/business" className="business-nav-link">Dashboard</Link>
          <Link to="/business/api" className="business-nav-link">API</Link>
          <Link to="/business/profile" className="business-nav-link">Profile</Link>
        </div>
      </nav>
      <main className="business-dashboard-main">
        <h1>Business Dashboard</h1>
        <p>Overview of your business account.</p>
      </main>
    </div>
  );
}

export default BDashboard;
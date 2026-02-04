import SuperNav from "../../components/SuperNav";
import "./monitoring.css";

function Monitoring() {
  return (
    <div className="super-monitoring">
      <SuperNav
        userName="Super Admin"
        userEmail="admin@autodoc.ai"
        onLogout={() => {}}
        onSettings={() => {}}
        onSearch={() => {}}
      />
      <main className="super-monitoring-main">
        <div className="container">
          <h1>Monitoring</h1>
          <p>Track platform health, usage trends, and system alerts.</p>
        </div>
      </main>
    </div>
  );
}

export default Monitoring;

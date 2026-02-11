import Enavbar from "../../components/Enavbar";
import "./Edashboard.css";

function EDashboard() {
  return (
    <div className="enterprise-dashboard">
      <Enavbar />
      <main className="enterprise-dashboard-main">
        <h1>Enterprise Dashboard</h1>
        <p>Manage your enterprise workspace and settings.</p>
      </main>
    </div>
  );
}

export default EDashboard;
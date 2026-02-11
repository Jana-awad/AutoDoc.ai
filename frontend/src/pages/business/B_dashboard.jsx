import Bnavbar from "../../components/Bnavbar";
import "./B_dashboard.css";

function BDashboard() {
  return (
    <div className="business-dashboard">
      <Bnavbar />
      <main className="business-dashboard-main">
        <h1>Business Dashboard</h1>
        <p>Overview of your business account.</p>
      </main>
    </div>
  );
}

export default BDashboard;
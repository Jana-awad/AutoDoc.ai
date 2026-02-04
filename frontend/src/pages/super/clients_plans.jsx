import SuperNav from "../../components/SuperNav";
import "./clients_plans.css";

function ClientsPlans() {
  return (
    <div className="super-clients-plans">
      <SuperNav
        userName="Super Admin"
        userEmail="admin@autodoc.ai"
        onLogout={() => {}}
        onSettings={() => {}}
        onSearch={() => {}}
      />
      <main className="super-clients-plans-main">
        <div className="container">
          <h1>Clients &amp; Plans</h1>
          <p>Manage accounts, subscriptions, and plan allocations.</p>
        </div>
      </main>
    </div>
  );
}

export default ClientsPlans;

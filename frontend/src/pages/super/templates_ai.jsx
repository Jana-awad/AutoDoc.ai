import SuperNav from "../../components/SuperNav";
import "./templates_ai.css";

function TemplatesAi() {
  return (
    <div className="super-templates-ai">
      <SuperNav
        userName="Super Admin"
        userEmail="admin@autodoc.ai"
        onLogout={() => {}}
        onSettings={() => {}}
        onSearch={() => {}}
      />
      <main className="super-templates-ai-main">
        <div className="container">
          <h1>Templates AI</h1>
          <p>Organize extraction templates and AI workflows.</p>
        </div>
      </main>
    </div>
  );
}

export default TemplatesAi;

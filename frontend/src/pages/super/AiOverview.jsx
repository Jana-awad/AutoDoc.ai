import { Sparkles } from "lucide-react";
import "../../components/variables.css";
import SuperNav from "../../components/SuperNav";
import "./AiOverview.css";

function AiOverview() {
  return (
    <div className="super-ai-overview">
      <SuperNav
        userName="Super Admin"
        userEmail="admin@autodoc.ai"
        onLogout={() => {}}
        onSettings={() => {}}
      />
      <main className="super-ai-overview-main">
        <div className="super-ai-overview-container">
          <header className="super-ai-overview-header">
            <div className="super-ai-overview-header-icon">
              <Sparkles size={32} strokeWidth={1.5} />
            </div>
            <h1 className="super-ai-overview-title">AI overview</h1>
            <p className="super-ai-overview-subtitle">
              AI pipeline and extraction insights. Monitor model usage, accuracy, and
              extraction metrics.
            </p>
          </header>
          <section className="super-ai-overview-placeholder">
            <p>This page will show AI pipeline metrics and extraction insights.</p>
          </section>
        </div>
      </main>
    </div>
  );
}

export default AiOverview;

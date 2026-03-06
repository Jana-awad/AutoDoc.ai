import { FolderOpen } from "lucide-react";
import "../../components/variables.css";
import SuperNav from "../../components/SuperNav";
import "./TemplatesManager.css";

function TemplatesManager() {
  return (
    <div className="super-templates-manager">
      <SuperNav
        userName="Super Admin"
        userEmail="admin@autodoc.ai"
        onLogout={() => {}}
        onSettings={() => {}}
        onSearch={() => {}}
      />
      <main className="super-templates-manager-main">
        <div className="super-templates-manager-container">
          <header className="super-templates-manager-header">
            <div className="super-templates-manager-header-icon">
              <FolderOpen size={32} strokeWidth={1.5} />
            </div>
            <h1 className="super-templates-manager-title">Templates manager</h1>
            <p className="super-templates-manager-subtitle">
              Manage and organize your extraction templates. View, edit, and assign templates
              to clients.
            </p>
          </header>
          <section className="super-templates-manager-placeholder">
            <p>This page will list and manage all templates.</p>
          </section>
        </div>
      </main>
    </div>
  );
}

export default TemplatesManager;

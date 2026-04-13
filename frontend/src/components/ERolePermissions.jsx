/**
 * ERolePermissions - Role-based access: Admin, Editor, Viewer.
 */
import "./ERolePermissions.css";

const ROLES = [
  {
    role: "Admin",
    description: "Full access: create, edit, delete templates; manage users and settings.",
    permissions: ["Templates", "Training", "API keys", "Users", "Audit log", "Billing"],
  },
  {
    role: "Editor",
    description: "Create and edit templates; run training; view API usage.",
    permissions: ["Templates", "Training", "API usage", "Support"],
  },
  {
    role: "Viewer",
    description: "View templates and usage only; no changes.",
    permissions: ["Templates (read)", "Usage analytics", "Support"],
  },
];

function ERolePermissions({ currentRole = "Admin" }) {
  return (
    <div className="e-role-permissions glass-card">
      <h3 className="e-role-permissions-title">Roles & permissions</h3>
      <p className="e-role-permissions-desc">
        Your role: <strong>{currentRole}</strong>
      </p>
      <div className="e-role-permissions-list">
        {ROLES.map((r) => (
          <div
            key={r.role}
            className={`e-role-permissions-item ${currentRole === r.role ? "e-role-permissions-item--current" : ""}`}
          >
            <div className="e-role-permissions-role">{r.role}</div>
            <p className="e-role-permissions-desc-item">{r.description}</p>
            <ul className="e-role-permissions-badges">
              {r.permissions.map((p) => (
                <li key={p} className="e-role-permissions-badge">
                  {p}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ERolePermissions;

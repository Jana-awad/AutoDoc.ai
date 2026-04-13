import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import {
  createEnterpriseUser,
  fetchEnterpriseUsers,
  removeEnterpriseUser,
  updateEnterpriseUser,
} from "../../../services/enterpriseProfileApi";
import { formatDate, formatText } from "../../../utils/profileFormatters";

const EManageUsers = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", email: "", role: "user", password: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = useCallback(
    async (signal) => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchEnterpriseUsers({ token, signal });
        const nextUsers = Array.isArray(data) ? data : data?.users || [];
        setUsers(nextUsers);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Unable to load users.");
          setUsers([]);
        }
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchUsers(controller.signal);
    return () => controller.abort();
  }, [fetchUsers]);

  const handleAddUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const name = addForm.name.trim();
      const email = addForm.email.trim();
      const role = addForm.role;
      const password = addForm.password.trim();
      if (!name || !email) {
        setError("Please provide a name and email address.");
        setSubmitting(false);
        return;
      }
      if (!role) {
        setError("Please select a role.");
        setSubmitting(false);
        return;
      }
      if (!password) {
        setError("Please provide a password.");
        setSubmitting(false);
        return;
      }
      await createEnterpriseUser({ token, data: { name, email, role, password } });
      setShowAddModal(false);
      setAddForm({ name: "", email: "", role: "user", password: "" });
      fetchUsers();
    } catch (err) {
      setError(err.message || "Unable to add user.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setError(null);
    try {
      await updateEnterpriseUser({ token, userId, data: { role: newRole } });
      fetchUsers();
    } catch (err) {
      setError(err.message || "Unable to update role.");
    }
  };

  const handleStatusToggle = async (user) => {
    const nextStatus = user.status === "active" ? "inactive" : "active";
    if (!window.confirm(`${nextStatus === "inactive" ? "Deactivate" : "Activate"} this user?`)) return;
    setError(null);
    try {
      await updateEnterpriseUser({ token, userId: user.id, data: { status: nextStatus } });
      fetchUsers();
    } catch (err) {
      setError(err.message || "Unable to update status.");
    }
  };

  const handleRemove = async (userId) => {
    if (!window.confirm("Remove this user permanently?")) return;
    setError(null);
    try {
      await removeEnterpriseUser({ token, userId });
      fetchUsers();
    } catch (err) {
      setError(err.message || "Unable to remove user.");
    }
  };

  const stats = useMemo(() => {
    const activeCount = users.filter((u) => u?.status === "active").length;
    const adminCount = users.filter((u) => String(u?.role || "").toLowerCase() === "enterprise_admin").length;
    return { activeCount, adminCount };
  }, [users]);

  if (loading) {
    return (
      <div>
        <div className="b-page-header">
          <div className="b-skeleton" style={{ width: 200, height: 32, marginBottom: 8 }} />
          <div className="b-skeleton" style={{ width: 320, height: 16 }} />
        </div>
        <div className="b-glass-section">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="b-skeleton" style={{ width: "100%", height: 48, marginBottom: 8, borderRadius: 8 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="b-page-header">
        <h1>Manage Users</h1>
        <p>Add, edit roles, and manage team member access for your organization.</p>
      </div>

      {error && (
        <div className="b-glass-section" style={{ borderColor: "rgba(220,38,38,0.3)", marginBottom: "var(--space-4)" }}>
          <p style={{ color: "#dc2626", fontSize: "var(--font-size-sm)" }}>⚠ {error}</p>
        </div>
      )}

      <div className="b-stat-row">
        <div className="b-stat-card">
          <div className="b-stat-value">{users.length}</div>
          <div className="b-stat-label">Total Users</div>
        </div>
        <div className="b-stat-card">
          <div className="b-stat-value">{stats.activeCount}</div>
          <div className="b-stat-label">Active</div>
        </div>
        <div className="b-stat-card">
          <div className="b-stat-value">{stats.adminCount}</div>
          <div className="b-stat-label">Admins</div>
        </div>
      </div>

      <div className="b-glass-section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
          <h2>Team Members</h2>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ fontSize: "var(--font-size-sm)" }}>
            + Add Member
          </button>
        </div>

        {users.length === 0 ? (
          <p style={{ color: "var(--color-gray-500)", textAlign: "center", padding: "var(--space-8)" }}>
            No team members yet. Add your first member to get started.
          </p>
        ) : (
          <div className="b-table-wrap">
            <table className="b-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const statusLabel = formatText(user?.status);
                  const statusClass =
                    user?.status === "active" ? "b-badge-active" : user?.status === "inactive" ? "b-badge-inactive" : "";
                  return (
                    <tr key={user.id}>
                      <td style={{ fontWeight: 600 }}>{formatText(user.name)}</td>
                      <td>{formatText(user.email)}</td>
                      <td>
                        <select
                          className="b-form-select"
                          value={user.role || ""}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          style={{ width: "auto", padding: "4px 8px", fontSize: 12 }}
                        >
                          <option value="">—</option>
                          <option value="enterprise_admin">Enterprise Admin</option>
                          <option value="user">User</option>
                        </select>
                      </td>
                      <td>
                        <span className={`b-badge ${statusClass}`}>{statusLabel}</span>
                      </td>
                      <td style={{ fontSize: "var(--font-size-xs)", color: "var(--color-gray-500)" }}>
                        {formatDate(user.joinedAt)}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="b-action-btn b-action-btn-edit" onClick={() => handleStatusToggle(user)}>
                            {user.status === "active" ? "Deactivate" : "Activate"}
                          </button>
                          <button className="b-action-btn b-action-btn-danger" onClick={() => handleRemove(user.id)}>
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="b-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="b-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add New Member</h2>
            <form onSubmit={handleAddUser}>
              <div className="b-form-grid">
                <div className="b-form-group">
                  <label className="b-form-label">Full Name *</label>
                  <input
                    className="b-form-input"
                    required
                    value={addForm.name}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="b-form-group">
                  <label className="b-form-label">Email Address *</label>
                  <input
                    className="b-form-input"
                    type="email"
                    required
                    value={addForm.email}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="b-form-group">
                  <label className="b-form-label">Password *</label>
                  <input
                    className="b-form-input"
                    type="password"
                    required
                    value={addForm.password}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, password: e.target.value }))}
                  />
                </div>
                <div className="b-form-group">
                  <label className="b-form-label">Role</label>
                  <select
                    className="b-form-select"
                    required
                    value={addForm.role}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, role: e.target.value }))}
                  >
                    <option value="" disabled>Select role</option>
                    <option value="user">User</option>
                    <option value="enterprise_admin">Enterprise Admin</option>
                  </select>
                </div>
              </div>
              <div className="b-form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Adding…" : "Add Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EManageUsers;

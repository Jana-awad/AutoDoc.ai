import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import {
  fetchBusinessAccountInfo,
  updateBusinessAccountInfo,
  changeBusinessPassword,
} from "../../../services/businessDashboardApi";
import { formatNumber, formatText, pickValue } from "../../../utils/profileFormatters";

const BAccountInfo = () => {
  const { token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(false);
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    address: "",
    website: "",
  });

  const fetchProfile = useCallback(
    async (signal) => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchBusinessAccountInfo({ token, signal });
        setProfile(data || null);
        setForm({
          name: data?.name || "",
          email: data?.email || "",
          company: data?.company || "",
          phone: data?.phone || "",
          address: data?.address || "",
          website: data?.website || "",
        });
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Unable to load account info.");
        }
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchProfile(controller.signal);
    return () => controller.abort();
  }, [fetchProfile]);

  const handleSavePersonal = async () => {
    setSavingPersonal(true);
    setError(null);
    try {
      await updateBusinessAccountInfo({
        token,
        data: {
          name: form.name,
          email: form.email,
          phone: form.phone,
          website: form.website,
        },
      });
      setEditingPersonal(false);
      fetchProfile();
    } catch (err) {
      setError(err.message || "Unable to save changes.");
    } finally {
      setSavingPersonal(false);
    }
  };

  const handleSaveCompany = async () => {
    setSavingCompany(true);
    setError(null);
    try {
      await updateBusinessAccountInfo({
        token,
        data: {
          company: form.company,
          address: form.address,
        },
      });
      setEditingCompany(false);
      fetchProfile();
    } catch (err) {
      setError(err.message || "Unable to save company details.");
    } finally {
      setSavingCompany(false);
    }
  };

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handlePasswordChange = (field, value) => {
    setPasswordError(null);
    setPasswordSuccess(false);
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleChangePassword = async () => {
    setPasswordError(null);
    setPasswordSuccess(false);
    const { currentPassword, newPassword, confirmPassword } = passwordForm;
    if (!currentPassword?.trim()) {
      setPasswordError("Enter your current password.");
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword.length > 72) {
      setPasswordError("New password must be at most 72 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }
    if (currentPassword === newPassword) {
      setPasswordError("New password must be different from current password.");
      return;
    }
    setSavingPassword(true);
    try {
      await changeBusinessPassword({ token, currentPassword, newPassword });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordSuccess(true);
    } catch (err) {
      setPasswordError(err.message || "Failed to change password.");
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="b-page-header">
          <div className="b-skeleton" style={{ width: 200, height: 32, marginBottom: 8 }} />
          <div className="b-skeleton" style={{ width: 300, height: 16 }} />
        </div>
        {[1, 2].map((i) => (
          <div key={i} className="b-glass-section">
            <div className="b-skeleton" style={{ width: 160, height: 20, marginBottom: 16 }} />
            <div className="b-form-grid">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="b-form-group">
                  <div className="b-skeleton" style={{ width: 80, height: 14, marginBottom: 6 }} />
                  <div className="b-skeleton" style={{ width: "100%", height: 40 }} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const planName = formatText(pickValue(profile?.planName, profile?.plan, profile?.subscription?.plan));
  const totalUsers = formatNumber(pickValue(profile?.totalUsers, profile?.usersCount, profile?.userCount));
  const docsProcessed = formatNumber(pickValue(profile?.docsProcessed, profile?.documentsProcessed));
  const apiCalls = formatNumber(pickValue(profile?.apiCalls, profile?.monthlyApiCalls, profile?.apiCallsMonthly));

  return (
    <div>
      <div className="b-page-header">
        <h1>Account Info</h1>
        <p>Manage your business account, company details, and subscription overview.</p>
      </div>

      {error && (
        <div className="b-glass-section" style={{ borderColor: "rgba(220,38,38,0.3)", marginBottom: "var(--space-4)" }}>
          <p style={{ color: "#dc2626", fontSize: "var(--font-size-sm)" }}>⚠ {error}</p>
        </div>
      )}

      <div className="b-stat-row">
        <div className="b-stat-card">
          <div className="b-stat-value">{planName}</div>
          <div className="b-stat-label">Current Plan</div>
        </div>
        <div className="b-stat-card">
          <div className="b-stat-value">{totalUsers}</div>
          <div className="b-stat-label">Total Users</div>
        </div>
        <div className="b-stat-card">
          <div className="b-stat-value">{docsProcessed}</div>
          <div className="b-stat-label">Documents Processed</div>
        </div>
        <div className="b-stat-card">
          <div className="b-stat-value">{apiCalls}</div>
          <div className="b-stat-label">API Calls (month)</div>
        </div>
      </div>

      <div className="b-glass-section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
          <h2>Personal Information</h2>
          {!editingPersonal && (
            <button
              className="btn btn-secondary"
              onClick={() => setEditingPersonal(true)}
              style={{ fontSize: "var(--font-size-sm)" }}
            >
              Edit Personal Info
            </button>
          )}
        </div>
        <div className="b-form-grid">
          <div className="b-form-group">
            <label className="b-form-label">Full Name</label>
            <input
              className="b-form-input"
              value={form.name}
              disabled={!editingPersonal}
              onChange={(e) => handleChange("name", e.target.value)}
            />
          </div>
          <div className="b-form-group">
            <label className="b-form-label">Email Address</label>
            <input
              className="b-form-input"
              value={form.email}
              disabled={!editingPersonal}
              onChange={(e) => handleChange("email", e.target.value)}
            />
          </div>
          <div className="b-form-group">
            <label className="b-form-label">Phone</label>
            <input
              className="b-form-input"
              value={form.phone}
              disabled={!editingPersonal}
              onChange={(e) => handleChange("phone", e.target.value)}
            />
          </div>
          <div className="b-form-group">
            <label className="b-form-label">Website</label>
            <input
              className="b-form-input"
              value={form.website}
              disabled={!editingPersonal}
              onChange={(e) => handleChange("website", e.target.value)}
            />
          </div>
        </div>
        {editingPersonal && (
          <div className="b-form-actions">
            <button
              className="btn btn-secondary"
              onClick={() => {
                setEditingPersonal(false);
                fetchProfile();
              }}
            >
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSavePersonal} disabled={savingPersonal}>
              {savingPersonal ? "Saving…" : "Save Changes"}
            </button>
          </div>
        )}
      </div>

      <div className="b-glass-section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
          <h2>Company Details</h2>
          {!editingCompany && (
            <button
              className="btn btn-secondary"
              onClick={() => setEditingCompany(true)}
              style={{ fontSize: "var(--font-size-sm)" }}
            >
              Edit Company
            </button>
          )}
        </div>
        <div className="b-form-grid">
          <div className="b-form-group">
            <label className="b-form-label">Company Name</label>
            <input
              className="b-form-input"
              value={form.company}
              disabled={!editingCompany}
              onChange={(e) => handleChange("company", e.target.value)}
            />
          </div>
          <div className="b-form-group full-width">
            <label className="b-form-label">Address</label>
            <input
              className="b-form-input"
              value={form.address}
              disabled={!editingCompany}
              onChange={(e) => handleChange("address", e.target.value)}
            />
          </div>
        </div>
        {editingCompany && (
          <div className="b-form-actions">
            <button
              className="btn btn-secondary"
              onClick={() => {
                setEditingCompany(false);
                fetchProfile();
              }}
            >
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSaveCompany} disabled={savingCompany}>
              {savingCompany ? "Saving…" : "Save Company"}
            </button>
          </div>
        )}
      </div>

      <div className="b-glass-section">
        <h2 style={{ marginBottom: "var(--space-4)" }}>Change Password</h2>
        <p style={{ fontSize: "var(--font-size-sm)", color: "var(--text-muted)", marginBottom: "var(--space-4)" }}>
          Update your password. Use at least 8 characters; we recommend a mix of letters, numbers, and symbols.
        </p>
        {passwordError && (
          <p style={{ color: "#dc2626", fontSize: "var(--font-size-sm)", marginBottom: "var(--space-3)" }}>
            ⚠ {passwordError}
          </p>
        )}
        {passwordSuccess && (
          <p style={{ color: "var(--success, #16a34a)", fontSize: "var(--font-size-sm)", marginBottom: "var(--space-3)" }}>
            Password updated successfully.
          </p>
        )}
        <div className="b-form-grid">
          <div className="b-form-group full-width">
            <label className="b-form-label">Current password</label>
            <input
              type="password"
              className="b-form-input"
              placeholder="Enter current password"
              value={passwordForm.currentPassword}
              onChange={(e) => handlePasswordChange("currentPassword", e.target.value)}
              autoComplete="current-password"
              disabled={savingPassword}
            />
          </div>
          <div className="b-form-group">
            <label className="b-form-label">New password</label>
            <input
              type="password"
              className="b-form-input"
              placeholder="At least 8 characters"
              value={passwordForm.newPassword}
              onChange={(e) => handlePasswordChange("newPassword", e.target.value)}
              autoComplete="new-password"
              disabled={savingPassword}
            />
          </div>
          <div className="b-form-group">
            <label className="b-form-label">Confirm new password</label>
            <input
              type="password"
              className="b-form-input"
              placeholder="Re-enter new password"
              value={passwordForm.confirmPassword}
              onChange={(e) => handlePasswordChange("confirmPassword", e.target.value)}
              autoComplete="new-password"
              disabled={savingPassword}
            />
          </div>
        </div>
        <div className="b-form-actions" style={{ marginTop: "var(--space-4)" }}>
          <button
            className="btn btn-primary"
            onClick={handleChangePassword}
            disabled={savingPassword}
          >
            {savingPassword ? "Updating…" : "Change Password"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BAccountInfo;

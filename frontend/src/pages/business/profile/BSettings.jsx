import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import {
  fetchBusinessSettings,
  updateBusinessSettings,
} from "../../../services/businessDashboardApi";

const defaultSettings = {
  workspaceName: "",
  timezone: "",
  twoFactorEnabled: false,
  sessionTimeout: "",
  apiRateLimit: "",
  webhookUrl: "",
  emailNotifications: false,
  activityAlerts: false,
  billingAlerts: false,
  securityAlerts: false,
};

const normalizeNumber = (value) => {
  if (value === "" || value === null || value === undefined) return "";
  const parsed = Number(value);
  return Number.isNaN(parsed) ? "" : parsed;
};

/** Normalize API settings so number fields are "" when empty for controlled inputs */
const normalizeSettingsFromApi = (data) => {
  if (!data || typeof data !== "object") return defaultSettings;
  return {
    ...defaultSettings,
    ...data,
    sessionTimeout: data.sessionTimeout ?? data.session_timeout ?? "",
    apiRateLimit: data.apiRateLimit ?? data.api_rate_limit ?? "",
  };
};

/** Payload for PUT: send numbers where applicable, empty strings as null */
const settingsToPayload = (s) => ({
  workspaceName: s.workspaceName || null,
  timezone: s.timezone || null,
  twoFactorEnabled: s.twoFactorEnabled,
  sessionTimeout: normalizeNumber(s.sessionTimeout) === "" ? null : Number(s.sessionTimeout),
  apiRateLimit: normalizeNumber(s.apiRateLimit) === "" ? null : Number(s.apiRateLimit),
  webhookUrl: s.webhookUrl || null,
  emailNotifications: s.emailNotifications,
  activityAlerts: s.activityAlerts,
  billingAlerts: s.billingAlerts,
  securityAlerts: s.securityAlerts,
});

const BSettings = () => {
  const { token } = useAuth();
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const fetchSettings = useCallback(
    async (signal) => {
      setLoading(true);
      setError(null);
      setSuccess(false);
      try {
        const data = await fetchBusinessSettings({ token, signal });
        setSettings(normalizeSettingsFromApi(data));
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Unable to load settings.");
          setSettings(defaultSettings);
        }
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchSettings(controller.signal);
    return () => controller.abort();
  }, [fetchSettings]);

  const toggleSetting = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const payload = settingsToPayload(settings);
      await updateBusinessSettings({ token, data: payload });
      setSettings(normalizeSettingsFromApi(payload));
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Unable to save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="b-page-header">
          <div className="b-skeleton" style={{ width: 140, height: 32, marginBottom: 8 }} />
          <div className="b-skeleton" style={{ width: 280, height: 16 }} />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="b-glass-section">
            <div className="b-skeleton" style={{ width: "100%", height: 100 }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="b-page-header">
        <h1>Settings</h1>
        <p>Configure your workspace, security, API preferences, and notifications.</p>
      </div>

      {error && (
        <div className="b-glass-section" style={{ borderColor: "rgba(220,38,38,0.3)", marginBottom: "var(--space-4)" }}>
          <p style={{ color: "#dc2626", fontSize: "var(--font-size-sm)" }}>⚠ {error}</p>
        </div>
      )}
      {success && (
        <div className="b-glass-section" style={{ borderColor: "rgba(34,197,94,0.3)", marginBottom: "var(--space-4)" }}>
          <p style={{ color: "var(--success, #16a34a)", fontSize: "var(--font-size-sm)" }}>Settings saved.</p>
        </div>
      )}

      <div className="b-glass-section">
        <h2>Workspace</h2>
        <div className="b-form-grid">
          <div className="b-form-group">
            <label className="b-form-label">Workspace Name</label>
            <input className="b-form-input" value={settings.workspaceName} onChange={(e) => handleChange("workspaceName", e.target.value)} />
          </div>
          <div className="b-form-group">
            <label className="b-form-label">Timezone</label>
            <select className="b-form-select" value={settings.timezone} onChange={(e) => handleChange("timezone", e.target.value)}>
              <option value="">Select timezone</option>
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="Europe/London">London</option>
              <option value="Europe/Berlin">Berlin</option>
              <option value="Asia/Tokyo">Tokyo</option>
            </select>
          </div>
        </div>
      </div>

      <div className="b-glass-section">
        <h2>Security</h2>
        <div className="b-toggle-wrap">
          <div className="b-toggle-label">
            <span className="b-toggle-title">Two-Factor Authentication</span>
            <span className="b-toggle-desc">Add an extra layer of security to your account</span>
          </div>
          <button className={`b-toggle ${settings.twoFactorEnabled ? "active" : ""}`} onClick={() => toggleSetting("twoFactorEnabled")} />
        </div>
        <div className="b-form-group" style={{ marginTop: "var(--space-4)" }}>
          <label className="b-form-label">Session Timeout (minutes)</label>
          <input
            className="b-form-input"
            type="number"
            min="5"
            max="120"
            value={settings.sessionTimeout}
            onChange={(e) => handleChange("sessionTimeout", normalizeNumber(e.target.value))}
            style={{ maxWidth: 200 }}
          />
        </div>
      </div>

      <div className="b-glass-section">
        <h2>API Preferences</h2>
        <div className="b-form-grid">
          <div className="b-form-group">
            <label className="b-form-label">Rate Limit (requests/min)</label>
            <input
              className="b-form-input"
              type="number"
              value={settings.apiRateLimit}
              onChange={(e) => handleChange("apiRateLimit", normalizeNumber(e.target.value))}
            />
          </div>
          <div className="b-form-group">
            <label className="b-form-label">Webhook URL</label>
            <input className="b-form-input" value={settings.webhookUrl} onChange={(e) => handleChange("webhookUrl", e.target.value)} />
          </div>
        </div>
      </div>

      <div className="b-glass-section">
        <h2>Notifications</h2>
        <div className="b-toggle-wrap">
          <div className="b-toggle-label">
            <span className="b-toggle-title">Email Notifications</span>
            <span className="b-toggle-desc">Receive updates and reports via email</span>
          </div>
          <button className={`b-toggle ${settings.emailNotifications ? "active" : ""}`} onClick={() => toggleSetting("emailNotifications")} />
        </div>
        <div className="b-toggle-wrap">
          <div className="b-toggle-label">
            <span className="b-toggle-title">Activity Alerts</span>
            <span className="b-toggle-desc">Get notified about document processing events</span>
          </div>
          <button className={`b-toggle ${settings.activityAlerts ? "active" : ""}`} onClick={() => toggleSetting("activityAlerts")} />
        </div>
        <div className="b-toggle-wrap">
          <div className="b-toggle-label">
            <span className="b-toggle-title">Billing Alerts</span>
            <span className="b-toggle-desc">Alerts for upcoming charges and usage limits</span>
          </div>
          <button className={`b-toggle ${settings.billingAlerts ? "active" : ""}`} onClick={() => toggleSetting("billingAlerts")} />
        </div>
        <div className="b-toggle-wrap">
          <div className="b-toggle-label">
            <span className="b-toggle-title">Security Alerts</span>
            <span className="b-toggle-desc">Unusual login attempts and access changes</span>
          </div>
          <button className={`b-toggle ${settings.securityAlerts ? "active" : ""}`} onClick={() => toggleSetting("securityAlerts")} />
        </div>
      </div>

      <div className="b-form-actions" style={{ marginBottom: "var(--space-8)" }}>
        <button className="btn btn-secondary" onClick={fetchSettings}>
          Reset
        </button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save Settings"}
        </button>
      </div>
    </div>
  );
};

export default BSettings;

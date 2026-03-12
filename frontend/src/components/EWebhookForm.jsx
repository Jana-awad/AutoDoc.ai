/**
 * EWebhookForm - Webhook URL, enable/disable, event selection, save & validate.
 */
import { useState, useEffect } from "react";
import "./EWebhookForm.css";

const WEBHOOK_EVENTS = [
  { id: "document.processed", label: "Document processed" },
  { id: "document.failed", label: "Document failed" },
  { id: "template.updated", label: "Template updated" },
];

function EWebhookForm({
  config = null,
  loading = false,
  saving = false,
  onLoad,
  onSave,
  onValidate,
}) {
  const [url, setUrl] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [events, setEvents] = useState([]);
  const [validateStatus, setValidateStatus] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (config) {
      setUrl(config.url || "");
      setEnabled(Boolean(config.enabled));
      setEvents(Array.isArray(config.events) ? [...config.events] : []);
    }
  }, [config]);

  const toggleEvent = (id) => {
    setEvents((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  const handleSave = (e) => {
    e.preventDefault();
    setError(null);
    if (!url.trim() && enabled) {
      setError("Enter a webhook URL to enable.");
      return;
    }
    onSave({ url: url.trim(), enabled, events });
  };

  const handleValidate = () => {
    if (!url.trim()) {
      setValidateStatus({ ok: false, message: "Enter a URL first." });
      return;
    }
    setValidateStatus(null);
    onValidate(url.trim()).then(
      (res) => setValidateStatus(res === true ? { ok: true } : { ok: false, message: res?.message || "Validation failed" }),
      () => setValidateStatus({ ok: false, message: "Validation request failed." })
    );
  };

  return (
    <div className="e-webhook-form glass-card">
      <h3 className="e-webhook-form__title">Webhook configuration</h3>
      <p className="e-webhook-form__subtitle">
        Receive HTTP callbacks when events occur. Configure URL and select events.
      </p>

      {loading && <div className="e-webhook-form__skeleton" />}
      {!loading && (
        <form className="e-webhook-form__form" onSubmit={handleSave}>
          {error && <p className="e-webhook-form__error" role="alert">{error}</p>}

          <label className="e-webhook-form__label">
            Webhook URL
            <div className="e-webhook-form__url-row">
              <input
                type="url"
                className="e-webhook-form__input"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://your-server.com/webhooks/autodoc"
                disabled={saving}
              />
              <button
                type="button"
                className="e-webhook-form__btn e-webhook-form__btn--secondary"
                onClick={handleValidate}
                disabled={saving}
              >
                Validate
              </button>
            </div>
            {validateStatus && (
              <span
                className={`e-webhook-form__validate e-webhook-form__validate--${validateStatus.ok ? "ok" : "fail"}`}
              >
                {validateStatus.ok ? "URL is reachable." : validateStatus.message}
              </span>
            )}
          </label>

          <label className="e-webhook-form__checkbox-wrap">
            <input
              type="checkbox"
              className="e-webhook-form__checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              disabled={saving}
            />
            <span>Enable webhook</span>
          </label>

          <div className="e-webhook-form__events">
            <span className="e-webhook-form__events-label">Supported events</span>
            <div className="e-webhook-form__events-list">
              {WEBHOOK_EVENTS.map((ev) => (
                <label key={ev.id} className="e-webhook-form__event">
                  <input
                    type="checkbox"
                    checked={events.includes(ev.id)}
                    onChange={() => toggleEvent(ev.id)}
                    disabled={saving}
                  />
                  <span>{ev.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="e-webhook-form__actions">
            <button
              type="submit"
              className="e-webhook-form__btn e-webhook-form__btn--primary"
              disabled={saving}
            >
              {saving ? "Saving…" : "Save configuration"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default EWebhookForm;

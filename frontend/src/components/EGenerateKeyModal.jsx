/**
 * EGenerateKeyModal - Modal to create a new API key (name + environment).
 */
import { useState } from "react";
import EModal from "./EModal";
import "./EGenerateKeyModal.css";

const ENVIRONMENTS = [
  { value: "production", label: "Production" },
  { value: "staging", label: "Staging" },
  { value: "development", label: "Development" },
];

function EGenerateKeyModal({ open, onClose, onCreate, loading }) {
  const [name, setName] = useState("");
  const [environment, setEnvironment] = useState("development");
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Please enter a key name.");
      return;
    }
    onCreate({ name: name.trim(), environment });
  };

  const handleClose = () => {
    setName("");
    setEnvironment("development");
    setError(null);
    onClose();
  };

  return (
    <EModal open={open} onClose={handleClose} title="Generate new API key" size="small">
      <form className="e-generate-key-form" onSubmit={handleSubmit}>
        {error && <p className="e-generate-key-form__error" role="alert">{error}</p>}
        <label className="e-generate-key-form__label">
          Key name
          <input
            type="text"
            className="e-generate-key-form__input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Production server"
            autoComplete="off"
            disabled={loading}
          />
        </label>
        <label className="e-generate-key-form__label">
          Environment
          <select
            className="e-generate-key-form__select"
            value={environment}
            onChange={(e) => setEnvironment(e.target.value)}
            disabled={loading}
          >
            {ENVIRONMENTS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <p className="e-generate-key-form__hint">
          The full key will be shown once. Store it securely; it cannot be shown again.
        </p>
        <div className="e-generate-key-form__actions">
          <button type="button" className="e-generate-key-form__btn e-generate-key-form__btn--secondary" onClick={handleClose}>
            Cancel
          </button>
          <button type="submit" className="e-generate-key-form__btn e-generate-key-form__btn--primary" disabled={loading}>
            {loading ? "Creating…" : "Generate key"}
          </button>
        </div>
      </form>
    </EModal>
  );
}

export default EGenerateKeyModal;

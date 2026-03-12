import React, { useMemo, useState } from "react";
import "./AddClientModal.css";

/** Build exactly one Business and one Enterprise option from plans (project logic: can_manage_templates = Enterprise). */
function planChoices(plans) {
  const business = plans.find((p) => p.can_manage_templates === false);
  const enterprise = plans.find((p) => p.can_manage_templates === true);
  const choices = [];
  if (business) choices.push({ ...business, displayName: "Business" });
  if (enterprise) choices.push({ ...enterprise, displayName: "Enterprise" });
  return choices;
}

function AddClientModal({ open, onClose, onSubmit, loading, plans = [] }) {
  const planOptions = useMemo(() => planChoices(plans), [plans]);
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [planId, setPlanId] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Client name is required.");
      return;
    }
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    if (trimmedPassword) {
      if (trimmedPassword.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
      if (!trimmedEmail) {
        setError("Email is required when setting a password (used for client login).");
        return;
      }
    }
    try {
      await onSubmit({
        name: trimmedName,
        company_name: companyName.trim() || undefined,
        email: trimmedEmail || undefined,
        password: trimmedPassword || undefined,
        plan_id: planId ? parseInt(planId, 10) : undefined,
      });
      setName("");
      setCompanyName("");
      setEmail("");
      setPassword("");
      setPlanId("");
      onClose();
    } catch (err) {
      setError(err?.message || "Failed to create client.");
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError("");
      setName("");
      setCompanyName("");
      setEmail("");
      setPassword("");
      setPlanId("");
      onClose();
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="cp-modal-backdrop" onClick={handleClose} aria-hidden />
      <div className="cp-modal" role="dialog" aria-labelledby="cp-modal-title" aria-modal="true">
        <div className="cp-modal__inner">
          <header className="cp-modal__header">
            <h2 id="cp-modal-title" className="cp-modal__title">Add New Client</h2>
            <button type="button" className="cp-modal__close" onClick={handleClose} aria-label="Close">
              ✕
            </button>
          </header>
          <form onSubmit={handleSubmit} className="cp-modal__form">
            {error && (
              <div className="cp-modal__error" role="alert">
                {error}
              </div>
            )}
            <div className="cp-modal__field">
              <label htmlFor="cp-add-name">Client Name *</label>
              <input
                id="cp-add-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Acme Inc."
                className="cp-modal__input"
                disabled={loading}
              />
            </div>
            <div className="cp-modal__field">
              <label htmlFor="cp-add-company">Company Name</label>
              <input
                id="cp-add-company"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Corporation"
                className="cp-modal__input"
                disabled={loading}
              />
            </div>
            <div className="cp-modal__field">
              <label htmlFor="cp-add-plan">Plan</label>
              <select
                id="cp-add-plan"
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                className="cp-modal__input cp-modal__select"
                disabled={loading}
              >
                <option value="">No plan</option>
                {planOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.displayName}
                    {p.monthly_price != null ? ` — $${(p.monthly_price / 100).toFixed(0)}/mo` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="cp-modal__field">
              <label htmlFor="cp-add-email">Email</label>
              <input
                id="cp-add-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@acme.com"
                className="cp-modal__input"
                disabled={loading}
              />
              <span className="cp-modal__hint">Used for client contact and as login when password is set.</span>
            </div>
            <div className="cp-modal__field">
              <label htmlFor="cp-add-password">Password</label>
              <input
                id="cp-add-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 characters"
                className="cp-modal__input"
                disabled={loading}
                autoComplete="new-password"
              />
            </div>
            <footer className="cp-modal__footer">
              <button type="button" className="cp-modal-btn cp-modal-btn--secondary" onClick={handleClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="cp-modal-btn cp-modal-btn--primary" disabled={loading}>
                {loading ? "Creating…" : "Create Client"}
              </button>
            </footer>
          </form>
        </div>
      </div>
    </>
  );
}

export default AddClientModal;

import { useEffect } from "react";
import "./OutputModal.css";

function OutputModal({ open, loading, error, data, onClose }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="user-modal" role="dialog" aria-modal="true" aria-labelledby="user-modal-title">
      <button type="button" className="user-modal__backdrop" aria-label="Close" onClick={onClose} />
      <div className="user-modal__panel">
        <div className="user-modal__header">
          <h2 id="user-modal-title" className="user-modal__title">
            Output detail
          </h2>
          <button type="button" className="user-modal__close" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="user-modal__body">
          {loading ? <div className="user-modal__spinner" aria-busy="true" /> : null}
          {error ? (
            <p className="user-modal__error" role="alert">
              {error}
            </p>
          ) : null}
          {!loading && !error && data ? (
            <pre className="user-modal__json">{JSON.stringify(data, null, 2)}</pre>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default OutputModal;

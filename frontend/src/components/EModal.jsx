/**
 * EModal - Reusable enterprise modal with glass morphism.
 * Used for template create/edit and other overlays.
 */
import "./EModal.css";

function EModal({ open, onClose, title, children, size = "medium" }) {
  if (!open) return null;

  return (
    <div className="e-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className={`e-modal e-modal--${size}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="e-modal-header">
          <h2 className="e-modal-title">{title}</h2>
          <button
            type="button"
            className="e-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="e-modal-body">{children}</div>
      </div>
    </div>
  );
}

export default EModal;

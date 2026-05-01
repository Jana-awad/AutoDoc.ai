import { useEffect } from "react";
import { createPortal } from "react-dom";
import "./SupportDrawer.css";

/**
 * Lightweight slide-out drawer with onboarding + support links so users can
 * find help without leaving the app. Opens from the Sidebar "Help" entry.
 */
const SUPPORT_EMAIL = "support@autodoc.ai";
const SUPPORT_DOCS = "/docs";

function SupportDrawer({ open, onClose }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="support-drawer" role="dialog" aria-modal="true" aria-labelledby="support-title">
      <button
        type="button"
        className="support-drawer__backdrop"
        aria-label="Close support panel"
        onClick={onClose}
      />
      <aside className="support-drawer__panel">
        <header className="support-drawer__header">
          <div>
            <p className="support-drawer__eyebrow">Support</p>
            <h2 id="support-title" className="support-drawer__title">
              Need a hand?
            </h2>
          </div>
          <button
            type="button"
            className="support-drawer__close"
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className="support-drawer__body">
          <section>
            <h3 className="support-drawer__section">Quick start</h3>
            <ol className="support-drawer__list">
              <li>Open <strong>Documents</strong> from the menu.</li>
              <li>Pick a template, drop a PDF or image.</li>
              <li>Click <strong>Process</strong> — outputs land in your activity timeline.</li>
            </ol>
          </section>

          <section>
            <h3 className="support-drawer__section">Common fixes</h3>
            <ul className="support-drawer__list">
              <li>If a run is stuck on <em>pending</em>, refresh the dashboard.</li>
              <li>For OCR errors on photos, retake the picture in good light.</li>
              <li>Use the <strong>Status</strong> filter on Activity to find failures.</li>
            </ul>
          </section>

          <section className="support-drawer__contact">
            <h3 className="support-drawer__section">Still stuck?</h3>
            <p>Reach a human, weekdays 9–18 GMT+3.</p>
            <div className="support-drawer__cta-row">
              <a className="support-drawer__cta" href={`mailto:${SUPPORT_EMAIL}`}>
                Email support
              </a>
              <a
                className="support-drawer__cta support-drawer__cta--ghost"
                href={SUPPORT_DOCS}
                target="_blank"
                rel="noreferrer"
              >
                Open docs
              </a>
            </div>
          </section>
        </div>
      </aside>
    </div>,
    document.body
  );
}

export default SupportDrawer;

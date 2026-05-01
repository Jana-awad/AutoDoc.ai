import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import "./OutputModal.css";

const formatTs = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
};

const downloadJson = (data, name = "output.json") => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

function OutputModal({ open, loading, error, data, onClose }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const summary = useMemo(() => {
    if (!data) return null;
    const doc = data.document || {};
    const tmpl = data.template || {};
    return {
      docId: doc.id,
      status: doc.status,
      fileUrl: doc.file_url,
      createdAt: doc.created_at,
      processedAt: doc.processed_at,
      templateName: tmpl.name,
      templateId: tmpl.id ?? doc.template_id,
      extractionCount: Array.isArray(data.extractions) ? data.extractions.length : 0,
    };
  }, [data]);

  if (!open) return null;

  return createPortal(
    <div className="user-modal" role="dialog" aria-modal="true" aria-labelledby="user-modal-title">
      <button type="button" className="user-modal__backdrop" aria-label="Close" onClick={onClose} />
      <div className="user-modal__panel">
        <div className="user-modal__header">
          <div>
            <h2 id="user-modal-title" className="user-modal__title">
              Output detail
            </h2>
            {summary?.docId ? (
              <p className="user-modal__sub">
                Document #{summary.docId}
                {summary.templateName ? ` • ${summary.templateName}` : ""}
              </p>
            ) : null}
          </div>
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

          {!loading && !error && summary ? (
            <>
              <dl className="user-modal__meta">
                <div className="user-modal__meta-row">
                  <dt>Status</dt>
                  <dd>
                    <span className={`user-modal__status user-modal__status--${summary.status}`}>
                      {summary.status || "—"}
                    </span>
                  </dd>
                </div>
                <div className="user-modal__meta-row">
                  <dt>Template</dt>
                  <dd>
                    {summary.templateName || `#${summary.templateId ?? "—"}`}
                  </dd>
                </div>
                <div className="user-modal__meta-row">
                  <dt>Uploaded</dt>
                  <dd>{formatTs(summary.createdAt)}</dd>
                </div>
                <div className="user-modal__meta-row">
                  <dt>Processed</dt>
                  <dd>{formatTs(summary.processedAt)}</dd>
                </div>
                <div className="user-modal__meta-row">
                  <dt>Extractions</dt>
                  <dd>{summary.extractionCount}</dd>
                </div>
              </dl>

              <div className="user-modal__cta-row">
                <button
                  type="button"
                  className="user-modal__cta"
                  onClick={() => downloadJson(data, `document-${summary.docId}.json`)}
                >
                  Download JSON
                </button>
                <Link
                  to="/user/documents"
                  className="user-modal__cta user-modal__cta--ghost"
                  onClick={onClose}
                >
                  Open Documents
                </Link>
              </div>

              <details className="user-modal__raw" open>
                <summary>Raw payload</summary>
                <pre className="user-modal__json">{JSON.stringify(data, null, 2)}</pre>
              </details>
            </>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default OutputModal;

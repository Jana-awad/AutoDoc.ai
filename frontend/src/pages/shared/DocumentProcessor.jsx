/**
 * Tenant-side "Process a document" page.
 *
 * Same component drives both the enterprise (`/enterprise/documents`) and the
 * business (`/business/documents`) routes. It only talks to public REST
 * endpoints (`/templates`, `/documents/*`); the backend enforces role/plan
 * scoping server-side.
 *
 * Flow:
 *   1. Fetch the templates the caller can use.
 *   2. Pick one + drop a PDF.
 *   3. POST /documents/upload  -> doc id.
 *   4. POST /documents/{id}/process  -> OCR + LLM.
 *   5. GET  /documents/{id}/extractions/summary -> JSON keyed by field name.
 *   6. GET  /documents/{id}/extractions         -> per-field rows + confidence.
 *
 * History panel shows previously uploaded documents from /documents.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  Info,
  Loader2,
  Play,
  RotateCw,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { fetchTemplates } from "../../services/templatesApi";
import {
  deleteDocument,
  fetchDocumentExtractions,
  fetchDocumentSummary,
  fetchDocuments,
  processDocument,
  reprocessDocument,
  uploadDocument,
} from "../../services/documentsApi";
import "./DocumentProcessor.css";

const STATUS_PILL = {
  uploaded: { label: "Uploaded", color: "blue" },
  processing: { label: "Processing", color: "amber" },
  done: { label: "Done", color: "green" },
  failed: { label: "Failed", color: "red" },
};

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
};

const confidencePct = (c) =>
  c == null ? "—" : `${Math.round(Math.max(0, Math.min(1, Number(c))) * 100)}%`;

const confidenceTone = (c) => {
  if (c == null) return "gray";
  const v = Number(c);
  if (v >= 0.8) return "green";
  if (v >= 0.5) return "amber";
  return "red";
};

function StatusPill({ status }) {
  const cfg = STATUS_PILL[status] || { label: status || "—", color: "gray" };
  return <span className={`docproc-pill docproc-pill--${cfg.color}`}>{cfg.label}</span>;
}

function Banner({ kind, message, onClose }) {
  if (!message) return null;
  const Icon = kind === "error" ? AlertTriangle : kind === "success" ? CheckCircle2 : Info;
  return (
    <div className={`docproc-banner docproc-banner--${kind || "info"}`} role="status">
      <Icon size={18} />
      <span style={{ flex: 1 }}>{message}</span>
      {onClose && (
        <button
          type="button"
          className="docproc-banner-close"
          onClick={onClose}
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

/**
 * @param {{ NavComponent: React.ComponentType, theme: string, brand: string }} props
 */
function DocumentProcessor({ NavComponent, theme = "enterprise", brand = "Enterprise" }) {
  const { token, role } = useAuth();
  const canInspectTemplate = role === "super_admin";

  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templateId, setTemplateId] = useState(null);

  const [file, setFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState(null); // "uploading" | "processing" | "loading"
  const [banner, setBanner] = useState(null);

  const [activeDoc, setActiveDoc] = useState(null); // { id, summary, extractions }

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [busyDocId, setBusyDocId] = useState(null);

  // ------------------------------------------------------------- load data
  const loadTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    try {
      const data = await fetchTemplates({ token });
      const usable = (data || []).filter(
        (t) => (t.status || "active").toLowerCase() !== "archived"
      );
      setTemplates(usable);
      if (usable.length && !usable.some((t) => t.id === templateId)) {
        setTemplateId(usable[0].id);
      }
    } catch (err) {
      setBanner({ kind: "error", message: `Could not load templates: ${err.message}` });
    } finally {
      setTemplatesLoading(false);
    }
  }, [templateId, token]);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const data = await fetchDocuments({ token });
      setHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      setBanner({ kind: "error", message: `Could not load documents: ${err.message}` });
    } finally {
      setHistoryLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadTemplates();
    loadHistory();
  }, [loadTemplates, loadHistory]);

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === templateId) || null,
    [templates, templateId]
  );

  // ---------------------------------------------------------------- file IO
  const onPickFile = useCallback((nextFile) => {
    if (!nextFile) return;
    if (nextFile.size > 25 * 1024 * 1024) {
      setBanner({ kind: "error", message: "File is larger than 25 MB. Please pick a smaller PDF." });
      return;
    }
    setFile(nextFile);
    setBanner(null);
  }, []);

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);
  const onDragLeave = useCallback(() => setIsDragOver(false), []);
  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragOver(false);
      const f = e.dataTransfer.files?.[0];
      if (f) onPickFile(f);
    },
    [onPickFile]
  );

  // -------------------------------------------------- main pipeline action
  const runPipeline = useCallback(async () => {
    setBanner(null);
    if (!file) {
      setBanner({ kind: "error", message: "Pick a PDF first." });
      return;
    }
    if (!templateId) {
      setBanner({ kind: "error", message: "Pick a template first." });
      return;
    }
    setBusy(true);
    setActiveDoc(null);
    try {
      setPhase("uploading");
      const doc = await uploadDocument({ file, templateId, token });

      setPhase("processing");
      await processDocument(doc.id, { token });

      setPhase("loading");
      const [summary, extractions] = await Promise.all([
        fetchDocumentSummary(doc.id, { token }),
        fetchDocumentExtractions(doc.id, { token }),
      ]);

      setActiveDoc({ id: doc.id, summary, extractions });
      setBanner({
        kind: "success",
        message: `Document #${doc.id} processed. ${
          extractions?.length || 0
        } fields extracted.`,
      });
      // Refresh history (silently)
      loadHistory();
    } catch (err) {
      setBanner({ kind: "error", message: err.message });
    } finally {
      setBusy(false);
      setPhase(null);
    }
  }, [file, templateId, token, loadHistory]);

  // -------------------------------------------------------- history actions
  const viewDocument = useCallback(
    async (doc) => {
      setBanner(null);
      setBusyDocId(doc.id);
      try {
        const [summary, extractions] = await Promise.all([
          fetchDocumentSummary(doc.id, { token }),
          fetchDocumentExtractions(doc.id, { token }),
        ]);
        setActiveDoc({ id: doc.id, summary, extractions });
      } catch (err) {
        setBanner({ kind: "error", message: `Could not load document: ${err.message}` });
      } finally {
        setBusyDocId(null);
      }
    },
    [token]
  );

  const reprocess = useCallback(
    async (doc) => {
      setBanner(null);
      setBusyDocId(doc.id);
      try {
        await reprocessDocument(doc.id, { token });
        const [summary, extractions] = await Promise.all([
          fetchDocumentSummary(doc.id, { token }),
          fetchDocumentExtractions(doc.id, { token }),
        ]);
        setActiveDoc({ id: doc.id, summary, extractions });
        setBanner({ kind: "success", message: `Document #${doc.id} re-processed.` });
        loadHistory();
      } catch (err) {
        setBanner({ kind: "error", message: err.message });
      } finally {
        setBusyDocId(null);
      }
    },
    [loadHistory, token]
  );

  const removeDocument = useCallback(
    async (doc) => {
      if (!window.confirm(`Delete document #${doc.id}? This cannot be undone.`)) return;
      setBusyDocId(doc.id);
      try {
        await deleteDocument(doc.id, { token });
        if (activeDoc?.id === doc.id) setActiveDoc(null);
        loadHistory();
      } catch (err) {
        setBanner({ kind: "error", message: err.message });
      } finally {
        setBusyDocId(null);
      }
    },
    [activeDoc, loadHistory, token]
  );

  // ------------------------------------------------------------------ render
  const buttonLabel = useMemo(() => {
    if (!busy) return "Process document";
    if (phase === "uploading") return "Uploading PDF…";
    if (phase === "processing") return "Running OCR + LLM…";
    if (phase === "loading") return "Fetching results…";
    return "Working…";
  }, [busy, phase]);

  return (
    <div className={`docproc docproc--${theme}`}>
      {NavComponent ? <NavComponent /> : null}

      <main className="docproc-main">
        <header className="docproc-header">
          <span className="docproc-eyebrow">{brand}</span>
          <h1 className="docproc-title">Process a document</h1>
          <p className="docproc-subtitle">
            Pick a template, drop a PDF, and let the pipeline run OCR and the LLM. The
            JSON returned matches the fields you defined on the template.
          </p>
        </header>

        <Banner
          kind={banner?.kind}
          message={banner?.message}
          onClose={() => setBanner(null)}
        />

        <section className="docproc-grid">
          {/* ---------- LEFT: template picker + file drop ---------- */}
          <motion.div
            className="docproc-card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="docproc-card-title">1. Choose a template</h2>
            {templatesLoading ? (
              <div className="docproc-loading">
                <Loader2 size={18} className="docproc-spin" /> Loading templates…
              </div>
            ) : templates.length === 0 ? (
              <p className="docproc-empty-text">
                No templates available yet. Ask your admin to publish one in the Super
                Admin Template Builder.
              </p>
            ) : (
              <div className="docproc-template-list">
                {templates.map((t) => (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => setTemplateId(t.id)}
                    className={`docproc-template ${
                      t.id === templateId ? "docproc-template--active" : ""
                    }`}
                  >
                    <div className="docproc-template-main">
                      <span className="docproc-template-name">{t.name}</span>
                      <span className="docproc-template-meta">
                        {t.template_key ? `id: ${t.template_key} · ` : ""}
                        {t.fields_count ?? 0} fields · v{t.version || "1.0.0"}
                      </span>
                    </div>
                    <ChevronRight size={16} />
                  </button>
                ))}
              </div>
            )}

            <h2 className="docproc-card-title docproc-card-title--mt">2. Upload your PDF</h2>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf,image/*"
              onChange={(e) => onPickFile(e.target.files?.[0])}
              hidden
            />
            <div
              className={`docproc-drop ${isDragOver ? "docproc-drop--over" : ""} ${
                file ? "docproc-drop--has-file" : ""
              }`}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
              }}
            >
              <Upload size={28} />
              <span className="docproc-drop-title">
                {file ? file.name : "Drop a PDF here, or click to browse"}
              </span>
              <span className="docproc-drop-hint">
                {file
                  ? `${(file.size / 1024).toFixed(1)} KB · ${file.type || "application/pdf"}`
                  : "PDFs and image files up to 25 MB"}
              </span>
              {file && (
                <button
                  type="button"
                  className="docproc-drop-clear"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                >
                  <X size={14} /> Remove
                </button>
              )}
            </div>

            <div className="docproc-actions">
              <button
                type="button"
                className="docproc-btn docproc-btn--primary"
                onClick={runPipeline}
                disabled={busy || !file || !templateId}
              >
                {busy ? <Loader2 size={18} className="docproc-spin" /> : <Play size={18} />}
                {buttonLabel}
              </button>
              {selectedTemplate && canInspectTemplate && (
                <Link
                  to={`/super/templates-ai/builder?edit=${selectedTemplate.id}`}
                  className="docproc-btn docproc-btn--ghost"
                  title="Open this template in the Super Admin builder"
                >
                  Inspect template
                </Link>
              )}
            </div>
          </motion.div>

          {/* ---------- RIGHT: result panel ---------- */}
          <motion.div
            className="docproc-card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
          >
            <div className="docproc-card-head">
              <h2 className="docproc-card-title">Extraction result</h2>
              {activeDoc && (
                <span className="docproc-muted">Document #{activeDoc.id}</span>
              )}
            </div>

            {!activeDoc && (
              <div className="docproc-empty">
                <FileText size={36} />
                <p>
                  Upload a PDF and click <strong>Process document</strong> to see the JSON
                  here.
                </p>
              </div>
            )}

            {activeDoc && (
              <>
                <div className="docproc-result-grid">
                  <div>
                    <h3 className="docproc-section-title">Per-field extractions</h3>
                    <ul className="docproc-fields">
                      {(activeDoc.extractions || []).map((ex) => (
                        <li key={ex.id} className="docproc-field-row">
                          <div className="docproc-field-label">
                            <code>{ex.field_name || `field_${ex.field_id}`}</code>
                            {ex.field_label && ex.field_label !== ex.field_name && (
                              <span className="docproc-muted"> — {ex.field_label}</span>
                            )}
                          </div>
                          <div className="docproc-field-value">
                            {ex.value_text ?? "(empty)"}
                          </div>
                          <span
                            className={`docproc-pill docproc-pill--${confidenceTone(
                              ex.confidence
                            )}`}
                            title="LLM/heuristic confidence"
                          >
                            {confidencePct(ex.confidence)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="docproc-section-title">JSON summary</h3>
                    <pre className="docproc-json">
                      {JSON.stringify(activeDoc.summary || {}, null, 2)}
                    </pre>
                    <button
                      type="button"
                      className="docproc-btn docproc-btn--ghost docproc-btn--small"
                      onClick={() => {
                        navigator.clipboard?.writeText(
                          JSON.stringify(activeDoc.summary || {}, null, 2)
                        );
                      }}
                    >
                      Copy JSON
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </section>

        {/* ---------- BOTTOM: history ---------- */}
        <motion.section
          className="docproc-card"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="docproc-card-head">
            <h2 className="docproc-card-title">
              <Clock size={18} style={{ verticalAlign: "-3px", marginRight: 6 }} />
              Recent documents
            </h2>
            <button
              type="button"
              className="docproc-btn docproc-btn--ghost docproc-btn--small"
              onClick={loadHistory}
              disabled={historyLoading}
            >
              <RotateCw size={14} /> Refresh
            </button>
          </div>

          {historyLoading ? (
            <div className="docproc-loading">
              <Loader2 size={18} className="docproc-spin" /> Loading history…
            </div>
          ) : history.length === 0 ? (
            <p className="docproc-empty-text">No documents yet for your account.</p>
          ) : (
            <div className="docproc-table-wrap">
              <table className="docproc-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Template</th>
                    <th>Status</th>
                    <th>Uploaded</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((doc) => {
                    const tpl = templates.find((t) => t.id === doc.template_id);
                    return (
                      <tr key={doc.id}>
                        <td>#{doc.id}</td>
                        <td>{tpl?.name || `template #${doc.template_id ?? "—"}`}</td>
                        <td>
                          <StatusPill status={doc.status} />
                        </td>
                        <td>{formatDate(doc.created_at)}</td>
                        <td>
                          <div className="docproc-row-actions">
                            <button
                              type="button"
                              className="docproc-icon-btn"
                              onClick={() => viewDocument(doc)}
                              disabled={busyDocId === doc.id}
                              title="View extraction"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              type="button"
                              className="docproc-icon-btn"
                              onClick={() => reprocess(doc)}
                              disabled={busyDocId === doc.id || doc.template_id == null}
                              title="Re-run OCR + LLM"
                            >
                              <RotateCw size={14} />
                            </button>
                            <button
                              type="button"
                              className="docproc-icon-btn docproc-icon-btn--danger"
                              onClick={() => removeDocument(doc)}
                              disabled={busyDocId === doc.id}
                              title="Delete document"
                            >
                              <Trash2 size={14} />
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
        </motion.section>
      </main>
    </div>
  );
}

export default DocumentProcessor;

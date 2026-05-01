import { useMemo, useState } from "react";
import { submitProcessDocument } from "../../../services/userDashboardApi";
import "./QuickActions.css";

function QuickActions({ templates, loading, error, onSubmitSuccess, token }) {
  const [templateId, setTemplateId] = useState("");
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitOk, setSubmitOk] = useState(null);

  const list = useMemo(() => (Array.isArray(templates) ? templates : []), [templates]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitOk(null);
    if (!templateId) {
      setSubmitError("Select a template.");
      return;
    }
    if (!file) {
      setSubmitError("Choose a document to upload.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await submitProcessDocument({
        token,
        templateId: Number(templateId),
        file,
      });
      setSubmitOk(
        `Processed successfully. Document #${result?.document?.id ?? ""} — extractions: ${result?.extractions_created ?? 0}.`
      );
      setFile(null);
      if (onSubmitSuccess) onSubmitSuccess();
    } catch (err) {
      setSubmitError(err.message || "Processing failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (error) {
    return (
      <section className="user-quick" aria-label="Quick actions">
        <p className="user-quick__error" role="alert">
          {error}
        </p>
      </section>
    );
  }

  return (
    <section className="user-quick" aria-label="Quick actions">
      <div className="user-quick__head">
        <h2 className="user-quick__title">Quick actions</h2>
        <p className="user-quick__subtitle">Run a document through a template in one step</p>
      </div>

      {loading ? (
        <div className="user-quick__skeleton" />
      ) : (
        <form className="user-quick__form" onSubmit={handleSubmit}>
          <label className="user-quick__field">
            <span className="user-quick__label">Template</span>
            <select
              className="user-quick__select"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              disabled={submitting || list.length === 0}
            >
              <option value="">{list.length === 0 ? "No templates available" : "Select a template"}</option>
              {list.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} (ID {t.id})
                </option>
              ))}
            </select>
          </label>

          <label className="user-quick__field">
            <span className="user-quick__label">Document</span>
            <input
              type="file"
              className="user-quick__file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={submitting}
            />
          </label>

          {submitError ? (
            <p className="user-quick__error" role="alert">
              {submitError}
            </p>
          ) : null}
          {submitOk ? (
            <p className="user-quick__success" role="status">
              {submitOk}
            </p>
          ) : null}

          <button type="submit" className="user-quick__submit" disabled={submitting || list.length === 0}>
            {submitting ? "Processing…" : "Submit to process"}
          </button>
        </form>
      )}
    </section>
  );
}

export default QuickActions;

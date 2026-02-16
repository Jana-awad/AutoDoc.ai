/**
 * ETemplateCreateModal - Create/edit template without code.
 * Upload sample docs, auto-detect structure, define fields, versioning.
 */
import { useState } from "react";
import EModal from "./EModal";
import { DOCUMENT_TYPES } from "../services/enterpriseTemplatesApi";
import "./ETemplateCreateModal.css";

const FIELD_TYPES = ["text", "number", "date", "currency", "email", "phone"];

function ETemplateCreateModal({ open, onClose, onSubmit, template }) {
  const isEdit = !!template;
  const [name, setName] = useState(template?.name ?? "");
  const [documentType, setDocumentType] = useState(template?.documentType ?? "Invoice");
  const [version, setVersion] = useState(template?.version ?? "1.0.0");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fields, setFields] = useState(
    template?.fields ?? [
      { id: "f1", name: "invoice_number", label: "Invoice Number", type: "text", required: true },
      { id: "f2", name: "date", label: "Date", type: "date", required: true },
      { id: "f3", name: "vendor", label: "Vendor", type: "text", required: true },
      { id: "f4", name: "total", label: "Total Amount", type: "currency", required: true },
    ]
  );
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && (file.type === "application/pdf" || file.type.startsWith("image/"))) {
      setUploadedFile(file);
    }
  };

  const addField = () => {
    setFields([
      ...fields,
      {
        id: `f_${Date.now()}`,
        name: `field_${fields.length + 1}`,
        label: `Field ${fields.length + 1}`,
        type: "text",
        required: false,
      },
    ]);
  };

  const updateField = (id, key, value) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, [key]: value } : f)));
  };

  const removeField = (id) => {
    setFields(fields.filter((f) => f.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit?.({
        name,
        documentType,
        version,
        sampleFile: uploadedFile,
        fields,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <EModal open={open} onClose={onClose} title={isEdit ? "Edit Template" : "Create New Template"} size="large">
      <form className="e-template-create-form" onSubmit={handleSubmit}>
        <section className="e-template-create-section">
          <h3 className="e-template-create-section-title">Basic info</h3>
          <div className="e-template-create-row">
            <label className="e-template-create-label">
              Template name
              <input
                type="text"
                className="e-template-create-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Standard Invoice"
                required
              />
            </label>
            <label className="e-template-create-label">
              Document type
              <select
                className="e-template-create-select"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
              >
                {DOCUMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="e-template-create-label">
            Version
            <input
              type="text"
              className="e-template-create-input e-template-create-input--sm"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="1.0.0"
            />
          </label>
        </section>

        <section className="e-template-create-section">
          <h3 className="e-template-create-section-title">Sample document</h3>
          <div className="e-template-create-upload">
            <input
              type="file"
              id="e-template-upload"
              accept=".pdf,image/*"
              onChange={handleFileChange}
              className="e-template-create-upload-input"
            />
            <label htmlFor="e-template-upload" className="e-template-create-upload-label">
              {uploadedFile ? (
                <span className="e-template-create-upload-name">{uploadedFile.name}</span>
              ) : (
                <>Upload PDF or image to auto-detect structure</>
              )}
            </label>
          </div>
        </section>

        <section className="e-template-create-section">
          <div className="e-template-create-section-header">
            <h3 className="e-template-create-section-title">Extracted fields</h3>
            <button type="button" className="e-template-create-add-field btn btn-secondary" onClick={addField}>
              + Add field
            </button>
          </div>
          <div className="e-template-create-fields">
            {fields.map((f) => (
              <div key={f.id} className="e-template-create-field-row">
                <input
                  type="text"
                  className="e-template-create-input e-template-create-field-name"
                  value={f.name}
                  onChange={(e) => updateField(f.id, "name", e.target.value)}
                  placeholder="field_name"
                />
                <input
                  type="text"
                  className="e-template-create-input e-template-create-field-label"
                  value={f.label}
                  onChange={(e) => updateField(f.id, "label", e.target.value)}
                  placeholder="Label"
                />
                <select
                  className="e-template-create-select e-template-create-field-type"
                  value={f.type}
                  onChange={(e) => updateField(f.id, "type", e.target.value)}
                >
                  {FIELD_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <label className="e-template-create-check">
                  <input
                    type="checkbox"
                    checked={f.required}
                    onChange={(e) => updateField(f.id, "required", e.target.checked)}
                  />
                  Required
                </label>
                <button
                  type="button"
                  className="e-template-create-remove"
                  onClick={() => removeField(f.id)}
                  aria-label="Remove field"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </section>

        <div className="e-template-create-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Saving…" : isEdit ? "Save changes" : "Create template"}
          </button>
        </div>
      </form>
    </EModal>
  );
}

export default ETemplateCreateModal;

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  FileText,
  GripVertical,
  Info,
  Loader2,
  Play,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import "../../components/variables.css";
import Enavbar from "../../components/Enavbar";
import { useAuth } from "../../context/AuthContext";
import {
  builderResponseToFormState,
  buildTemplatePayload,
  createTemplateFromBuilder,
  deleteTemplate,
  fetchTemplateFull,
  generateWithTemplate,
  updateTemplateFromBuilder,
  uploadTemplateFile,
} from "../../services/templatesApi";
import "../super/template_builder.css";

const DATA_TYPES = [
  { value: "string", label: "String" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "boolean", label: "Boolean" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ar", label: "Arabic" },
  { value: "fr", label: "French" },
  { value: "es", label: "Spanish" },
  { value: "de", label: "German" },
  { value: "other", label: "Other" },
];

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
];

function createDefaultField(order = 0) {
  return {
    id: crypto.randomUUID?.() ?? `f-${Date.now()}-${order}`,
    name: "",
    display_label: "",
    data_type: "string",
    required: false,
    document_position: "Middle",
    extraction_hint: "",
    example_value: "",
    validation_rules: "",
    field_order: order,
  };
}

const getInitialState = () => ({
  id: null,
  template_key: "",
  name: "",
  description: "",
  document_type: "",
  language: "en",
  status: "active",
  version: "1.0.0",
  is_global: true,
  client_id: null,
  fields: [createDefaultField(0)],
  ai_config: {
    system_prompt: "",
    extraction_instructions: "",
    output_format_rules: "",
    json_output_template: "",
    edge_case_handling_rules: "",
    llm_model: "",
    llm_temperature: "",
    llm_max_tokens: "",
  },
});

function FieldCard({ field, index, onUpdate, onRemove, onMove, canRemove, totalFields }) {
  const update = useCallback(
    (key, value) => {
      onUpdate(index, { ...field, [key]: value, field_order: index });
    },
    [index, field, onUpdate]
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="tpl-ai-field-card"
    >
      <div className="tpl-ai-field-card-header">
        <span className="tpl-ai-field-card-drag" aria-hidden>
          <GripVertical size={18} />
        </span>
        <span className="tpl-ai-field-card-index">Field {index + 1}</span>
        <div className="tpl-ai-field-card-reorder">
          <button
            type="button"
            className="tpl-ai-field-card-move"
            onClick={() => onMove(index, -1)}
            disabled={index === 0}
            title="Move up"
            aria-label="Move field up"
          >
            <ChevronUp size={18} />
          </button>
          <button
            type="button"
            className="tpl-ai-field-card-move"
            onClick={() => onMove(index, 1)}
            disabled={index >= totalFields - 1}
            title="Move down"
            aria-label="Move field down"
          >
            <ChevronDown size={18} />
          </button>
        </div>
        <button
          type="button"
          className="tpl-ai-field-card-remove"
          onClick={() => onRemove(index)}
          disabled={!canRemove}
          title="Remove field"
          aria-label="Remove field"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="tpl-ai-field-grid">
        <div className="tpl-ai-field-group">
          <label>Field name (system key)</label>
          <input
            type="text"
            value={field.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="e.g. invoice_number"
            className="tpl-ai-input"
          />
        </div>
        <div className="tpl-ai-field-group">
          <label>Display label</label>
          <input
            type="text"
            value={field.display_label}
            onChange={(e) => update("display_label", e.target.value)}
            placeholder="e.g. Invoice number"
            className="tpl-ai-input"
          />
        </div>
        <div className="tpl-ai-field-group">
          <label>Data type</label>
          <select
            value={field.data_type}
            onChange={(e) => update("data_type", e.target.value)}
            className="tpl-ai-select"
          >
            {DATA_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="tpl-ai-field-group">
          <label>Document position</label>
          <input
            type="text"
            value={field.document_position}
            onChange={(e) => update("document_position", e.target.value)}
            className="tpl-ai-input"
            placeholder="e.g. Top, Middle, Bottom"
          />
        </div>
        <div className="tpl-ai-field-group tpl-ai-field-group--full">
          <label>Extraction hint (sent to the LLM)</label>
          <input
            type="text"
            value={field.extraction_hint}
            onChange={(e) => update("extraction_hint", e.target.value)}
            placeholder="Where to find this value, how to format it…"
            className="tpl-ai-input"
          />
        </div>
        <div className="tpl-ai-field-group">
          <label>Example value</label>
          <input
            type="text"
            value={field.example_value}
            onChange={(e) => update("example_value", e.target.value)}
            placeholder="e.g. INV-1024"
            className="tpl-ai-input"
          />
        </div>
        <div className="tpl-ai-field-group">
          <label>Validation rules (optional)</label>
          <input
            type="text"
            value={field.validation_rules}
            onChange={(e) => update("validation_rules", e.target.value)}
            placeholder="e.g. max_length: 100"
            className="tpl-ai-input"
          />
        </div>
        <div className="tpl-ai-field-group tpl-ai-field-group--toggle">
          <label>Required</label>
          <button
            type="button"
            role="switch"
            aria-checked={field.required}
            className={`tpl-ai-toggle ${field.required ? "tpl-ai-toggle--on" : ""}`}
            onClick={() => update("required", !field.required)}
          >
            <span className="tpl-ai-toggle-thumb" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function Banner({ kind, message, onClose }) {
  if (!message) return null;
  const Icon = kind === "error" ? AlertTriangle : kind === "success" ? CheckCircle2 : Info;
  return (
    <div className={`tpl-ai-banner tpl-ai-banner--${kind || "info"}`} role="status">
      <Icon size={18} />
      <span style={{ flex: 1 }}>{message}</span>
      {onClose && (
        <button type="button" className="tpl-ai-banner-close" onClick={onClose} aria-label="Dismiss">
          <X size={16} />
        </button>
      )}
    </div>
  );
}

function TemplateBuilder() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");

  const [state, setState] = useState(getInitialState);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testText, setTestText] = useState("");
  const [testResult, setTestResult] = useState(null);
  const [banner, setBanner] = useState(null);

  const importInputRef = useRef(null);

  const isEditing = Boolean(state.id);

  // Load existing template into form when ?edit=:id is present.
  useEffect(() => {
    if (!editId) {
      setState(getInitialState());
      return;
    }
    let cancelled = false;
    const ctrl = new AbortController();

    const load = async () => {
      setLoading(true);
      setBanner(null);
      try {
        const data = await fetchTemplateFull(editId, { token, signal: ctrl.signal });
        if (cancelled) return;
        const formState = builderResponseToFormState(data);
        if (formState && (!formState.fields || formState.fields.length === 0)) {
          formState.fields = [createDefaultField(0)];
        }
        setState(formState);
      } catch (err) {
        if (cancelled || err?.name === "AbortError") return;
        setBanner({ kind: "error", message: `Failed to load template: ${err.message}` });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();

    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, [editId, token]);

  // Helpers for state mutations
  const updateTemplate = useCallback((key, value) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateAiConfig = useCallback((key, value) => {
    setState((prev) => ({
      ...prev,
      ai_config: { ...prev.ai_config, [key]: value },
    }));
  }, []);

  const addField = useCallback(() => {
    setState((prev) => {
      const nextOrder = prev.fields.length;
      return { ...prev, fields: [...prev.fields, createDefaultField(nextOrder)] };
    });
  }, []);

  const updateField = useCallback((index, nextField) => {
    setState((prev) => {
      const next = [...prev.fields];
      next[index] = { ...nextField, field_order: index };
      return { ...prev, fields: next };
    });
  }, []);

  const removeField = useCallback((index) => {
    setState((prev) => {
      const next = prev.fields.filter((_, i) => i !== index);
      return { ...prev, fields: next.map((f, i) => ({ ...f, field_order: i })) };
    });
  }, []);

  const moveField = useCallback(
    (fromIndex, direction) => {
      const toIndex = fromIndex + direction;
      if (toIndex < 0 || toIndex >= state.fields.length) return;
      setState((prev) => {
        const arr = [...prev.fields];
        const [removed] = arr.splice(fromIndex, 1);
        arr.splice(toIndex, 0, removed);
        return { ...prev, fields: arr.map((f, i) => ({ ...f, field_order: i })) };
      });
    },
    [state.fields.length]
  );

  const previewJson = useMemo(() => {
    const obj = {};
    state.fields.forEach((f) => {
      const key = (f.name || "").trim() || `field_${f.field_order}`;
      obj[key] = f.example_value?.trim() || "";
    });
    return JSON.stringify(obj, null, 2);
  }, [state.fields]);

  const validate = useCallback(() => {
    if (!state.name.trim()) return "Template name is required.";
    const valid = state.fields.filter((f) => f.name.trim());
    if (valid.length === 0) return "Add at least one field with a system key (name).";
    const seen = new Set();
    for (const f of valid) {
      const k = f.name.trim();
      if (seen.has(k)) return `Field key "${k}" is duplicated. Use unique keys.`;
      seen.add(k);
    }
    return null;
  }, [state]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setBanner(null);
      const error = validate();
      if (error) {
        setBanner({ kind: "error", message: error });
        return;
      }
      setSaving(true);
      try {
        const payload = buildTemplatePayload(state);
        const response = isEditing
          ? await updateTemplateFromBuilder(state.id, payload, { token })
          : await createTemplateFromBuilder(payload, { token });
        const next = builderResponseToFormState(response);
        if (next && (!next.fields || next.fields.length === 0)) {
          next.fields = [createDefaultField(0)];
        }
        setState(next);
        setBanner({
          kind: "success",
          message: isEditing
            ? "Template updated. Changes saved to the database."
            : `Template created. ID #${response.id} (key: ${
                response.template?.template_key || "—"
              }).`,
        });
        if (!isEditing) {
          navigate(`/enterprise/templates-ai/builder?edit=${response.id}`, { replace: true });
        }
      } catch (err) {
        setBanner({ kind: "error", message: err.message });
      } finally {
        setSaving(false);
      }
    },
    [isEditing, navigate, state, token, validate]
  );

  const handleDelete = useCallback(async () => {
    if (!state.id) return;
    if (!window.confirm("Delete this template and all of its fields? This cannot be undone.")) {
      return;
    }
    setDeleting(true);
    setBanner(null);
    try {
      await deleteTemplate(state.id, { token });
      navigate("/enterprise/templates-ai", { replace: true });
    } catch (err) {
      setBanner({ kind: "error", message: err.message });
    } finally {
      setDeleting(false);
    }
  }, [navigate, state.id, token]);

  const handleImportClick = useCallback(() => {
    importInputRef.current?.click();
  }, []);

  const handleImportChange = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setImporting(true);
      setBanner(null);
      try {
        const response = await uploadTemplateFile(file, { token });
        const next = builderResponseToFormState(response);
        if (next && (!next.fields || next.fields.length === 0)) {
          next.fields = [createDefaultField(0)];
        }
        setState(next);
        setBanner({
          kind: "success",
          message: `Template imported from ${file.name}. ID #${response.id}.`,
        });
        navigate(`/enterprise/templates-ai/builder?edit=${response.id}`, { replace: true });
      } catch (err) {
        setBanner({ kind: "error", message: `Import failed: ${err.message}` });
      } finally {
        setImporting(false);
        if (importInputRef.current) importInputRef.current.value = "";
      }
    },
    [navigate, token]
  );

  const handleExport = useCallback(() => {
    const payload = buildTemplatePayload(state);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const fname =
      (state.template_key || state.name || "template")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "") || "template";
    a.href = url;
    a.download = `${fname}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [state]);

  const handleTest = useCallback(async () => {
    setBanner(null);
    if (!state.id) {
      setBanner({
        kind: "info",
        message: "Save the template first, then run a test prompt.",
      });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const result = await generateWithTemplate(
        state.id,
        { document_text: testText || "" },
        { token }
      );
      setTestResult(result);
    } catch (err) {
      setBanner({ kind: "error", message: `Test failed: ${err.message}` });
    } finally {
      setTesting(false);
    }
  }, [state.id, testText, token]);

  return (
    <div className="super-template-builder">
      <Enavbar />
      <main id="main-content" className="super-template-builder-main" role="main">
        <div className="tpl-ai-container">
          <motion.header
            className="tpl-ai-header"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="tpl-ai-header-icon">
              <FileText size={32} strokeWidth={1.5} />
            </div>
            <h1 className="tpl-ai-header-title">
              {isEditing ? "Edit AI Template" : "AI Template Builder"}
            </h1>
            <p className="tpl-ai-header-subtitle">
              Create and configure extraction templates that drive OCR and LLM behavior.
              Templates are saved to the database — no seed data, no mocks.
            </p>
          </motion.header>

          <Banner kind={banner?.kind} message={banner?.message} onClose={() => setBanner(null)} />

          <div className="tpl-ai-actionbar">
            <input
              ref={importInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleImportChange}
              hidden
            />
            <button
              type="button"
              className="tpl-ai-btn tpl-ai-btn--secondary"
              onClick={handleImportClick}
              disabled={importing}
            >
              {importing ? <Loader2 size={18} className="tpl-ai-spin" /> : <Upload size={18} />}
              {importing ? "Importing…" : "Import JSON"}
            </button>
            <button
              type="button"
              className="tpl-ai-btn tpl-ai-btn--ghost"
              onClick={handleExport}
              disabled={loading}
              title="Download the current form as a JSON template file"
            >
              Export JSON
            </button>
            {isEditing && (
              <button
                type="button"
                className="tpl-ai-btn tpl-ai-btn--danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? <Loader2 size={18} className="tpl-ai-spin" /> : <Trash2 size={18} />}
                Delete
              </button>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className={`tpl-ai-form ${loading ? "tpl-ai-form--loading" : ""}`}
          >
            <motion.section
              className="tpl-ai-section tpl-ai-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05 }}
            >
              <h2 className="tpl-ai-section-title">Template basic information</h2>
              <div className="tpl-ai-basic-grid">
                <div className="tpl-ai-group tpl-ai-group--full">
                  <label htmlFor="tpl-name">Template name</label>
                  <input
                    id="tpl-name"
                    type="text"
                    value={state.name}
                    onChange={(e) => updateTemplate("name", e.target.value)}
                    className="tpl-ai-input"
                    placeholder="e.g. Standard Invoice"
                    required
                  />
                </div>
                <div className="tpl-ai-group">
                  <label htmlFor="tpl-key">
                    Template ID (human-readable key)
                  </label>
                  <input
                    id="tpl-key"
                    type="text"
                    value={state.template_key}
                    onChange={(e) => updateTemplate("template_key", e.target.value)}
                    className="tpl-ai-input"
                    placeholder="auto-generated from the name if blank (e.g. invoice_v1)"
                  />
                </div>
                <div className="tpl-ai-group">
                  <label htmlFor="tpl-doctype">Document type</label>
                  <input
                    id="tpl-doctype"
                    type="text"
                    value={state.document_type}
                    onChange={(e) => updateTemplate("document_type", e.target.value)}
                    className="tpl-ai-input"
                    placeholder="e.g. Invoice, Receipt, Transcript"
                  />
                </div>
                <div className="tpl-ai-group tpl-ai-group--full">
                  <label htmlFor="tpl-desc">Description</label>
                  <textarea
                    id="tpl-desc"
                    value={state.description}
                    onChange={(e) => updateTemplate("description", e.target.value)}
                    className="tpl-ai-textarea"
                    rows={3}
                    placeholder="What this template extracts and when to use it."
                  />
                </div>
                <div className="tpl-ai-group">
                  <label htmlFor="tpl-lang">Language</label>
                  <select
                    id="tpl-lang"
                    value={state.language}
                    onChange={(e) => updateTemplate("language", e.target.value)}
                    className="tpl-ai-select"
                  >
                    {LANGUAGES.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="tpl-ai-group">
                  <label htmlFor="tpl-status">Status</label>
                  <select
                    id="tpl-status"
                    value={state.status}
                    onChange={(e) => updateTemplate("status", e.target.value)}
                    className="tpl-ai-select"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="tpl-ai-group">
                  <label htmlFor="tpl-version">Version</label>
                  <input
                    id="tpl-version"
                    type="text"
                    value={state.version}
                    onChange={(e) => updateTemplate("version", e.target.value)}
                    className="tpl-ai-input"
                    placeholder="1.0.0"
                  />
                </div>
              </div>
            </motion.section>

            <motion.section
              className="tpl-ai-section tpl-ai-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 }}
            >
              <div className="tpl-ai-section-head">
                <h2 className="tpl-ai-section-title">Fields builder</h2>
                <button
                  type="button"
                  className="tpl-ai-btn tpl-ai-btn--secondary"
                  onClick={addField}
                >
                  <Plus size={18} />
                  Add field
                </button>
              </div>
              <p className="tpl-ai-section-desc">
                Define every field the extraction must produce. The order is preserved both in
                the LLM prompt and in the JSON returned to API consumers.
              </p>
              <div className="tpl-ai-fields-list">
                <AnimatePresence mode="popLayout">
                  {state.fields.map((field, index) => (
                    <FieldCard
                      key={field.id}
                      field={field}
                      index={index}
                      onUpdate={updateField}
                      onRemove={removeField}
                      onMove={moveField}
                      canRemove={state.fields.length > 1}
                      totalFields={state.fields.length}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </motion.section>

            <motion.section
              className="tpl-ai-section tpl-ai-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.15 }}
            >
              <div className="tpl-ai-section-head">
                <h2 className="tpl-ai-section-title">
                  <Sparkles size={24} className="tpl-ai-section-title-icon" />
                  AI prompt configuration
                </h2>
              </div>
              <p className="tpl-ai-helper tpl-ai-helper--block">
                <Info size={18} />
                These prompt blocks are merged with OCR text at extraction time. Use{" "}
                <code>{"{{variable_name}}"}</code> to inject runtime variables.
              </p>

              <div className="tpl-ai-prompts">
                <div className="tpl-ai-group tpl-ai-group--full">
                  <label htmlFor="tpl-system-prompt">System prompt</label>
                  <textarea
                    id="tpl-system-prompt"
                    value={state.ai_config.system_prompt}
                    onChange={(e) => updateAiConfig("system_prompt", e.target.value)}
                    className="tpl-ai-textarea tpl-ai-textarea--large"
                    rows={5}
                    placeholder="You are an expert at extracting structured data from invoices…"
                  />
                </div>
                <div className="tpl-ai-group tpl-ai-group--full">
                  <label htmlFor="tpl-extraction-instructions">Extraction instructions</label>
                  <textarea
                    id="tpl-extraction-instructions"
                    value={state.ai_config.extraction_instructions}
                    onChange={(e) => updateAiConfig("extraction_instructions", e.target.value)}
                    className="tpl-ai-textarea tpl-ai-textarea--large"
                    rows={5}
                    placeholder="Step-by-step rules for the LLM (read the header, then the totals, …)."
                  />
                </div>
                <div className="tpl-ai-group tpl-ai-group--full">
                  <label htmlFor="tpl-output-format">Output format rules</label>
                  <textarea
                    id="tpl-output-format"
                    value={state.ai_config.output_format_rules}
                    onChange={(e) => updateAiConfig("output_format_rules", e.target.value)}
                    className="tpl-ai-textarea"
                    rows={3}
                    placeholder='Return only valid JSON. Use null for missing values.'
                  />
                </div>
                <div className="tpl-ai-group tpl-ai-group--full">
                  <label htmlFor="tpl-json-template">JSON output template</label>
                  <textarea
                    id="tpl-json-template"
                    value={state.ai_config.json_output_template}
                    onChange={(e) => updateAiConfig("json_output_template", e.target.value)}
                    className="tpl-ai-textarea tpl-ai-textarea--code"
                    rows={8}
                    placeholder={'{\n  "invoice_number": "",\n  "total_amount": ""\n}'}
                    spellCheck={false}
                  />
                </div>
                <div className="tpl-ai-group tpl-ai-group--full">
                  <label htmlFor="tpl-edge-cases">Edge case handling rules</label>
                  <textarea
                    id="tpl-edge-cases"
                    value={state.ai_config.edge_case_handling_rules}
                    onChange={(e) => updateAiConfig("edge_case_handling_rules", e.target.value)}
                    className="tpl-ai-textarea"
                    rows={3}
                    placeholder="What to do for missing, ambiguous, or multi-value fields."
                  />
                </div>

                <div className="tpl-ai-llm-grid">
                  <div className="tpl-ai-group">
                    <label htmlFor="tpl-llm-model">Model (optional override)</label>
                    <input
                      id="tpl-llm-model"
                      type="text"
                      value={state.ai_config.llm_model}
                      onChange={(e) => updateAiConfig("llm_model", e.target.value)}
                      className="tpl-ai-input"
                      placeholder="e.g. gpt-4o-mini (blank = global default)"
                    />
                  </div>
                  <div className="tpl-ai-group">
                    <label htmlFor="tpl-llm-temp">Temperature (0 – 2)</label>
                    <input
                      id="tpl-llm-temp"
                      type="number"
                      step="0.1"
                      min="0"
                      max="2"
                      value={state.ai_config.llm_temperature}
                      onChange={(e) => updateAiConfig("llm_temperature", e.target.value)}
                      className="tpl-ai-input"
                      placeholder="0.0"
                    />
                  </div>
                  <div className="tpl-ai-group">
                    <label htmlFor="tpl-llm-max">Max tokens</label>
                    <input
                      id="tpl-llm-max"
                      type="number"
                      min="0"
                      step="100"
                      value={state.ai_config.llm_max_tokens}
                      onChange={(e) => updateAiConfig("llm_max_tokens", e.target.value)}
                      className="tpl-ai-input"
                      placeholder="e.g. 1024"
                    />
                  </div>
                </div>
              </div>
            </motion.section>

            <motion.section
              className="tpl-ai-section tpl-ai-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.2 }}
            >
              <h2 className="tpl-ai-section-title">
                <Eye size={24} className="tpl-ai-section-title-icon" />
                Output preview
              </h2>
              <p className="tpl-ai-section-desc">
                JSON shape derived from the field list above. This is what API consumers
                receive after OCR + LLM extraction.
              </p>
              <div className="tpl-ai-preview-wrap">
                <pre className="tpl-ai-preview-json">
                  <code>{previewJson}</code>
                </pre>
              </div>
            </motion.section>

            <motion.section
              className="tpl-ai-section tpl-ai-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.25 }}
            >
              <h2 className="tpl-ai-section-title">
                <Play size={24} className="tpl-ai-section-title-icon" />
                Test the prompt against the LLM
              </h2>
              <p className="tpl-ai-section-desc">
                Paste OCR-style text from a sample document. The backend will compile this
                template's prompts and run them through OpenAI, returning a real JSON.
              </p>
              <div className="tpl-ai-test-panel">
                <div className="tpl-ai-group tpl-ai-group--full">
                  <label htmlFor="tpl-test-text">Sample document text</label>
                  <textarea
                    id="tpl-test-text"
                    value={testText}
                    onChange={(e) => setTestText(e.target.value)}
                    className="tpl-ai-textarea"
                    rows={6}
                    placeholder="Paste a snippet of OCR text (or anything you want the LLM to read)…"
                  />
                </div>
                <div>
                  <button
                    type="button"
                    className="tpl-ai-btn tpl-ai-btn--secondary"
                    onClick={handleTest}
                    disabled={testing || !state.id}
                    title={
                      !state.id
                        ? "Save the template first to enable test runs"
                        : "Run the LLM with this template's prompts"
                    }
                  >
                    {testing ? (
                      <Loader2 size={18} className="tpl-ai-spin" />
                    ) : (
                      <Play size={18} />
                    )}
                    {testing ? "Calling LLM…" : "Run test"}
                  </button>
                </div>
                {testResult && (
                  <div>
                    <p className="tpl-ai-section-desc" style={{ marginBottom: 8 }}>
                      Model: <strong>{testResult.model}</strong> — Template ID #
                      {testResult.template_id} ({testResult.template_key || "no key"})
                    </p>
                    <pre className="tpl-ai-test-result">
                      {Object.keys(testResult.extraction || {}).length
                        ? JSON.stringify(testResult.extraction, null, 2)
                        : testResult.raw_response || "(empty response)"}
                    </pre>
                  </div>
                )}
              </div>
            </motion.section>

            <motion.div
              className="tpl-ai-actions tpl-ai-actions--split"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <button
                type="button"
                className="tpl-ai-btn tpl-ai-btn--ghost"
                onClick={() => navigate("/enterprise/templates-ai")}
              >
                Back to templates
              </button>
              <button
                type="submit"
                className="tpl-ai-btn tpl-ai-btn--primary"
                disabled={saving || loading}
              >
                {saving ? <Loader2 size={20} className="tpl-ai-spin" /> : <Save size={20} />}
                {saving
                  ? isEditing
                    ? "Saving changes…"
                    : "Creating template…"
                  : isEditing
                  ? "Save changes"
                  : "Create AI Template"}
              </button>
            </motion.div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default TemplateBuilder;

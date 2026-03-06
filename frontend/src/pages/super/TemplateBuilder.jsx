import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Plus,
  Trash2,
  GripVertical,
  Sparkles,
  Eye,
  Save,
  ChevronUp,
  ChevronDown,
  Info,
} from "lucide-react";
import "../../components/variables.css";
import SuperNav from "../../components/SuperNav";
import "./template_builder.css";

const DATA_TYPES = [
  { value: "string", label: "String" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "boolean", label: "Boolean" },
];

const DOCUMENT_POSITIONS = [
  { value: "Top", label: "Top" },
  { value: "Middle", label: "Middle" },
  { value: "Bottom", label: "Bottom" },
  { value: "Custom", label: "Custom" },
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ar", label: "Arabic" },
  { value: "fr", label: "French" },
  { value: "es", label: "Spanish" },
  { value: "de", label: "German" },
  { value: "other", label: "Other" },
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
  name: "",
  description: "",
  document_type: "",
  language: "en",
  status: "active",
  version: "1.0.0",
  fields: [createDefaultField(0)],
  ai_config: {
    system_prompt: "",
    extraction_instructions: "",
    output_format_rules: "",
    json_output_template: "",
    edge_case_handling_rules: "",
  },
});

export function getTemplatePayloadForApi(state) {
  const template = {
    name: state.name,
    description: state.description || null,
    document_type: state.document_type || null,
    language: state.language,
    status: state.status,
    version: state.version || "1.0.0",
  };

  const fields = state.fields
    .filter((f) => f.name && f.display_label)
    .map((f, index) => ({
      name: f.name.trim(),
      display_label: f.display_label.trim(),
      data_type: f.data_type,
      required: f.required,
      document_position: f.document_position,
      extraction_hint: f.extraction_hint?.trim() || null,
      example_value: f.example_value?.trim() || null,
      validation_rules: f.validation_rules?.trim() || null,
      field_order: f.field_order ?? index,
    }));

  const ai_config = {
    system_prompt: state.ai_config.system_prompt || null,
    extraction_instructions: state.ai_config.extraction_instructions || null,
    output_format_rules: state.ai_config.output_format_rules || null,
    json_output_template: state.ai_config.json_output_template || null,
    edge_case_handling_rules: state.ai_config.edge_case_handling_rules || null,
  };

  return {
    template,
    fields,
    ai_config,
  };
}

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
            placeholder="e.g. university_name"
            className="tpl-ai-input"
          />
        </div>
        <div className="tpl-ai-field-group">
          <label>Display label</label>
          <input
            type="text"
            value={field.display_label}
            onChange={(e) => update("display_label", e.target.value)}
            placeholder="e.g. University Name"
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
          <select
            value={field.document_position}
            onChange={(e) => update("document_position", e.target.value)}
            className="tpl-ai-select"
          >
            {DOCUMENT_POSITIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="tpl-ai-field-group tpl-ai-field-group--full">
          <label>Extraction hint</label>
          <input
            type="text"
            value={field.extraction_hint}
            onChange={(e) => update("extraction_hint", e.target.value)}
            placeholder="Short helper text for the LLM"
            className="tpl-ai-input"
          />
        </div>
        <div className="tpl-ai-field-group">
          <label>Example value</label>
          <input
            type="text"
            value={field.example_value}
            onChange={(e) => update("example_value", e.target.value)}
            placeholder="e.g. MIT"
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

function TemplateBuilder() {
  const [state, setState] = useState(getInitialState);

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
      return {
        ...prev,
        fields: [...prev.fields, createDefaultField(nextOrder)],
      };
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

  const moveField = useCallback((fromIndex, direction) => {
    const toIndex = fromIndex + direction;
    if (toIndex < 0 || toIndex >= state.fields.length) return;
    setState((prev) => {
      const arr = [...prev.fields];
      const [removed] = arr.splice(fromIndex, 1);
      arr.splice(toIndex, 0, removed);
      return {
        ...prev,
        fields: arr.map((f, i) => ({ ...f, field_order: i })),
      };
    });
  }, [state.fields.length]);

  const previewJson = useMemo(() => {
    const obj = {};
    state.fields.forEach((f) => {
      const key = f.name.trim() || `field_${f.field_order}`;
      obj[key] = f.example_value?.trim() || "";
    });
    return JSON.stringify(obj, null, 2);
  }, [state.fields]);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      const payload = getTemplatePayloadForApi(state);
      console.log("Template payload (ready for API):", payload);
    },
    [state]
  );

  return (
    <div className="super-template-builder">
      <SuperNav
        userName="Super Admin"
        userEmail="admin@autodoc.ai"
        onLogout={() => {}}
        onSettings={() => {}}
        onSearch={() => {}}
      />
      <main className="super-template-builder-main">
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
            <h1 className="tpl-ai-header-title">AI Template Builder</h1>
            <p className="tpl-ai-header-subtitle">
              Configure extraction templates that drive OCR (Tesseract) and LLM (OpenAI) behavior.
              Define fields and prompts; extracted data is stored in PostgreSQL.
            </p>
          </motion.header>

          <form onSubmit={handleSubmit} className="tpl-ai-form">
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
                    placeholder="e.g. University Transcript"
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
                    placeholder="What this template is used for"
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
                    placeholder="e.g. Transcript, Invoice"
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
                <div className="tpl-ai-group tpl-ai-group--toggle">
                  <label>Status</label>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={state.status === "active"}
                    className={`tpl-ai-toggle ${state.status === "active" ? "tpl-ai-toggle--on" : ""}`}
                    onClick={() =>
                      updateTemplate("status", state.status === "active" ? "inactive" : "active")
                    }
                  >
                    <span className="tpl-ai-toggle-thumb" />
                  </button>
                  <span className="tpl-ai-toggle-label">
                    {state.status === "active" ? "Active" : "Inactive"}
                  </span>
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
                Define the fields to extract. Order is used for display and output.
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
                This prompt will be combined with OCR text and sent to the LLM for structured
                extraction.
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
                    placeholder="You are an extraction assistant. Extract the following fields from the document..."
                  />
                </div>
                <div className="tpl-ai-group tpl-ai-group--full">
                  <label htmlFor="tpl-extraction-instructions">Extraction instructions</label>
                  <textarea
                    id="tpl-extraction-instructions"
                    value={state.ai_config.extraction_instructions}
                    onChange={(e) =>
                      updateAiConfig("extraction_instructions", e.target.value)
                    }
                    className="tpl-ai-textarea tpl-ai-textarea--large"
                    rows={5}
                    placeholder="Step-by-step instructions for the LLM"
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
                    placeholder="Return only valid JSON. Use empty string for missing values."
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
                    placeholder='{"field_name": ""}'
                    spellCheck={false}
                  />
                </div>
                <div className="tpl-ai-group tpl-ai-group--full">
                  <label htmlFor="tpl-edge-cases">Edge case handling rules</label>
                  <textarea
                    id="tpl-edge-cases"
                    value={state.ai_config.edge_case_handling_rules}
                    onChange={(e) =>
                      updateAiConfig("edge_case_handling_rules", e.target.value)
                    }
                    className="tpl-ai-textarea"
                    rows={3}
                    placeholder="How to handle missing, ambiguous, or multi-value fields"
                  />
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
                JSON structure built from the fields above. This is the shape returned after
                extraction.
              </p>
              <div className="tpl-ai-preview-wrap">
                <pre className="tpl-ai-preview-json">
                  <code>{previewJson}</code>
                </pre>
              </div>
            </motion.section>

            <motion.div
              className="tpl-ai-actions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <button type="submit" className="tpl-ai-btn tpl-ai-btn--primary">
                <Save size={20} />
                Create AI Template
              </button>
            </motion.div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default TemplateBuilder;

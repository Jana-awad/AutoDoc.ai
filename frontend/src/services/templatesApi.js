/**
 * Frontend API client for the Super Admin Template Builder.
 *
 * Mirrors the backend endpoints in `app/api/routes/templates.py`. Handles
 * Authorization, JSON parsing, and converting FastAPI's `{detail: ...}`
 * error envelope into a friendly `Error` message.
 */
import { getApiBaseUrl } from "../api/config";
import { notifySessionExpired } from "../context/AuthContext";

const API_BASE = `${getApiBaseUrl()}/templates`;

const buildHeaders = (token, extra = {}) => {
  const headers = { Accept: "application/json", ...extra };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

const parseError = async (response) => {
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    /* not JSON */
  }
  const detail = payload?.detail ?? payload?.message ?? payload?.error;
  const message = Array.isArray(detail)
    ? detail.map((d) => d?.msg || d).join(", ")
    : detail;
  // 401 always means the JWT is bad/expired — notify the auth provider so it
  // can wipe the session and bounce the user to /login. We surface a friendly
  // message to the caller too.
  if (response.status === 401) {
    notifySessionExpired("api-401");
    const error = new Error("Your session has expired. Please log in again.");
    error.status = 401;
    error.payload = payload;
    return error;
  }
  const error = new Error(message || `Request failed: ${response.status}`);
  error.status = response.status;
  error.payload = payload;
  return error;
};

const requestJson = async (path, { method = "GET", token, body, signal } = {}) => {
  // Bail out *before* the network round-trip if we already know there's no
  // valid session. The user just clicked a button after their JWT expired —
  // showing them a clear message beats a confusing 401 in the console.
  if (token === null || token === undefined) {
    notifySessionExpired("missing-token");
    const error = new Error("Your session has expired. Please log in again.");
    error.status = 401;
    throw error;
  }
  const init = {
    method,
    headers: buildHeaders(token, body !== undefined ? { "Content-Type": "application/json" } : {}),
    signal,
  };
  if (body !== undefined) init.body = JSON.stringify(body);
  const response = await fetch(path, init);
  if (!response.ok) throw await parseError(response);
  if (response.status === 204) return null;
  return response.json();
};

export const fetchTemplates = ({ token, signal } = {}) =>
  requestJson(API_BASE, { token, signal });

export const fetchTemplateFull = (id, { token, signal } = {}) =>
  requestJson(`${API_BASE}/${id}/full`, { token, signal });

export const createTemplateFromBuilder = (payload, { token, signal } = {}) =>
  requestJson(`${API_BASE}/builder`, { method: "POST", token, body: payload, signal });

export const updateTemplateFromBuilder = (id, payload, { token, signal } = {}) =>
  requestJson(`${API_BASE}/${id}/builder`, {
    method: "PUT",
    token,
    body: payload,
    signal,
  });

export const deleteTemplate = (id, { token, signal } = {}) =>
  requestJson(`${API_BASE}/${id}`, { method: "DELETE", token, signal });

export const generateWithTemplate = (id, payload, { token, signal } = {}) =>
  requestJson(`${API_BASE}/${id}/generate`, {
    method: "POST",
    token,
    body: payload,
    signal,
  });

/**
 * Upload a JSON template file. Server accepts both the full builder shape
 * (`{template, fields, ai_config}`) and a flat `{name, fields, ...}` object.
 */
export const uploadTemplateFile = async (file, { token, signal } = {}) => {
  if (!file) throw new Error("Choose a file to upload");
  if (token === null || token === undefined) {
    notifySessionExpired("missing-token");
    const error = new Error("Your session has expired. Please log in again.");
    error.status = 401;
    throw error;
  }
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    headers: buildHeaders(token),
    body: formData,
    signal,
  });
  if (!response.ok) throw await parseError(response);
  return response.json();
};

/**
 * Convenience helper: turn the React form state used by the Template Builder
 * UI into the JSON shape the backend expects. Mirrors
 * `getTemplatePayloadForApi` in TemplateBuilder.jsx but returns the *builder*
 * payload (with template/fields/ai_config), not the legacy CRUD shape.
 */
export function buildTemplatePayload(state) {
  const ai = state.ai_config || {};
  return {
    template: {
      template_key: state.template_key?.trim() || null,
      name: (state.name || "").trim(),
      description: state.description?.trim() || null,
      document_type: state.document_type?.trim() || null,
      language: state.language || "en",
      status: state.status || "active",
      version: (state.version || "1.0.0").trim(),
      is_global: state.is_global ?? true,
      client_id: state.client_id ?? null,
    },
    fields: (state.fields || [])
      .filter((f) => (f.name || "").trim())
      .map((f, index) => ({
        name: (f.name || "").trim(),
        display_label: (f.display_label || "").trim() || null,
        data_type: f.data_type || "string",
        required: Boolean(f.required),
        document_position: (f.document_position || "").trim() || null,
        extraction_hint: (f.extraction_hint || "").trim() || null,
        example_value: (f.example_value || "").trim() || null,
        validation_rules: (f.validation_rules || "").trim() || null,
        field_order: typeof f.field_order === "number" ? f.field_order : index,
      })),
    ai_config: {
      system_prompt: ai.system_prompt?.trim() || null,
      extraction_instructions: ai.extraction_instructions?.trim() || null,
      output_format_rules: ai.output_format_rules?.trim() || null,
      json_output_template: ai.json_output_template?.trim() || null,
      edge_case_handling_rules: ai.edge_case_handling_rules?.trim() || null,
      llm_model: ai.llm_model?.trim() || null,
      llm_temperature:
        ai.llm_temperature === "" || ai.llm_temperature == null
          ? null
          : Number(ai.llm_temperature),
      llm_max_tokens:
        ai.llm_max_tokens === "" || ai.llm_max_tokens == null
          ? null
          : Number(ai.llm_max_tokens),
    },
  };
}

/**
 * Inverse of `buildTemplatePayload`: turn a `TemplateBuilderOut` response into
 * the form state used by the React component (so we can hydrate "edit mode").
 */
export function builderResponseToFormState(response) {
  if (!response) return null;
  const tpl = response.template || {};
  const ai = response.ai_config || {};
  return {
    id: response.id,
    template_key: tpl.template_key || "",
    name: tpl.name || "",
    description: tpl.description || "",
    document_type: tpl.document_type || "",
    language: tpl.language || "en",
    status: tpl.status || "active",
    version: tpl.version || "1.0.0",
    is_global: tpl.is_global ?? true,
    client_id: tpl.client_id ?? null,
    fields: (response.fields || []).map((f, i) => ({
      id: f.id ?? `f-${i}`,
      name: f.name || "",
      display_label: f.display_label || "",
      data_type: f.data_type || "string",
      required: Boolean(f.required),
      document_position: f.document_position || "",
      extraction_hint: f.extraction_hint || "",
      example_value: f.example_value || "",
      validation_rules: f.validation_rules || "",
      field_order: typeof f.field_order === "number" ? f.field_order : i,
    })),
    ai_config: {
      system_prompt: ai.system_prompt || "",
      extraction_instructions: ai.extraction_instructions || "",
      output_format_rules: ai.output_format_rules || "",
      json_output_template: ai.json_output_template || "",
      edge_case_handling_rules: ai.edge_case_handling_rules || "",
      llm_model: ai.llm_model || "",
      llm_temperature:
        ai.llm_temperature === null || ai.llm_temperature === undefined
          ? ""
          : ai.llm_temperature,
      llm_max_tokens:
        ai.llm_max_tokens === null || ai.llm_max_tokens === undefined
          ? ""
          : ai.llm_max_tokens,
    },
  };
}

/**
 * EIntegrationHelpers - Template ID reference, endpoint docs links, copyable headers, auth method.
 */
import { useState } from "react";
import "./EIntegrationHelpers.css";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const DOCS_URL = import.meta.env.VITE_DOCS_URL || "#";
const API_BASE_PATH = "/api/v1";

function EIntegrationHelpers({ templateId, authMethod = "Bearer token" }) {
  const [copied, setCopied] = useState(null);

  const headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_API_KEY",
  };
  const headersStr = JSON.stringify(headers, null, 2);

  const copy = (text, key) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  return (
    <div className="e-integration-helpers glass-card">
      <h3 className="e-integration-helpers__title">Integration helpers</h3>
      <p className="e-integration-helpers__subtitle">
        Template ID reference, endpoint documentation, copyable request headers, authentication.
      </p>

      <div className="e-integration-helpers__grid">
        <div className="e-integration-helpers__block">
          <span className="e-integration-helpers__label">Template ID reference</span>
          <div className="e-integration-helpers__row">
            <code className="e-integration-helpers__code">{templateId || "—"}</code>
            <button
              type="button"
              className="e-integration-helpers__copy"
              onClick={() => copy(templateId || "", "template")}
            >
              {copied === "template" ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        <div className="e-integration-helpers__block">
          <span className="e-integration-helpers__label">Authentication</span>
          <p className="e-integration-helpers__text">{authMethod}</p>
        </div>

        <div className="e-integration-helpers__block">
          <span className="e-integration-helpers__label">Endpoint documentation</span>
          <a href={DOCS_URL} className="e-integration-helpers__link" target="_blank" rel="noopener noreferrer">
            View API docs →
          </a>
        </div>
      </div>

      <div className="e-integration-helpers__block e-integration-helpers__block--headers">
        <span className="e-integration-helpers__label">Copyable request headers</span>
        <div className="e-integration-helpers__pre-wrap">
          <pre className="e-integration-helpers__pre">{headersStr}</pre>
          <button
            type="button"
            className="e-integration-helpers__copy e-integration-helpers__copy--block"
            onClick={() => copy(headersStr, "headers")}
          >
            {copied === "headers" ? "Copied" : "Copy headers"}
          </button>
        </div>
      </div>

      <p className="e-integration-helpers__base">
        Base URL: <code>{BASE_URL || "Same origin"}{API_BASE_PATH}</code>
      </p>
    </div>
  );
}

export default EIntegrationHelpers;

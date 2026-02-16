/**
 * EApiIntegration - Template ID usage, sample request/response, copy-to-clipboard.
 */
import { useState } from "react";
import "./EApiIntegration.css";

const SAMPLE_REQUEST = {
  method: "POST",
  url: "https://api.autodoc.ai/v1/extract",
  headers: { "Content-Type": "application/json", "Authorization": "Bearer YOUR_API_KEY" },
  body: {
    template_id: "inv_std_001",
    document_url: "https://example.com/invoice.pdf",
  },
};

const SAMPLE_RESPONSE = {
  success: true,
  template_id: "inv_std_001",
  extracted: {
    invoice_number: "INV-2025-001",
    date: "2025-02-07",
    vendor: "Acme Corp",
    total: 1250.0,
  },
  confidence: 0.95,
};

function EApiIntegration({ templateId = "inv_std_001" }) {
  const [copied, setCopied] = useState(null);

  const copyToClipboard = (text, key) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const requestStr = JSON.stringify(
    { ...SAMPLE_REQUEST.body, template_id: templateId },
    null,
    2
  );
  const responseStr = JSON.stringify(
    { ...SAMPLE_RESPONSE, template_id: templateId },
    null,
    2
  );

  return (
    <div className="e-api-integration glass-card">
      <h3 className="e-api-integration-title">API integration</h3>
      <p className="e-api-integration-desc">
        Use this Template ID in your API requests to process documents with this template.
      </p>

      <div className="e-api-integration-template-id">
        <span className="e-api-integration-label">Template ID</span>
        <div className="e-api-integration-id-wrap">
          <code className="e-api-integration-id">{templateId}</code>
          <button
            type="button"
            className="e-api-integration-copy"
            onClick={() => copyToClipboard(templateId, "id")}
            title="Copy Template ID"
          >
            {copied === "id" ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      <div className="e-api-integration-samples">
        <div className="e-api-integration-sample">
          <div className="e-api-integration-sample-header">
            <span>Sample request (JSON)</span>
            <button
              type="button"
              className="e-api-integration-copy"
              onClick={() => copyToClipboard(requestStr, "req")}
            >
              {copied === "req" ? "Copied!" : "Copy"}
            </button>
          </div>
          <pre className="e-api-integration-pre">{requestStr}</pre>
        </div>
        <div className="e-api-integration-sample">
          <div className="e-api-integration-sample-header">
            <span>Sample response (JSON)</span>
            <button
              type="button"
              className="e-api-integration-copy"
              onClick={() => copyToClipboard(responseStr, "res")}
            >
              {copied === "res" ? "Copied!" : "Copy"}
            </button>
          </div>
          <pre className="e-api-integration-pre">{responseStr}</pre>
        </div>
      </div>
    </div>
  );
}

export default EApiIntegration;

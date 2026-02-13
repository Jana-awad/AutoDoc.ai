/**
 * EApiKeyCard - Single API key row: masked key, reveal, copy, revoke/rotate, metadata.
 */
import { useState } from "react";
import "./EApiKeyCard.css";

function EApiKeyCard({
  id,
  name,
  keyPreview,
  environment,
  createdAt,
  lastUsedAt,
  onCopy,
  onRevoke,
  onRotate,
  isRevoking,
}) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const displayKey = revealed ? keyPreview : (keyPreview || "sk_live_••••••••••••••••");
  const handleCopy = () => {
    if (keyPreview && onCopy) {
      onCopy(keyPreview);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const envClass =
    environment === "production"
      ? "e-api-key-card__env--production"
      : environment === "staging"
      ? "e-api-key-card__env--staging"
      : "e-api-key-card__env--development";

  return (
    <div className="e-api-key-card glass-card">
      <div className="e-api-key-card__row">
        <div className="e-api-key-card__meta">
          <span className={`e-api-key-card__env ${envClass}`}>{environment || "development"}</span>
          {name && <span className="e-api-key-card__name">{name}</span>}
        </div>
        <div className="e-api-key-card__key-wrap">
          <code className="e-api-key-card__key">{displayKey}</code>
          {keyPreview && (
            <>
              <button
                type="button"
                className="e-api-key-card__btn e-api-key-card__btn--icon"
                onClick={() => setRevealed((v) => !v)}
                title={revealed ? "Hide" : "Reveal"}
                aria-label={revealed ? "Hide key" : "Reveal key"}
              >
                {revealed ? "Hide" : "Show"}
              </button>
              <button
                type="button"
                className="e-api-key-card__btn e-api-key-card__btn--icon"
                onClick={handleCopy}
                title="Copy"
                aria-label="Copy key"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </>
          )}
        </div>
      </div>
      <div className="e-api-key-card__footer">
        {createdAt && (
          <span className="e-api-key-card__date">Created {formatDate(createdAt)}</span>
        )}
        {lastUsedAt != null && (
          <span className="e-api-key-card__date">Last used {formatDate(lastUsedAt)}</span>
        )}
        <div className="e-api-key-card__actions">
          {onRotate && (
            <button
              type="button"
              className="e-api-key-card__btn e-api-key-card__btn--secondary"
              onClick={() => onRotate(id)}
              disabled={isRevoking}
            >
              Rotate
            </button>
          )}
          {onRevoke && (
            <button
              type="button"
              className="e-api-key-card__btn e-api-key-card__btn--danger"
              onClick={() => onRevoke(id)}
              disabled={isRevoking}
            >
              {isRevoking ? "Revoking…" : "Revoke"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString(undefined, { dateStyle: "medium" });
}

export default EApiKeyCard;

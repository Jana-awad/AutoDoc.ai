/**
 * ETemplateTraining - Visual training engine for enterprise.
 * Shows training progress, status, retrain, confidence scores.
 */
import { useState, useEffect } from "react";
import { fetchTrainingStatus } from "../services/enterpriseTemplatesApi";
import "./ETemplateTraining.css";

function ETemplateTraining({ templateId, templateName, onRetrain }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetchTrainingStatus(templateId);
        if (!cancelled) setData(res.data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [templateId]);

  if (loading) {
    return (
      <div className="e-template-training glass-card">
        <div className="e-template-training-loading">Loading training status…</div>
      </div>
    );
  }

  if (!data) return null;

  const confidencePercent = Math.round((data.confidenceScore ?? 0) * 100);
  const formatEta = (iso) => {
    try {
      return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    } catch {
      return iso;
    }
  };

  return (
    <div className="e-template-training glass-card">
      <div className="e-template-training-header">
        <h3 className="e-template-training-title">Template Training Engine</h3>
        {templateName && (
          <span className="e-template-training-template">{templateName}</span>
        )}
      </div>

      <div className="e-template-training-status-row">
        <span className={`e-template-training-status e-template-training-status--${(data.status || "").toLowerCase()}`}>
          {data.status}
        </span>
        {data.estimatedCompletion && (
          <span className="e-template-training-eta">
            ETA: {formatEta(data.estimatedCompletion)}
          </span>
        )}
      </div>

      <div className="e-template-training-progress-wrap">
        <div className="e-template-training-progress-bar">
          <div
            className="e-template-training-progress-fill"
            style={{ width: `${data.progress ?? 0}%` }}
          />
        </div>
        <span className="e-template-training-progress-label">{data.progress ?? 0}% complete</span>
      </div>

      <div className="e-template-training-confidence">
        <span className="e-template-training-confidence-label">Field confidence score</span>
        <div className="e-template-training-confidence-bar">
          <div
            className="e-template-training-confidence-fill"
            style={{ width: `${confidencePercent}%` }}
          />
        </div>
        <span className="e-template-training-confidence-value">{confidencePercent}%</span>
      </div>

      {onRetrain && (
        <button
          type="button"
          className="e-template-training-retrain btn btn-primary"
          onClick={() => onRetrain(data)}
        >
          Retrain & improve accuracy
        </button>
      )}
    </div>
  );
}

export default ETemplateTraining;

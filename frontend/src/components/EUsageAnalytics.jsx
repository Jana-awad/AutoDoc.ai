/**
 * EUsageAnalytics - Usage dashboard: documents processed, success rate.
 */
import { useState, useEffect } from "react";
import { fetchUsageAnalytics } from "../services/enterpriseTemplatesApi";
import EUnlimitedBadge from "./EUnlimitedBadge";
import "./EUsageAnalytics.css";

function EUsageAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetchUsageAnalytics();
        if (!cancelled) setData(res.data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="e-usage-analytics glass-card">
        <div className="e-usage-analytics-loading">Loading usage…</div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="e-usage-analytics glass-card">
      <div className="e-usage-analytics-header">
        <h3 className="e-usage-analytics-title">Usage analytics</h3>
        <EUnlimitedBadge compact />
      </div>
      <div className="e-usage-analytics-grid">
        <div className="e-usage-analytics-card">
          <span className="e-usage-analytics-label">Documents processed (total)</span>
          <span className="e-usage-analytics-value">{data.documentsProcessed?.toLocaleString() ?? "—"}</span>
        </div>
        <div className="e-usage-analytics-card">
          <span className="e-usage-analytics-label">Success rate</span>
          <span className="e-usage-analytics-value e-usage-analytics-value--highlight">
            {data.successRate ?? "—"}%
          </span>
        </div>
        <div className="e-usage-analytics-card">
          <span className="e-usage-analytics-label">This month</span>
          <span className="e-usage-analytics-value">{data.thisMonth?.toLocaleString() ?? "—"}</span>
        </div>
        <div className="e-usage-analytics-card">
          <span className="e-usage-analytics-label">Last month</span>
          <span className="e-usage-analytics-value">{data.lastMonth?.toLocaleString() ?? "—"}</span>
        </div>
      </div>
    </div>
  );
}

export default EUsageAnalytics;

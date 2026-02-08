/**
 * ESupportSection - Enterprise support: 24/7, account manager, SLA, quick-access.
 */
import { useState, useEffect } from "react";
import { MOCK_SUPPORT } from "../services/enterpriseTemplatesApi";
import "./ESupportSection.css";

function ESupportSection() {
  const [data, setData] = useState(null);

  useEffect(() => {
    setData(MOCK_SUPPORT);
  }, []);

  if (!data) return null;

  const handleSupportClick = () => {
    // In production: open chat widget or ticket form
    window.alert("Support: Open chat or create ticket (integrate with your support system).");
  };

  return (
    <div className="e-support-section glass-card">
      <div className="e-support-header">
        <h3 className="e-support-title">Enterprise support</h3>
        <span className="e-support-badge e-support-badge--live">24/7 Priority Support</span>
      </div>

      <div className="e-support-sla">
        <span className="e-support-sla-label">SLA</span>
        <span className="e-support-sla-value">{data.sla}</span>
      </div>

      {data.accountManager && (
        <div className="e-support-account">
          <span className="e-support-account-label">Assigned account manager</span>
          <div className="e-support-account-details">
            <span className="e-support-account-name">{data.accountManager.name}</span>
            <a href={`mailto:${data.accountManager.email}`} className="e-support-account-email">
              {data.accountManager.email}
            </a>
            {data.accountManager.phone && (
              <a href={`tel:${data.accountManager.phone}`} className="e-support-account-phone">
                {data.accountManager.phone}
              </a>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        className="e-support-btn btn btn-primary"
        onClick={handleSupportClick}
      >
        Contact support (chat / ticket)
      </button>
    </div>
  );
}

export default ESupportSection;

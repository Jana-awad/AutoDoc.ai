/**
 * EEnterpriseSupportSection - SLA status, priority support badge, account manager, escalation CTA.
 */
import "./EEnterpriseSupportSection.css";

function EEnterpriseSupportSection({ data = null, loading = false, error = null, onRetry }) {
  if (loading) {
    return (
      <div className="e-enterprise-support glass-card">
        <h3 className="e-enterprise-support__title">Enterprise support</h3>
        <div className="e-enterprise-support__skeleton" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="e-enterprise-support glass-card">
        <h3 className="e-enterprise-support__title">Enterprise support</h3>
        <div className="e-enterprise-support__error">
          <p>Unable to load support details.</p>
          {onRetry && (
            <button type="button" className="e-enterprise-support__retry" onClick={onRetry}>
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  const support = data || {};
  const slaStatus = support.sla_status ?? support.slaStatus ?? "Active";
  const prioritySupport = support.priority_support ?? support.prioritySupport !== false;
  const accountManager = support.account_manager ?? support.accountManager ?? null;
  const escalationUrl = support.escalation_url ?? support.escalationUrl ?? "#";
  const escalationLabel = support.escalation_label ?? support.escalationLabel ?? "Open incident / escalate";

  return (
    <div className="e-enterprise-support glass-card">
      <h3 className="e-enterprise-support__title">Enterprise support</h3>
      <p className="e-enterprise-support__subtitle">
        SLA status, priority support, account manager contact, incident escalation.
      </p>

      <div className="e-enterprise-support__badges">
        <span className="e-enterprise-support__badge e-enterprise-support__badge--sla">
          SLA: {slaStatus}
        </span>
        {prioritySupport && (
          <span className="e-enterprise-support__badge e-enterprise-support__badge--priority">
            Priority support
          </span>
        )}
      </div>

      {accountManager && (
        <div className="e-enterprise-support__manager">
          <span className="e-enterprise-support__manager-label">Account manager</span>
          <p className="e-enterprise-support__manager-name">{accountManager.name ?? "—"}</p>
          {accountManager.email && (
            <a href={`mailto:${accountManager.email}`} className="e-enterprise-support__manager-email">
              {accountManager.email}
            </a>
          )}
          {accountManager.phone && (
            <a href={`tel:${accountManager.phone}`} className="e-enterprise-support__manager-phone">
              {accountManager.phone}
            </a>
          )}
        </div>
      )}

      <div className="e-enterprise-support__cta">
        <a
          href={escalationUrl}
          className="e-enterprise-support__cta-btn"
          target="_blank"
          rel="noopener noreferrer"
        >
          {escalationLabel}
        </a>
      </div>

      {!support.sla_status && !accountManager && !prioritySupport && (
        <div className="e-enterprise-support__empty">
          <p>Support details will appear here for your Enterprise plan.</p>
        </div>
      )}
    </div>
  );
}

export default EEnterpriseSupportSection;

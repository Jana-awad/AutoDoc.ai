import React, { useEffect, useState } from "react";
import "./ClientDetailsDrawer.css";

function getInitials(name, companyName) {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.trim().slice(0, 2).toUpperCase();
  }
  if (companyName && companyName.trim()) {
    return companyName.trim().slice(0, 2).toUpperCase();
  }
  return "—";
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function RoleBadge({ role }) {
  const isAdmin = (role || "").toLowerCase().includes("admin");
  return (
    <span className={`cp-drawer-role ${isAdmin ? "cp-drawer-role--admin" : "cp-drawer-role--user"}`}>
      {role === "business_admin" || role === "enterprise_admin" ? "Admin" : "User"}
    </span>
  );
}

function ClientDetailsDrawer({
  open,
  onClose,
  data,
  loading,
  onUpgradePlan,
  onResetApiKey,
  onManageUsers,
  onOpenLogs,
  onDeleteClient,
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setShowDeleteConfirm(false);
      setDeleting(false);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const usagePct = data?.api_quota
    ? Math.min(100, Math.round((data.api_calls_this_month / data.api_quota) * 100))
    : (data?.api_calls_this_month > 0 ? 10 : 0);

  return (
    <>
      <div className="cp-drawer-backdrop" onClick={onClose} aria-hidden />
      <div className="cp-drawer" role="dialog" aria-label="Client details">
        <div className="cp-drawer__inner">
          <header className="cp-drawer__header">
            <h2 className="cp-drawer__title">Client Details</h2>
            <button
              type="button"
              className="cp-drawer__close"
              onClick={onClose}
              aria-label="Close"
            >
              ✕
            </button>
          </header>

          {loading ? (
            <div className="cp-drawer__loading">Loading…</div>
          ) : !data ? (
            <div className="cp-drawer__empty">No client selected.</div>
          ) : (
            <div className="cp-drawer__body">
              <div className="cp-drawer-client-header">
                <div className="cp-drawer-avatar">
                  {getInitials(data.name, data.company_name)}
                </div>
                <div>
                  <div className="cp-drawer-client-name">{data.name || "—"}</div>
                  <div className="cp-drawer-client-id">ID: {data.id}</div>
                </div>
              </div>

              <div className="cp-drawer-meta-row">
                <div className="cp-drawer-meta-card">
                  <span className="cp-drawer-meta-icon">🏭</span>
                  <div>
                    <div className="cp-drawer-meta-label">Industry</div>
                    <div className="cp-drawer-meta-value">{data.industry || "—"}</div>
                  </div>
                </div>
                <div className="cp-drawer-meta-card">
                  <span className="cp-drawer-meta-icon">🌍</span>
                  <div>
                    <div className="cp-drawer-meta-label">Country</div>
                    <div className="cp-drawer-meta-value">{data.country || "—"}</div>
                  </div>
                </div>
              </div>

              <section className="cp-drawer-section">
                <h3 className="cp-drawer-section__title">Subscription Information</h3>
                <div className="cp-drawer-rows">
                  <div className="cp-drawer-row">
                    <span className="cp-drawer-row__label">Current Plan</span>
                    <span className="cp-drawer-row__value">{data.plan_name || "—"}</span>
                  </div>
                  <div className="cp-drawer-row">
                    <span className="cp-drawer-row__label">Status</span>
                    <span className="cp-drawer-row__value">{data.subscription_status || "—"}</span>
                  </div>
                  <div className="cp-drawer-row">
                    <span className="cp-drawer-row__label">Billing Cycle</span>
                    <span className="cp-drawer-row__value">{data.billing_cycle || "—"}</span>
                  </div>
                  <div className="cp-drawer-row">
                    <span className="cp-drawer-row__label">Renewal Date</span>
                    <span className="cp-drawer-row__value">{formatDate(data.renewal_date)}</span>
                  </div>
                  <div className="cp-drawer-row">
                    <span className="cp-drawer-row__label">Payment Status</span>
                    <span className="cp-drawer-row__value">{data.payment_status || "—"}</span>
                  </div>
                </div>
                {onUpgradePlan && (
                  <button type="button" className="cp-drawer-btn cp-drawer-btn--primary" onClick={onUpgradePlan}>
                    Upgrade / Downgrade Plan
                  </button>
                )}
              </section>

              <section className="cp-drawer-section">
                <h3 className="cp-drawer-section__title">API Usage</h3>
                <div className="cp-drawer-progress-wrap">
                  <div className="cp-progress cp-drawer-progress">
                    <div className="cp-progress-fill" style={{ width: `${usagePct}%` }} />
                  </div>
                </div>
                <div className="cp-drawer-rows">
                  <div className="cp-drawer-row">
                    <span className="cp-drawer-row__label">Calls this month</span>
                    <span className="cp-drawer-row__value">{data.api_calls_this_month?.toLocaleString() ?? 0}</span>
                  </div>
                  <div className="cp-drawer-row">
                    <span className="cp-drawer-row__label">Quota</span>
                    <span className="cp-drawer-row__value">{data.api_quota != null ? data.api_quota.toLocaleString() : "Unlimited"}</span>
                  </div>
                  <div className="cp-drawer-row">
                    <span className="cp-drawer-row__label">Usage percentage</span>
                    <span className="cp-drawer-row__value">{data.api_quota ? `${Math.min(100, Math.round((data.api_calls_this_month / data.api_quota) * 100))}%` : "—"}</span>
                  </div>
                </div>
                <div className="cp-drawer-small-card">
                  <span className="cp-drawer-small-card__label">Daily Average API Calls</span>
                  <span className="cp-drawer-small-card__value">{data.daily_average_api_calls ?? 0}</span>
                </div>
                {onResetApiKey && (
                  <button type="button" className="cp-drawer-btn cp-drawer-btn--secondary" onClick={onResetApiKey}>
                    Reset API Key
                  </button>
                )}
              </section>

              <section className="cp-drawer-section">
                <h3 className="cp-drawer-section__title">Client Users</h3>
                <div className="cp-drawer-users">
                  {(!data.users || data.users.length === 0) ? (
                    <div className="cp-drawer-users-empty">No users.</div>
                  ) : (
                    data.users.map((u, i) => (
                      <div key={u.id} className="cp-drawer-user-item">
                        <div className="cp-drawer-user-avatar">
                          {u.name ? (u.name.trim().slice(0, 2).toUpperCase()) : (u.email?.slice(0, 2).toUpperCase() || "—")}
                        </div>
                        <div className="cp-drawer-user-info">
                          <div className="cp-drawer-user-name">{u.name || u.email || "—"}</div>
                          <div className="cp-drawer-user-email">{u.email}</div>
                          <RoleBadge role={u.role} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <footer className="cp-drawer__footer">
                {onManageUsers && (
                  <button type="button" className="cp-drawer-btn cp-drawer-btn--primary" onClick={onManageUsers}>
                    Manage Client Users
                  </button>
                )}
                {onOpenLogs && (
                  <button type="button" className="cp-drawer-btn cp-drawer-btn--secondary" onClick={onOpenLogs}>
                    Open Full Logs Page
                  </button>
                )}
                {onDeleteClient && (
                  <button
                    type="button"
                    className="cp-drawer-btn cp-drawer-btn--danger"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={deleting}
                  >
                    Delete Client
                  </button>
                )}
              </footer>

              {showDeleteConfirm && (
                <div className="cp-drawer-confirm-backdrop" onClick={() => !deleting && setShowDeleteConfirm(false)} aria-hidden />
              )}
              {showDeleteConfirm && (
                <div className="cp-drawer-confirm" role="dialog" aria-labelledby="cp-delete-title">
                  <h3 id="cp-delete-title" className="cp-drawer-confirm__title">Delete client?</h3>
                  <p className="cp-drawer-confirm__text">
                    This will permanently delete <strong>{data?.name}</strong> and all related data (users, subscriptions, documents, templates, API logs). This cannot be undone.
                  </p>
                  <div className="cp-drawer-confirm__actions">
                    <button
                      type="button"
                      className="cp-drawer-btn cp-drawer-btn--secondary"
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={deleting}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="cp-drawer-btn cp-drawer-btn--danger"
                      onClick={async () => {
                        setDeleting(true);
                        try {
                          await onDeleteClient();
                          setShowDeleteConfirm(false);
                          onClose();
                        } catch (e) {
                          console.error(e);
                        } finally {
                          setDeleting(false);
                        }
                      }}
                      disabled={deleting}
                    >
                      {deleting ? "Deleting…" : "Delete permanently"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default ClientDetailsDrawer;

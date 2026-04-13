import React, { useState, useRef, useEffect } from "react";
import "./ClientsPlansTable.css";

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

function PlanBadge({ plan }) {
  if (!plan) return <span className="cp-badge cp-badge--muted">—</span>;
  const isEnterprise = (plan || "").toLowerCase().includes("enterprise");
  const isTrial = (plan || "").toLowerCase().includes("trial");
  const cn = isEnterprise ? "cp-badge cp-badge--enterprise" : isTrial ? "cp-badge cp-badge--trial" : "cp-badge cp-badge--business";
  return <span className={cn}>{plan}</span>;
}

function StatusBadge({ status }) {
  if (!status) return <span className="cp-badge cp-badge--muted">Inactive</span>;
  const s = (status || "").toLowerCase();
  const cn =
    s === "active" ? "cp-badge cp-badge--active" :
    s === "trial" ? "cp-badge cp-badge--trial" :
    "cp-badge cp-badge--muted";
  return <span className={cn}>{status}</span>;
}

function formatRenewal(dateStr) {
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

function ClientsPlansTable({
  clients,
  loading,
  onRowClick,
  onActionsClick,
  actionMenuClientId,
  onCloseActionMenu,
}) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onCloseActionMenu?.();
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [onCloseActionMenu]);

  if (loading) {
    return (
      <div className="cp-table-card">
        <div className="cp-table-loading">Loading clients…</div>
      </div>
    );
  }

  return (
    <div className="cp-table-card">
      <div className="cp-table-wrap">
        <table className="cp-table">
          <thead>
            <tr>
              <th>Client Name</th>
              <th>Subscription Plan</th>
              <th>Status</th>
              <th>API Usage</th>
              <th>Billing Cycle</th>
              <th>Client Users</th>
              <th className="cp-table-actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!clients || clients.length === 0 ? (
              <tr>
                <td colSpan={7} className="cp-table-empty">
                  No clients found.
                </td>
              </tr>
            ) : (
              clients.map((row) => {
                const usagePct = row.api_quota ? Math.min(100, Math.round((row.api_calls_this_month / row.api_quota) * 100)) : 0;
                const displayPct = row.api_quota ? usagePct : (row.api_calls_this_month > 0 ? 5 : 0);
                return (
                  <tr
                    key={row.id}
                    className="cp-table-row"
                    onClick={() => onRowClick?.(row)}
                  >
                    <td>
                      <div className="cp-table-client">
                        <div className="cp-table-avatar">
                          {getInitials(row.name, row.company_name)}
                        </div>
                        <div>
                          <div className="cp-table-client-name">{row.name || "—"}</div>
                          <div className="cp-table-client-id">ID: {row.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <PlanBadge plan={row.subscription_plan} />
                    </td>
                    <td>
                      <StatusBadge status={row.subscription_status || (row.subscription_plan ? "Active" : null)} />
                    </td>
                    <td>
                      <div className="cp-table-usage">
                        <span>{row.api_calls_this_month?.toLocaleString() ?? 0} calls</span>
                        <div className="cp-progress">
                          <div
                            className="cp-progress-fill"
                            style={{ width: `${displayPct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="cp-table-billing">
                        <span>Monthly</span>
                        <span className="cp-table-muted">
                          Renewal: {formatRenewal(row.subscription_end_date)}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="cp-table-users">
                        <span className="cp-table-users-icon" aria-hidden>👤</span>
                        {row.user_count ?? 0}
                      </span>
                    </td>
                    <td className="cp-table-actions-col" onClick={(e) => e.stopPropagation()}>
                      <div className="cp-table-actions-wrap" ref={actionMenuClientId === row.id ? menuRef : null}>
                        <button
                          type="button"
                          className="cp-table-actions-btn"
                          aria-label="Actions"
                          onClick={(e) => {
                            e.stopPropagation();
                            onActionsClick?.(row);
                          }}
                        >
                          ⋮
                        </button>
                        {actionMenuClientId === row.id && (
                          <div className="cp-table-actions-menu">
                            <button type="button" onClick={() => onRowClick?.(row)}>
                              View details
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ClientsPlansTable;

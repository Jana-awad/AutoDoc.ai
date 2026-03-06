import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import {
  changeEnterprisePlan,
  clearEnterpriseBillingHistory,
  fetchEnterpriseBilling,
  fetchEnterpriseBillingHistory,
  fetchEnterpriseInvoices,
} from "../../../services/enterpriseProfileApi";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  formatText,
  pickValue,
} from "../../../utils/profileFormatters";

const formatAmount = (amount, currency) => {
  if (amount === null || amount === undefined) return "—";
  if (currency) return formatCurrency(amount, currency);
  return formatNumber(amount);
};

const EBilling = () => {
  const { token } = useAuth();
  const [billing, setBilling] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [changingPlanId, setChangingPlanId] = useState(null);
  const [clearingHistory, setClearingHistory] = useState(false);

  const fetchData = useCallback(
    async (signal) => {
      setLoading(true);
      setError(null);
      try {
        const [billingData, invoiceData, historyData] = await Promise.all([
          fetchEnterpriseBilling({ token, signal }),
          fetchEnterpriseInvoices({ token, signal }),
          fetchEnterpriseBillingHistory({ token, signal }),
        ]);
        setBilling(billingData || null);
        setInvoices(Array.isArray(invoiceData) ? invoiceData : invoiceData?.invoices || []);
        setHistory(Array.isArray(historyData) ? historyData : historyData?.history || []);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Unable to load billing data.");
        }
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

  const handleClearHistory = async () => {
    if (!window.confirm("Clear all billing history? This cannot be undone.")) return;
    setClearingHistory(true);
    setError(null);
    try {
      await clearEnterpriseBillingHistory({ token });
      fetchData();
    } catch (err) {
      setError(err.message || "Unable to clear history.");
    } finally {
      setClearingHistory(false);
    }
  };

  const handleChangePlan = async (planId) => {
    if (!planId) return;
    if (!window.confirm("Switch to this plan?")) return;
    setChangingPlanId(planId);
    setError(null);
    try {
      await changeEnterprisePlan({ token, planId });
      fetchData();
    } catch (err) {
      setError(err.message || "Unable to change plan.");
    } finally {
      setChangingPlanId(null);
    }
  };

  const plans = useMemo(() => {
    if (!Array.isArray(billing?.availablePlans)) return [];
    return billing.availablePlans.map((plan) => ({
      id: pickValue(plan.id, plan.planId, plan.code),
      name: formatText(pickValue(plan.name, plan.title)),
      description: plan.description || plan.subtitle || "",
      price: plan.price ?? plan.amount,
      currency: plan.currency,
      interval: plan.interval || plan.billingCycle,
      isCurrent:
        plan.isCurrent || (billing?.planId && (plan.id === billing.planId || plan.planId === billing.planId)),
    }));
  }, [billing]);

  if (loading) {
    return (
      <div>
        <div className="b-page-header">
          <div className="b-skeleton" style={{ width: 140, height: 32, marginBottom: 8 }} />
          <div className="b-skeleton" style={{ width: 300, height: 16 }} />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="b-glass-section">
            <div className="b-skeleton" style={{ width: "100%", height: 80 }} />
          </div>
        ))}
      </div>
    );
  }

  const planName = formatText(pickValue(billing?.planName, billing?.plan, billing?.currentPlan?.name));
  const planPrice = pickValue(billing?.price, billing?.amount, billing?.currentPlan?.price);
  const planCurrency = pickValue(billing?.currency, billing?.currentPlan?.currency);
  const billingCycle = formatText(pickValue(billing?.billingCycle, billing?.interval, billing?.currentPlan?.interval));
  const planStatus = formatText(pickValue(billing?.status, billing?.planStatus));
  const paymentMethod = billing?.paymentMethod || billing?.payment || null;
  const paymentBrand = formatText(pickValue(paymentMethod?.brand, paymentMethod?.cardBrand, billing?.cardBrand));
  const paymentLast4 = formatText(pickValue(paymentMethod?.last4, paymentMethod?.cardLast4));
  const paymentExpiry = formatText(pickValue(paymentMethod?.expiry, paymentMethod?.cardExpiry));
  const hasPayment = paymentBrand !== "—" || paymentLast4 !== "—";

  return (
    <div>
      <div className="b-page-header">
        <h1>Billing</h1>
        <p>Manage your subscription, payment methods, and download invoices.</p>
      </div>

      {error && (
        <div className="b-glass-section" style={{ borderColor: "rgba(220,38,38,0.3)", marginBottom: "var(--space-4)" }}>
          <p style={{ color: "#dc2626", fontSize: "var(--font-size-sm)" }}>⚠ {error}</p>
        </div>
      )}

      <div className="b-glass-section">
        <h2>Current Plan</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: "var(--font-size-2xl)", fontWeight: 700, color: "var(--color-navy-deep)" }}>
              {planName}
            </div>
            <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-gray-500)", marginTop: 4 }}>
              {planPrice !== null && planPrice !== undefined
                ? `${formatAmount(planPrice, planCurrency)}${billingCycle !== "—" ? ` · Billed ${billingCycle}` : ""}`
                : "—"}
            </div>
          </div>
          {planStatus !== "—" && (
            <span className={`b-badge ${planStatus.toLowerCase() === "active" ? "b-badge-active" : "b-badge-inactive"}`} style={{ marginLeft: "auto" }}>
              {planStatus}
            </span>
          )}
        </div>
        <div className="b-stat-row" style={{ marginTop: "var(--space-5)" }}>
          <div className="b-stat-card">
            <div className="b-stat-value">{formatNumber(billing?.documentsUsed)}</div>
            <div className="b-stat-label">Docs Used</div>
          </div>
          <div className="b-stat-card">
            <div className="b-stat-value">{formatNumber(billing?.documentsLimit)}</div>
            <div className="b-stat-label">Docs Limit</div>
          </div>
          <div className="b-stat-card">
            <div className="b-stat-value">{formatNumber(billing?.apiCallsUsed)}</div>
            <div className="b-stat-label">API Calls Used</div>
          </div>
          <div className="b-stat-card">
            <div className="b-stat-value">{formatDate(billing?.nextBillingDate)}</div>
            <div className="b-stat-label">Next Billing</div>
          </div>
        </div>
      </div>

      <div className="b-glass-section">
        <h2>Change Plan</h2>
        {plans.length === 0 ? (
          <p style={{ color: "var(--color-gray-500)", textAlign: "center", padding: "var(--space-6)" }}>
            No plan options available yet.
          </p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--space-4)" }}>
            {plans.map((plan) => (
              <div key={plan.id || plan.name} className="b-stat-card" style={{ textAlign: "left", padding: "var(--space-5)" }}>
                <div style={{ fontWeight: 700, fontSize: "var(--font-size-lg)", marginBottom: 4 }}>{plan.name}</div>
                {plan.description && (
                  <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-gray-500)", marginBottom: "var(--space-3)" }}>
                    {plan.description}
                  </div>
                )}
                {plan.price != null && (
                  <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-gray-500)", marginBottom: "var(--space-3)" }}>
                    {formatAmount(plan.price, plan.currency)}
                    {plan.interval ? ` · ${plan.interval}` : ""}
                  </div>
                )}
                <button
                  className={plan.isCurrent ? "btn btn-secondary" : "btn btn-primary"}
                  onClick={() => handleChangePlan(plan.id)}
                  disabled={plan.isCurrent || changingPlanId === plan.id}
                  style={{ fontSize: "var(--font-size-sm)", width: "100%" }}
                >
                  {plan.isCurrent ? "Current Plan" : changingPlanId === plan.id ? "Switching…" : "Switch Plan"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="b-glass-section">
        <h2>Payment Method</h2>
        {hasPayment ? (
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginTop: "var(--space-3)" }}>
            <div style={{ width: 48, height: 32, borderRadius: 6, background: "var(--gradient-button)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 11, fontWeight: 700 }}>
              {paymentBrand}
            </div>
            <div>
              <div style={{ fontSize: "var(--font-size-sm)", fontWeight: 600 }}>{paymentLast4 !== "—" ? `•••• •••• •••• ${paymentLast4}` : "—"}</div>
              <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-gray-500)" }}>{paymentExpiry !== "—" ? `Expires ${paymentExpiry}` : "—"}</div>
            </div>
          </div>
        ) : (
          <p style={{ color: "var(--color-gray-500)", textAlign: "center", padding: "var(--space-4)" }}>No payment method on file.</p>
        )}
      </div>

      <div className="b-glass-section">
        <h2>Invoice History</h2>
        {invoices.length === 0 ? (
          <p style={{ color: "var(--color-gray-500)", textAlign: "center", padding: "var(--space-6)" }}>No invoices yet.</p>
        ) : (
          <div className="b-table-wrap">
            <table className="b-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const downloadUrl = inv.downloadUrl || inv.url;
                  const status = formatText(inv.status);
                  return (
                    <tr key={inv.id || inv.number}>
                      <td style={{ fontWeight: 600 }}>{formatText(inv.number || inv.id)}</td>
                      <td>{formatDate(inv.date)}</td>
                      <td>{formatAmount(inv.amount, inv.currency || planCurrency)}</td>
                      <td>
                        <span className={`b-badge ${status.toLowerCase() === "paid" ? "b-badge-active" : "b-badge-inactive"}`}>{status}</span>
                      </td>
                      <td>
                        {downloadUrl ? (
                          <a className="b-action-btn b-action-btn-edit" href={downloadUrl} target="_blank" rel="noreferrer">Download</a>
                        ) : (
                          <button className="b-action-btn b-action-btn-edit" disabled>Download</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="b-glass-section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
          <h2>Billing History</h2>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleClearHistory}
            disabled={history.length === 0 || clearingHistory}
            style={{ fontSize: "var(--font-size-sm)" }}
          >
            {clearingHistory ? "Clearing…" : "Clear History"}
          </button>
        </div>
        {history.length === 0 ? (
          <p style={{ color: "var(--color-gray-500)", textAlign: "center", padding: "var(--space-6)" }}>No billing activity yet.</p>
        ) : (
          <div className="b-table-wrap">
            <table className="b-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry) => {
                  const status = formatText(entry.status);
                  return (
                    <tr key={entry.id || `${entry.type}-${entry.date}`}>
                      <td style={{ fontWeight: 600 }}>{formatText(entry.description)}</td>
                      <td>{formatDate(entry.date)}</td>
                      <td>{formatAmount(entry.amount, entry.currency || planCurrency)}</td>
                      <td>
                        <span className={`b-badge ${status.toLowerCase() === "paid" || status.toLowerCase() === "active" ? "b-badge-active" : "b-badge-inactive"}`}>{status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EBilling;

import React from "react";
import "./ClientsPlansStatsCards.css";

const formatMRR = (cents) => {
  if (cents == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
};

const cardsConfig = [
  {
    key: "total_clients",
    title: "Total Clients",
    description: "Active organizations using the platform",
    valueKey: "total_clients",
    format: (v) => (v != null ? v.toLocaleString() : "—"),
    icon: "users",
  },
  {
    key: "active_subscriptions",
    title: "Active Subscriptions",
    description: "Business + Enterprise plans",
    valueKey: "active_subscriptions",
    format: (v) => (v != null ? v.toLocaleString() : "—"),
    icon: "subscription",
  },
  {
    key: "mrr",
    title: "Monthly Recurring Revenue",
    description: "Across all subscription plans",
    valueKey: "monthly_recurring_revenue_cents",
    format: (v) => formatMRR(v),
    icon: "revenue",
  },
  {
    key: "accounts_by_plan",
    title: "Accounts by Plan",
    description: "Business vs Enterprise",
    icon: "accounts",
    twoValues: true,
    valueKeyA: "business_accounts",
    valueKeyB: "enterprise_accounts",
    labelA: "Business",
    labelB: "Enterprise",
  },
];

function ClientsPlansStatsCards({ data, loading }) {
  return (
    <div className="cp-stats-row">
      {cardsConfig.map((config) => {
        if (config.twoValues) {
          const valueA = data ? data[config.valueKeyA] : null;
          const valueB = data ? data[config.valueKeyB] : null;
          return (
            <div key={config.key} className="cp-stat-card">
              <div className="cp-stat-card__icon-wrap">
                <span className={`cp-stat-card__icon cp-stat-card__icon--${config.icon}`} aria-hidden />
              </div>
              <div className="cp-stat-card__growth">+0%</div>
              <div className="cp-stat-card__content">
                <div className="cp-stat-card__title">{config.title}</div>
                <div className="cp-stat-card__twovalues">
                  <span className="cp-stat-card__value-line">
                    {loading ? "—" : (valueA != null ? valueA.toLocaleString() : "—")}{" "}
                    <span className="cp-stat-card__value-label">{config.labelA}</span>
                  </span>
                  <span className="cp-stat-card__value-line">
                    {loading ? "—" : (valueB != null ? valueB.toLocaleString() : "—")}{" "}
                    <span className="cp-stat-card__value-label">{config.labelB}</span>
                  </span>
                </div>
                <div className="cp-stat-card__desc">{config.description}</div>
              </div>
            </div>
          );
        }
        const value = data ? data[config.valueKey] : null;
        return (
          <div key={config.key} className="cp-stat-card">
            <div className="cp-stat-card__icon-wrap">
              <span className={`cp-stat-card__icon cp-stat-card__icon--${config.icon}`} aria-hidden />
            </div>
            <div className="cp-stat-card__growth">+0%</div>
            <div className="cp-stat-card__content">
              <div className="cp-stat-card__title">{config.title}</div>
              <div className="cp-stat-card__value">
                {loading ? "—" : config.format(value)}
              </div>
              <div className="cp-stat-card__desc">{config.description}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ClientsPlansStatsCards;

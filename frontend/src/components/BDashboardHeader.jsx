import { useMemo, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchBusinessAccountInfo } from "../services/businessDashboardApi";

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

function BDashboardHeader({ refreshKey, onRefresh, isRefreshing }) {
  const { token } = useAuth();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    let isActive = true;

    const loadAccount = async () => {
      setLoading(true);
      try {
        const data = await fetchBusinessAccountInfo({ token, signal: controller.signal });
        if (isActive) setAccount(data);
      } catch (error) {
        if (isActive) setAccount(null);
      } finally {
        if (isActive) setLoading(false);
      }
    };

    loadAccount();
    return () => {
      isActive = false;
      controller.abort();
    };
  }, [token, refreshKey]);

  const displayName =
    account?.name || account?.email || "";
  const greeting = useMemo(() => getGreeting(), []);
  const dateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(new Date()),
    []
  );

  return (
    <header className="bdashboard-hero">
      <div className="bdashboard-hero__top">
        <div>
          <p className="bdashboard-hero__title">Business Dashboard</p>
          <p className="bdashboard-hero__subtitle">
            Monitor document throughput, automation health, and team activity in real time.
          </p>
        </div>
        <button
          type="button"
          className={`bdashboard-hero__refresh btn btn-glass ${isRefreshing ? "is-loading" : ""}`}
          onClick={onRefresh}
          aria-busy={isRefreshing}
        >
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="bdashboard-hero__welcome glass-card">
        <div className="bdashboard-hero__greeting">
          <span className="bdashboard-hero__greeting-label">{greeting}, </span>
          {loading ? (
            <span className="bdashboard-hero__greeting-name bdashboard-skeleton-line" />
          ) : (
            <span className="bdashboard-hero__greeting-name">{displayName || "Guest"}</span>
          )}
        </div>
        <div className="bdashboard-hero__meta">
          <span className="bdashboard-hero__date">{dateLabel}</span>
          <div className="bdashboard-hero__tags">
            <span className="bdashboard-pill">Business</span>
            {account?.planName && <span className="bdashboard-pill bdashboard-pill--solid">{account.planName}</span>}
          </div>
        </div>
      </div>
    </header>
  );
}

export default BDashboardHeader;

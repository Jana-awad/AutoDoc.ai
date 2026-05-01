import { Link } from "react-router-dom";
import "./KPICards.css";

const isAllZero = (kpis) =>
  kpis &&
  Number(kpis.total_documents_processed || 0) === 0 &&
  Number(kpis.successful_requests || 0) === 0 &&
  Number(kpis.failed_requests || 0) === 0;

function KPICards({ kpis, loading, error, onRetry }) {
  if (error) {
    return (
      <section className="user-kpi" aria-label="Dashboard KPIs">
        <div className="user-kpi__error" role="alert">
          <p className="user-kpi__error-text">{error}</p>
          {onRetry ? (
            <button type="button" className="user-kpi__retry" onClick={onRetry}>
              Retry
            </button>
          ) : null}
        </div>
      </section>
    );
  }

  if (loading || !kpis) {
    return (
      <section className="user-kpi" aria-label="Dashboard KPIs" aria-busy="true">
        <div className="user-kpi__grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="user-kpi__skeleton" />
          ))}
        </div>
      </section>
    );
  }

  if (isAllZero(kpis)) {
    return (
      <section className="user-kpi" aria-label="Dashboard KPIs">
        <div className="user-kpi__empty">
          <h3 className="user-kpi__empty-title">No metrics yet</h3>
          <p className="user-kpi__empty-text">
            Once you process your first document, performance metrics will populate here.
          </p>
          <Link className="user-kpi__empty-cta" to="/user/documents">
            Process a document
          </Link>
        </div>
      </section>
    );
  }

  const items = [
    { label: "Total documents processed", value: kpis.total_documents_processed },
    { label: "Successful requests", value: kpis.successful_requests },
    { label: "Failed requests", value: kpis.failed_requests },
    {
      label: "Avg. processing time",
      value: `${kpis.average_processing_time_seconds} s`,
    },
  ];

  return (
    <section className="user-kpi" aria-label="Dashboard KPIs">
      <div className="user-kpi__grid">
        {items.map((item) => (
          <article key={item.label} className="user-kpi__card">
            <h3 className="user-kpi__label">{item.label}</h3>
            <p className="user-kpi__value">{item.value}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default KPICards;

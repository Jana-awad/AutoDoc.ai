import "./KPICards.css";

function KPICards({ kpis, loading, error }) {
  if (error) {
    return (
      <section className="user-kpi" aria-label="Dashboard KPIs">
        <p className="user-kpi__error" role="alert">
          {error}
        </p>
      </section>
    );
  }

  if (loading || !kpis) {
    return (
      <section className="user-kpi" aria-label="Dashboard KPIs">
        <div className="user-kpi__grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="user-kpi__skeleton" />
          ))}
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

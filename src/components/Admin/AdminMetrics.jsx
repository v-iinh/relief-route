function deltaClassName(delta) {
  if (typeof delta !== 'string') return 'd-neutral';
  if (delta.startsWith('+')) return 'd-up';
  if (delta.startsWith('-')) return 'd-down';
  return 'd-neutral';
}

export default function AdminMetrics({ metrics = [], period = 'alltime', onPeriodChange }) {
  const isMonth = period === 'month';

  return (
    <section className="admin-section">
      <div className="metrics-header">
        <div>
          <div className="metrics-title">Key Metrics</div>
          <div className="metrics-sub">Platform activity snapshot</div>
        </div>

        <div className="period-toggle" role="tablist" aria-label="Metrics period">
          <button
            type="button"
            className={`period-btn ${!isMonth ? 'active' : ''}`}
            onClick={() => onPeriodChange?.('alltime')}
          >
            All Time
          </button>
          <button
            type="button"
            className={`period-btn ${isMonth ? 'active' : ''}`}
            onClick={() => onPeriodChange?.('month')}
          >
            This Month
          </button>
        </div>
      </div>

      <div className="stats-grid">
        {metrics.map((metric) => (
          <article key={metric.label} className="stat-card">
            <div className="stat-label">{metric.label}</div>
            <div className="stat-value">{metric.value}</div>
            <div className="stat-delta">
              <span className={deltaClassName(metric.delta)}>{metric.delta}</span>
              <span className="stat-context">{metric.context}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

const statusClass = s =>
  s === 'closed' ? 's-closed' : s === 'open' ? 's-open' : 's-unknown';

const statusLabel = s =>
  s === 'closed' ? 'Closed' : s === 'open' ? 'Open' : 'Unknown';

export default function ResultCard({ loc, isActive, onClick }) {
  if (!loc) return null;

  return (
    <div
      className={`result-card${isActive ? ' active' : ''}`}
      onClick={onClick}
      data-id={loc.id}
    >
      <div className="card-top">
        <div className="card-name">{loc.name}</div>
        <span className={`card-status ${statusClass(loc.status)}`}>
          {statusLabel(loc.status)}
        </span>
      </div>
      <div className="card-meta">
        <span className="card-dist">◎ {loc.dist} mi</span>
      </div>
    </div>
  );
}

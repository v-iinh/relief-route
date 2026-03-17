import DetailContent from '../common/DetailContent';

export default function DetailPanel({ loc, isOpen, onBack, onToast }) {
  return (
    <div className={`detail-panel${isOpen ? ' open' : ''}`}>
      <div className="detail-head">
        <button className="back-btn" onClick={onBack} aria-label="Back to results">
          <svg className="back-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <span className="detail-head-label">Location details</span>
      </div>
      {loc && <DetailContent loc={loc} onToast={onToast} />}
    </div>
  );
}

import { useState } from 'react';
import ResultCard from '../Sidebar/ResultCard';
import DetailContent from '../common/DetailContent';

export default function Drawer({
  isOpen,
  locations = [],
  activeId,
  activeLocation,
  onSelect,
  onClearSelect,
  onToast,
  onSearch,
  searchLoading,
}) {
  const [inputVal, setInputVal] = useState('');
  const [sort, setSort] = useState('dist');

  const sorted = [...locations].sort((a, b) =>
    sort === 'name' ? a.name.localeCompare(b.name) : a.dist - b.dist
  );

  return (
    <div className={`drawer${isOpen ? ' open' : ''}`}>
      <div className="drawer-handle">
        <div className="drawer-handle-bar" />
      </div>

      <div className="drawer-head">
        <div className="drawer-search-row">
          <div className="drawer-search-wrap search-wrap" style={{ marginBottom: 0 }}>
            <span className="search-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" />
                <line x1="16.65" y1="16.65" x2="21" y2="21" />
              </svg>
            </span>
            <input
              className="search-input"
              type="text"
              placeholder="Search for Food Pantries by Address"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && inputVal.trim() && onSearch) {
                  onSearch(inputVal.trim());
                  setInputVal('');
                }
              }}
              style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem 0.5rem 1.9rem' }}
            />
          </div>
        </div>
      </div>

      {searchLoading && (
        <div style={{ fontSize: '0.66rem', color: 'var(--ink-muted)', padding: '0 1rem 0.4rem' }}>
          Searching nearby food pantries...
        </div>
      )}

      <div className="drawer-meta">
        <span>
          {sorted.length} location{sorted.length !== 1 ? 's' : ''}
        </span>
        <button
          className="sort-btn"
          onClick={() => setSort(s => (s === 'name' ? 'dist' : 'name'))}
        >
          Sort: {sort === 'name' ? 'A–Z ↕' : 'Nearest ↕'}
        </button>
      </div>

      <div className="drawer-list">
        {sorted.length ? (
          sorted.map(loc => (
            <ResultCard
              key={loc.id}
              loc={loc}
              isActive={activeId === loc.id}
              onClick={() => onSelect(loc.id)}
            />
          ))
        ) : (
          <div className="empty-state">
            Food pantries will appear here when you search for an address. Try searching for your city, neighborhood, or a nearby landmark to find food pantries in your area.
          </div>
        )}
      </div>

      {/* Mobile detail slide-in inside the drawer */}
      <div className={`drawer-detail${activeLocation ? ' open' : ''}`}>
        <div className="detail-head">
          <button className="back-btn" onClick={onClearSelect} aria-label="Back to results">
            <svg className="back-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <span className="detail-head-label">Location details</span>
        </div>
        {activeLocation && <DetailContent loc={activeLocation} onToast={onToast} />}
      </div>
    </div>
  );
}

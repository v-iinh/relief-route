import { useState } from 'react';
import ResultCard from './ResultCard';
import DetailPanel from './DetailPanel';
import logo from '../../assets/logo.png';

export default function Sidebar({
  locations = [],
  activeId,
  onSelect,
  onClearSelect,
  onOpenModal,
  onToast,
  onSearch,
  searchLoading,
}) {
  const [inputVal, setInputVal] = useState('');
  const [sort, setSort] = useState('dist');

  const sorted = [...locations].sort((a, b) =>
    sort === 'name' ? a.name.localeCompare(b.name) : a.dist - b.dist
  );
  const activeLocation = locations.find(l => l.id === activeId);

  function handleSelect(id) {
    onSelect(id);
    const card = document.querySelector(`#results-list .result-card[data-id="${id}"]`);
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  return (
    <div className="sidebar">
      <div className="sidebar-head">
        <div className="logo-row">
          <div className="logo">
            <img className="logo-image" src={logo} alt="Relief Route logo" />
            Relief Route
          </div>
          <button className="add-btn" onClick={onOpenModal}>
            + Add Location
          </button>
        </div>

        <div className="search-wrap">
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
          />
        </div>

        {searchLoading && (
          <div style={{ fontSize: '0.66rem', color: 'var(--ink-muted)', marginBottom: '0.5rem' }}>
            Searching nearby food pantries...
          </div>
        )}


      </div>

      <div className="results-meta">
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

      <div className="results-list" id="results-list">
        {sorted.length ? (
          sorted.map(loc => (
            <ResultCard
              key={loc.id}
              loc={loc}
              isActive={activeId === loc.id}
              onClick={() => handleSelect(loc.id)}
            />
          ))
        ) : (
          <div className="empty-state">
            Food pantries will appear here when you search for an address. Try searching for your city, neighborhood, or a nearby landmark to find food pantries in your area.
          </div>
        )}
      </div>

      <DetailPanel
        loc={activeLocation}
        isOpen={activeId !== null}
        onBack={onClearSelect}
        onToast={onToast}
      />
    </div>
  );
}

import { useState } from 'react';

export default function SearchBox({ onSearch, loading, error }) {
  const [query, setQuery] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
      setQuery('');
    }
  }

  return (
    <div className="search-box">
      <form onSubmit={handleSubmit}>
        <div className="search-input-group">
          <input
            type="text"
            placeholder="Search food banks, community centers..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            disabled={loading}
          />
          <button type="submit" disabled={loading} className="search-btn">
            {loading ? '⏳' : '🔍'}
          </button>
        </div>
      </form>
      {error && <div className="search-error">{error}</div>}
    </div>
  );
}

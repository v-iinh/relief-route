const FILTERS = [
  { key: 'pantry', label: 'Public' },
  { key: 'community', label: 'Community Listings' },
];

export default function FilterChips({ active, onChange, wrapperClass = 'filter-row' }) {
  return (
    <div className={wrapperClass}>
      {FILTERS.map(f => (
        <button
          key={f.key}
          className={`filter-chip${active === f.key ? ' active' : ''}`}
          onClick={() => onChange(f.key)}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}

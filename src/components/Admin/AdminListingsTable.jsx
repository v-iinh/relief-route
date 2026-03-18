function statusClassName(status) {
  if (status === 'open') return 'p-open';
  if (status === 'limited') return 'p-limited';
  return 'p-closed';
}

function statusLabel(status) {
  if (status === 'open') return 'Open';
  if (status === 'limited') return 'Limited';
  return 'Closed';
}

function typeClassName(type) {
  return type === 'Community' ? 'p-community' : 'p-pantry';
}

export default function AdminListingsTable({
  activeTab,
  onTabChange,
  currentCount,
  pendingCount,
  searchValue,
  onSearchChange,
  rows = [],
  onView,
  onEdit,
  onRemove,
}) {
  const isPending = activeTab === 'pending';

  return (
    <section className="admin-section">
      <div className="listings-header">
        <div>
          <div className="listings-title">Listings</div>
          <div className="listings-sub">
            {isPending ? 'Review pending submissions' : 'Manage active map locations'}
          </div>
        </div>

        <div className="listings-controls">
          <div className="listing-tabs">
            <button
              type="button"
              className={`listing-tab ${!isPending ? 'active' : ''}`}
              onClick={() => onTabChange('current')}
            >
              Current <span className="tab-badge">{currentCount}</span>
            </button>
            <button
              type="button"
              className={`listing-tab ${isPending ? 'active' : ''}`}
              onClick={() => onTabChange('pending')}
            >
              Pending <span className="tab-badge">{pendingCount}</span>
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
              placeholder="Search listings"
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="table-card">
        <table className="dt">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              {isPending ? <th>Submitted</th> : <th>Status</th>}
              {isPending ? <th>Submitter</th> : <th>Distance</th>}
              {!isPending && <th>Updated</th>}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr className="empty-row">
                <td colSpan={isPending ? 5 : 6}>No matching listings.</td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className="td-name">{row.name}</div>
                    <div className="td-sub">{row.address}</div>
                  </td>
                  <td>
                    <span className={`pill ${typeClassName(row.type)}`}>{row.type}</span>
                  </td>
                  {isPending ? (
                    <td className="td-dim">{row.submitted}</td>
                  ) : (
                    <td>
                      <span className={`pill ${statusClassName(row.status)}`}>{statusLabel(row.status)}</span>
                    </td>
                  )}
                  <td className="td-dim">{isPending ? row.submitter : row.distance}</td>
                  {!isPending && <td className="td-dim">{row.updated}</td>}
                  <td>
                    <div className="actions">
                      <button className="abtn" type="button" onClick={() => onView(row)}>
                        View
                      </button>
                      {isPending ? (
                        <button className="abtn" type="button" onClick={() => onEdit(row)}>
                          Approve
                        </button>
                      ) : (
                        <button className="abtn" type="button" onClick={() => onEdit(row)}>
                          Edit
                        </button>
                      )}
                      <button className="abtn danger" type="button" onClick={() => onRemove(row.id)}>
                        {isPending ? 'Reject' : 'Remove'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

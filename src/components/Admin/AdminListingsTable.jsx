import { useState } from 'react';
import HoursBuilder, { initHours } from '../Modal/HoursBuilder';
import { FULL_DAYS } from '../../data/constants';

export default function AdminListingsTable({
  activeTab,
  onTabChange,
  currentCount,
  pendingCount,
  searchValue,
  onSearchChange,
  rows = [],
  totalRows = 0,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  onEdit,
  onRemove,
}) {
  const isPending = activeTab === 'pending';
  const [readerRow, setReaderRow] = useState(null);

  function toHoursSlot(value) {
    const text = String(value || '').trim();

    if (!text || text === '—') {
      return { open: '', close: '', closed: false };
    }

    if (/closed/i.test(text)) {
      return { open: '', close: '', closed: true };
    }

    if (/open\s*24\s*(hours|h|\/7)/i.test(text)) {
      return { open: 'Open 24 hours', close: '', closed: false };
    }

    const normalized = text.replace(/[\u2013\u2014]/g, '-');
    const parts = normalized
      .split('-')
      .map(part => part.trim())
      .filter(Boolean);

    if (parts.length >= 2) {
      return { open: parts[0], close: parts.slice(1).join(' - '), closed: false };
    }

    return { open: text, close: '', closed: false };
  }

  function parseHoursSummary(summary) {
    const parsed = initHours();
    const text = String(summary || '').trim();
    if (!text || text === '—') return parsed;

    const segments = text
      .split('|')
      .map(segment => segment.trim())
      .filter(Boolean);

    segments.forEach((segment) => {
      const match = segment.match(/^([A-Za-z]{3})\s*:\s*(.+)$/);
      if (!match) return;

      const day = match[1];
      const value = match[2];
      if (!FULL_DAYS.includes(day)) return;

      parsed[day] = toHoursSlot(value);
    });

    return parsed;
  }

  function resolveReaderHours(row) {
    const fallback = parseHoursSummary(row?.hoursSummary);
    const rawHours = row?.hours;

    if (!rawHours || typeof rawHours !== 'object') {
      return fallback;
    }

    const resolved = initHours();
    let hasStructuredHours = false;

    FULL_DAYS.forEach((day) => {
      const rawDay = rawHours[day];

      if (rawDay && typeof rawDay === 'object') {
        resolved[day] = {
          open: typeof rawDay.open === 'string' ? rawDay.open : '',
          close: typeof rawDay.close === 'string' ? rawDay.close : '',
          closed: Boolean(rawDay.closed),
        };
        hasStructuredHours = true;
        return;
      }

      if (typeof rawDay === 'string') {
        resolved[day] = toHoursSlot(rawDay);
        hasStructuredHours = true;
      }
    });

    return hasStructuredHours ? resolved : fallback;
  }

  const pageStart = totalRows === 0 ? 0 : (currentPage - 1) * 10 + 1;
  const pageEnd = totalRows === 0 ? 0 : Math.min(currentPage * 10, totalRows);

  const pageNumbers = [];
  for (let page = 1; page <= totalPages; page += 1) {
    pageNumbers.push(page);
  }

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
              <th>Location</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr className="empty-row">
                <td colSpan={2}>No matching listings.</td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className="td-name">{row.name}</div>
                    <div className="td-sub">{row.address}</div>
                  </td>
                  <td>
                    <div className="actions">
                      {isPending && (
                        <button className="abtn" type="button" onClick={() => setReaderRow(row)}>
                          View
                        </button>
                      )}
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

      {totalRows > 10 && (
        <div className="listings-pagination" role="navigation" aria-label="Listings pages">
          <div className="listings-pagination-meta">
            Showing {pageStart}-{pageEnd} of {totalRows}
          </div>

          <div className="listings-pagination-controls">
            <button
              type="button"
              className="pagination-btn"
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              Prev
            </button>

            {pageNumbers.map((page) => (
              <button
                key={page}
                type="button"
                className={`pagination-btn ${page === currentPage ? 'active' : ''}`}
                onClick={() => onPageChange?.(page)}
                aria-current={page === currentPage ? 'page' : undefined}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              className="pagination-btn"
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {readerRow && (
        <div
          className="modal-overlay open"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setReaderRow(null);
            }
          }}
        >
          <div className="modal">
            <div className="modal-head">
              <div className="modal-title">Listing Details</div>
              <button className="modal-close" onClick={() => setReaderRow(null)}>
                ✕
              </button>
            </div>

            <div className="modal-body admin-view-form">
              <div className="mf">
                <label>Location name</label>
                <input type="text" value={readerRow.name || '—'} readOnly />
              </div>

              <div className="mf">
                <label>Address</label>
                <input type="text" value={readerRow.address || '—'} readOnly />
              </div>

              <div className="mf-row">
                <div className="mf">
                  <label>Phone</label>
                  <input type="text" value={readerRow.phone || '—'} readOnly />
                </div>
                <div className="mf">
                  <label>Website</label>
                  <input type="text" value={readerRow.website || '—'} readOnly />
                </div>
              </div>

              <div className="mf">
                <label>Hours</label>
                <HoursBuilder value={resolveReaderHours(readerRow)} readOnly />
              </div>

              <div className="mf">
                <label>Notes</label>
                <textarea value={readerRow.notes || '—'} readOnly />
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

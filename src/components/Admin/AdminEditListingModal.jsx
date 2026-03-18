import { useEffect, useState } from 'react';
import HoursBuilder, { getHoursValue, initHours } from '../Modal/HoursBuilder';
import { FULL_DAYS } from '../../data/constants';

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

  const parts = text
    .replace(/[\u2013\u2014]/g, '-')
    .split('-')
    .map((part) => part.trim())
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
    .map((segment) => segment.trim())
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

function resolveDraftHours(listing) {
  const fallback = parseHoursSummary(listing?.hoursSummary);
  const rawHours = listing?.hours;

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

function initialDraft(listing) {
  return {
    name: listing?.name || '',
    address: listing?.address || '',
    phone: listing?.phone || '',
    website: listing?.website || '',
    hours: resolveDraftHours(listing),
    notes: listing?.notes || '',
  };
}

export default function AdminEditListingModal({ isOpen, listing, onClose, onSave, saving }) {
  const [draft, setDraft] = useState(initialDraft(listing));

  useEffect(() => {
    setDraft(initialDraft(listing));
  }, [listing]);

  if (!isOpen || !listing) {
    return null;
  }

  function setField(field, value) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  function handleSave() {
    if (!draft.name.trim() || !draft.address.trim()) {
      return;
    }

    const hoursMap = getHoursValue(draft.hours);
    const hasHours = Object.values(hoursMap).some((value) => value && value !== '—');
    const hoursSummary = hasHours
      ? Object.entries(hoursMap)
        .map(([day, value]) => `${day}: ${value}`)
        .join(' | ')
      : '—';

    onSave({
      ...draft,
      name: draft.name.trim(),
      address: draft.address.trim(),
      phone: draft.phone.trim(),
      website: draft.website.trim(),
      hoursSummary,
      notes: draft.notes.trim(),
    });
  }

  return (
    <div
      className="modal-overlay open"
      onClick={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose();
        }
      }}
    >
      <div className="modal">
        <div className="modal-head">
          <div className="modal-title">Edit Listing</div>
          <button className="modal-close" onClick={onClose} disabled={saving}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="mf">
            <label>Location name *</label>
            <input
              type="text"
              value={draft.name}
              onChange={(event) => setField('name', event.target.value)}
              placeholder="Location name"
            />
          </div>

          <div className="mf">
            <label>Address *</label>
            <input
              type="text"
              value={draft.address}
              onChange={(event) => setField('address', event.target.value)}
              placeholder="Address"
            />
          </div>

          <div className="mf-row">
            <div className="mf">
              <label>Phone</label>
              <input
                type="text"
                value={draft.phone}
                onChange={(event) => setField('phone', event.target.value)}
                placeholder="(617) 555-0100"
              />
            </div>
            <div className="mf">
              <label>Website</label>
              <input
                type="text"
                value={draft.website}
                onChange={(event) => setField('website', event.target.value)}
                placeholder="https://example.org"
              />
            </div>
          </div>

          <div className="mf">
            <label>Hours</label>
            <HoursBuilder value={draft.hours} onChange={(value) => setField('hours', value)} />
          </div>

          <div className="mf">
            <label>Notes</label>
            <textarea
              value={draft.notes}
              onChange={(event) => setField('notes', event.target.value)}
              placeholder="Requirements, restrictions, or helpful details"
            />
          </div>

          <button className="m-submit" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

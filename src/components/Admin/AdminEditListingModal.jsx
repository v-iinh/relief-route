import { useEffect, useState } from 'react';

function initialDraft(listing) {
  return {
    name: listing?.name || '',
    address: listing?.address || '',
    phone: listing?.phone || '',
    website: listing?.website || '',
    hoursSummary: listing?.hoursSummary || '',
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

    onSave({
      ...draft,
      name: draft.name.trim(),
      address: draft.address.trim(),
      phone: draft.phone.trim(),
      website: draft.website.trim(),
      hoursSummary: draft.hoursSummary.trim(),
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
            <label>Hours summary</label>
            <input
              type="text"
              value={draft.hoursSummary}
              onChange={(event) => setField('hoursSummary', event.target.value)}
              placeholder="Mon-Fri 9:00 AM-5:00 PM"
            />
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

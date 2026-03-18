import { useState } from 'react';
import HoursBuilder, { initHours } from './HoursBuilder';

function initialFormState() {
  return {
    name: '',
    address: '',
    phone: '',
    website: '',
    notes: '',
    hours: initHours(),
  };
}

export default function AddLocationForm({ onClose, onToast }) {
  const [form, setForm] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function set(field) {
    return value => setForm(prev => ({ ...prev, [field]: value }));
  }

  function handleSubmit() {
    if (!form.name.trim() || !form.address.trim()) {
      onToast('Please fill in name and address');
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setForm(initialFormState());
        setSubmitted(false);
      }, 3000);
    }, 800);
  }

  if (submitted) {
    return (
      <div className="m-success">
        ✓ Thank you!
        <br />
        <br />
        <strong>{form.name}</strong> has been submitted for review and will
        appear on the map within 24 hours.
      </div>
    );
  }

  return (
    <>
      <div className="mf">
        <label>Location name *</label>
        <input
          type="text"
          value={form.name}
          onChange={e => set('name')(e.target.value)}
          placeholder="e.g. Oak Street Community Fridge"
        />
      </div>

      <div className="mf">
        <label>Address *</label>
        <input
          type="text"
          value={form.address}
          onChange={e => set('address')(e.target.value)}
          placeholder="123 Main St, Boston, MA 02101"
        />
      </div>

      <div className="mf-row">
        <div className="mf">
          <label>Phone</label>
          <input
            type="text"
            value={form.phone}
            onChange={e => set('phone')(e.target.value)}
            placeholder="(617) 555-0100"
          />
        </div>
        <div className="mf">
          <label>Website</label>
          <input
            type="text"
            value={form.website}
            onChange={e => set('website')(e.target.value)}
            placeholder="https://example.org"
          />
        </div>
      </div>

      <div className="mf">
        <label>Hours of operation</label>
        <HoursBuilder value={form.hours} onChange={set('hours')} />
      </div>

      <div className="mf">
        <label>Notes</label>
        <textarea
          value={form.notes}
          onChange={e => set('notes')(e.target.value)}
          placeholder="Requirements, restrictions, or helpful details…"
        />
      </div>

      <button
        className="m-submit"
        onClick={handleSubmit}
        disabled={submitting}
        style={submitting ? { opacity: 0.65 } : {}}
      >
        {submitting ? 'Submitting…' : 'Submit for review →'}
      </button>
    </>
  );
}

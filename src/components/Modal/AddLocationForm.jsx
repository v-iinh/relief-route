import { useState } from 'react';
import HoursBuilder, { getHoursValue, initHours } from './HoursBuilder';
import { createListingSubmission } from '../../firebase';

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

    const hoursMap = getHoursValue(form.hours);
    const hoursSummary = Object.values(hoursMap).some(value => value && value !== '—')
      ? hoursMap
      : null;

    createListingSubmission({
      name: form.name.trim(),
      address: form.address.trim(),
      phone: form.phone.trim(),
      website: form.website.trim(),
      notes: form.notes.trim(),
      hours: form.hours,
      hoursSummary: hoursSummary
        ? Object.entries(hoursMap)
            .map(([day, value]) => `${day}: ${value}`)
            .join(' | ')
        : '—',
    })
      .then(() => {
        setSubmitting(false);
        setSubmitted(true);
        onToast('Listing submitted to pending review');

        setTimeout(() => {
          onClose();
          setForm(initialFormState());
          setSubmitted(false);
        }, 1800);
      })
      .catch(() => {
        setSubmitting(false);
        onToast('Could not submit listing. Please try again.');
      });
  }

  if (submitted) {
    return (
      <div className="m-success">
        <div className="m-success-icon" aria-hidden="true">✓</div>
        <div className="m-success-title">Submission Received</div>
        <div className="m-success-copy">
          Thank you for contributing to Relief Route. Your listing is now in the pending review queue.
        </div>

        <div className="m-success-card">
          <div className="m-success-label">Location</div>
          <div className="m-success-name">{form.name || 'Untitled location'}</div>
          <div className="m-success-address">{form.address || 'Address not provided'}</div>
        </div>

        <div className="m-success-foot">Closing automatically...</div>
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

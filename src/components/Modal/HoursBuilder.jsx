import { useState, useCallback } from 'react';
import { FULL_DAYS } from '../../data/constants';

function initHours() {
  return Object.fromEntries(
    FULL_DAYS.map(day => [day, { open: '', close: '', closed: false }])
  );
}

export default function HoursBuilder({ value, onChange }) {
  function toggle(day) {
    onChange({
      ...value,
      [day]: { ...value[day], closed: !value[day].closed },
    });
  }

  function setField(day, field, val) {
    onChange({ ...value, [day]: { ...value[day], [field]: val } });
  }

  return (
    <div className="hours-builder">
      <div className="hours-builder-header">
        <div className="hbh-cell">Day</div>
        <div className="hbh-cell">Open</div>
        <div className="hbh-cell">Close</div>
        <div className="hbh-cell" style={{ paddingRight: '.5rem', textAlign: 'center' }}>
          Off
        </div>
      </div>

      {FULL_DAYS.map(day => {
        const { open, close, closed } = value[day];
        return (
          <div
            key={day}
            className={`hours-builder-row${closed ? ' closed-day' : ''}`}
          >
            <div className="hb-day">{day}</div>
            <input
              className={`hb-input${closed ? ' closed-input' : ''}`}
              type="text"
              placeholder={closed ? 'Closed' : '9:00 am'}
              value={open}
              disabled={closed}
              onChange={e => setField(day, 'open', e.target.value)}
            />
            <input
              className={`hb-input hb-close${closed ? ' closed-input' : ''}`}
              type="text"
              placeholder={closed ? '' : '5:00 pm'}
              value={close}
              disabled={closed}
              onChange={e => setField(day, 'close', e.target.value)}
            />
            <div className="hb-closed-toggle">
              <input
                className="hb-checkbox"
                type="checkbox"
                checked={closed}
                onChange={() => toggle(day)}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export { initHours };

export function getHoursValue(value) {
  const result = {};
  FULL_DAYS.forEach(day => {
    const { open, close, closed } = value[day];
    if (closed) {
      result[day] = 'Closed';
    } else {
      result[day] = open && close ? `${open}–${close}` : open || close || '—';
    }
  });
  return result;
}

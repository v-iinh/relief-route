import { FULL_DAYS } from '../../data/constants';

const ALWAYS_OPEN_VALUE = 'Open 24 hours';

function isAlwaysOpenEntry(entry = {}) {
  const normalizedOpen = String(entry.open || '').trim().toLowerCase();
  return !entry.closed && !entry.close && (
    normalizedOpen === 'open 24/7' ||
    normalizedOpen === 'open 24 hours' ||
    normalizedOpen === 'open 24h'
  );
}

function initHours() {
  return Object.fromEntries(
    FULL_DAYS.map(day => [day, { open: '', close: '', closed: false }])
  );
}

export default function HoursBuilder({ value, onChange, readOnly = false }) {
  const hoursValue = value || initHours();

  function update(nextValue) {
    if (readOnly || typeof onChange !== 'function') return;
    onChange(nextValue);
  }

  function toggle24h(day) {
    const current = hoursValue[day] || {};

    if (isAlwaysOpenEntry(current)) {
      update({
        ...hoursValue,
        [day]: { ...current, open: '', close: '', closed: false },
      });
      return;
    }

    update({
      ...hoursValue,
      [day]: { ...current, open: ALWAYS_OPEN_VALUE, close: '', closed: false },
    });
  }

  function toggle(day) {
    update({
      ...hoursValue,
      [day]: { ...hoursValue[day], closed: !hoursValue[day].closed },
    });
  }

  function setField(day, field, val) {
    update({ ...hoursValue, [day]: { ...hoursValue[day], [field]: val } });
  }

  return (
    <div className="hours-builder">
      <div className="hours-builder-header">
        <div className="hbh-cell">Day</div>
        <div className="hbh-cell">Open</div>
        <div className="hbh-cell">Close</div>
        <div className="hbh-cell" style={{ textAlign: 'center' }}>
          24h
        </div>
        <div className="hbh-cell" style={{ paddingRight: '.5rem', textAlign: 'center' }}>
          Off
        </div>
      </div>

      {FULL_DAYS.map(day => {
        const { open, close, closed } = hoursValue[day];
        const is24h = isAlwaysOpenEntry(hoursValue[day]);
        return (
          <div
            key={day}
            className={`hours-builder-row${closed ? ' closed-day' : ''}`}
          >
            <div className="hb-day">{day}</div>
            <input
              className={`hb-input${closed ? ' closed-input' : ''}${is24h ? ' always-open-input' : ''}`}
              type="text"
              placeholder={closed ? 'Closed' : '9:00 am'}
              value={open}
              disabled={closed || is24h || readOnly}
              onChange={e => setField(day, 'open', e.target.value)}
            />
            <input
              className={`hb-input hb-close${closed ? ' closed-input' : ''}`}
              type="text"
              placeholder={closed || is24h ? '' : '5:00 pm'}
              value={close}
              disabled={closed || is24h || readOnly}
              onChange={e => setField(day, 'close', e.target.value)}
            />
            <div className="hb-24h-toggle">
              <input
                className="hb-checkbox"
                type="checkbox"
                checked={is24h}
                disabled={closed || readOnly}
                onChange={() => toggle24h(day)}
              />
            </div>
            <div className="hb-closed-toggle">
              <input
                className="hb-checkbox"
                type="checkbox"
                checked={closed}
                disabled={is24h || readOnly}
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
    } else if (isAlwaysOpenEntry(value[day])) {
      result[day] = ALWAYS_OPEN_VALUE;
    } else {
      result[day] = open && close ? `${open}–${close}` : open || close || '—';
    }
  });
  return result;
}

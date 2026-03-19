import { useEffect, useRef, useState } from 'react';
import HoursTable from '../common/HoursTable';

const statusClass = s =>
  s === 'closed' ? 's-closed' : s === 'open' ? 's-open' : 's-unknown';
const statusLabel = s =>
  s === 'closed' ? 'Closed' : s === 'open' ? 'Open' : 'Hours unavailable';
const statusDot = s =>
  s === 'closed' ? '○' : s === 'open' ? '●' : '○';

function getDir(address) {
  window.open(
    `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`,
    '_blank',
    'noopener,noreferrer'
  );
}

function extractCompletionText(data) {
  const content = data?.choices?.[0]?.message?.content;

  if (typeof content === 'string') {
    return content.trim();
  }

  if (Array.isArray(content)) {
    const merged = content
      .map(part => {
        if (typeof part === 'string') return part;
        if (part?.type === 'text') return part.text || '';
        return '';
      })
      .join(' ')
      .trim();

    if (merged) return merged;
  }

  const alt = data?.choices?.[0]?.text;
  return typeof alt === 'string' ? alt.trim() : '';
}

export default function DetailContent({ loc, onToast }) {
  const isCommunity = loc.filter === 'community';
  const hasRating = typeof loc.rating === 'number' && !Number.isNaN(loc.rating);
  const roundedStars = hasRating ? Math.round(Math.max(0, Math.min(5, loc.rating))) : 0;
  const noteCacheRef = useRef(new Map());
  const [aiNote, setAiNote] = useState('');
  const [noteStatus, setNoteStatus] = useState('idle');
  const safeHours = loc.hours || {
    Mon: '—',
    Tue: '—',
    Wed: '—',
    Thu: '—',
    Fri: '—',
    Sat: '—',
    Sun: '—',
  };

  useEffect(() => {
    let cancelled = false;

    async function generateNote() {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      const locId = loc?.place_id || loc?.id;
      const fallback = loc?.notes?.trim() || 'Not Available';

      if (!locId || !loc?.name || !loc?.address) {
        setAiNote(fallback);
        setNoteStatus('ready');
        return;
      }

      if (noteCacheRef.current.has(locId)) {
        setAiNote(noteCacheRef.current.get(locId));
        setNoteStatus('ready');
        return;
      }

      if (!apiKey) {
        setAiNote(fallback);
        setNoteStatus('ready');
        return;
      }

      setNoteStatus('loading');

      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'compound-beta-mini',
            messages: [
              {
                role: 'user',
                content: `Summarize ${loc.name} at ${loc.address} in 3-4 sentences.
                Do not restate the name or full address.
                Highlight what it provides, who it serves, and key availability details.
                Be direct and avoid descriptive phrases.`
            },
            ],
            temperature: 0.2,
          }),
        });

        if (!response.ok) {
          throw new Error(`Groq request failed: ${response.status}`);
        }

        const data = await response.json();
        const summary = extractCompletionText(data) || fallback;

        if (!cancelled) {
          noteCacheRef.current.set(locId, summary);
          setAiNote(summary);
          setNoteStatus('ready');
        }
      } catch (error) {
        if (!cancelled) {
          console.error(error);
          setAiNote(fallback);
          setNoteStatus('ready');
        }
      }
    }

    generateNote();

    return () => {
      cancelled = true;
    };
  }, [loc?.id, loc?.place_id, loc?.name, loc?.address, loc?.notes]);

  function share() {
    const text = `${loc.name} — ${loc.address}`;
    if (navigator.share) {
      navigator.share({ title: loc.name, text, url: window.location.href });
    } else {
      navigator.clipboard
        .writeText(text)
        .then(() => onToast('Copied to clipboard'));
    }
  }

  return (
    <div className="detail-scroll">
      <div className="detail-name">{loc.name}</div>
      {hasRating && (
        <div className="detail-rating" aria-label={`Rating ${loc.rating.toFixed(1)} out of 5`}>
          <span className="detail-rating-stars">{'★'.repeat(roundedStars)}{'☆'.repeat(5 - roundedStars)}</span>
          <span className="detail-rating-value">{loc.rating.toFixed(1)} / 5</span>
        </div>
      )}
      <div className="detail-status-row">
        <span className={`detail-status ${statusClass(loc.status)}`}>
          {statusDot(loc.status)} {statusLabel(loc.status)}{loc.status === 'unknown' ? '' : ' now'}
        </span>
        <span style={{ fontSize: '.72rem', color: 'var(--ink-muted)' }}>
          ◎ {typeof loc.dist === 'number' ? loc.dist : 0} mi away
        </span>
      </div>

      <div className="dsec">
        <div className="dlabel">Address</div>
        <div className="dvalue">{loc.address}</div>
      </div>

      {loc.phone && loc.phone !== '—' && (
        <div className="dsec">
          <div className="dlabel">Phone</div>
          <div className="dvalue">{loc.phone}</div>
        </div>
      )}

      {loc.website && (
        <div className="dsec">
          <div className="dlabel">Website</div>
          <div className="dvalue">
            <a
              href={loc.website}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'var(--green)',
                textDecoration: 'underline',
                textUnderlineOffset: '3px',
                fontSize: '0.84rem',
                fontWeight: 300,
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
              }}
            >
              {loc.website.replace(/^https?:\/\//, '')}
            </a>
          </div>
        </div>
      )}

      <div className="dsec">
        <div className="dlabel">Hours</div>
        <HoursTable hours={safeHours} />
      </div>

      {isCommunity && (
        <>
          <div className="dsec">
            <div className="dlabel">Food available</div>
            <div className="dtags">
              {loc.tags.map(t => (
                <span className="dtag" key={t}>{t}</span>
              ))}
            </div>
          </div>
          <div className="dsec">
            <div className="dlabel">Currently needed</div>
            <div className="needs-list">
              {loc.needs.map(n => (
                <div className="need-item" key={n}>{n}</div>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="dsec">
        <div className="dlabel">Notes</div>
        <div className="dvalue">
          {noteStatus === 'loading' ? 'Loading...' : aiNote || loc.notes || '—'}
        </div>
      </div>

      <div className="detail-actions">
        <button className="btn-dir" onClick={() => getDir(loc.address)}>
          <span>Get directions</span>
          <svg className="btn-dir-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <path
              d="M5 11L11 5M6 5h5v5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button className="btn-share" onClick={share}>
          Share
        </button>
      </div>
    </div>
  );
}

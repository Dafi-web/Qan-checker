import { useEffect, useMemo, useState } from 'react';
import {
  MAX_SERIAL_LENGTH,
  MAX_SERIALS,
  formatWhileTyping,
  parseSerials,
} from '../serials';
import { api } from '../api';

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '');
}

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '');
}

/** Match QAN number/title against typed text — number-only queries match digits in the QAN. */
export function qanMatchesQuery(qan, query) {
  const raw = String(query || '').trim();
  if (!raw) return true;

  const number = String(qan.qanNumber || '');
  const title = String(qan.title || '');
  const description = String(qan.description || '');
  const upper = raw.toUpperCase();
  const compactQuery = normalizeText(raw);
  const queryDigits = digitsOnly(raw);

  if (number.toUpperCase().includes(upper) || title.toUpperCase().includes(upper)) {
    return true;
  }

  if (description.toUpperCase().includes(upper)) return true;

  const compactHaystack = normalizeText(`${number} ${title} ${description}`);
  if (compactQuery && compactHaystack.includes(compactQuery)) return true;

  // Typing "26" or "001" should find QAN-2026-001
  if (queryDigits) {
    const numberDigits = digitsOnly(number);
    if (numberDigits.includes(queryDigits)) return true;
  }

  return false;
}

/**
 * Shared QAN search + serial check panel for shippers and admins.
 * qans: [{ id, qanNumber, title }]
 */
export default function QanCheckPanel({ qans = [], qansLoading = false }) {
  const [qanQuery, setQanQuery] = useState('');
  const [qanId, setQanId] = useState('');
  const [serialText, setSerialText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bulk, setBulk] = useState(null);
  const [filter, setFilter] = useState('all');

  const { serials: parsedSerials } = useMemo(() => parseSerials(serialText), [serialText]);
  const parsedCount = parsedSerials.length;
  const query = qanQuery.trim();

  const filteredQans = useMemo(() => {
    if (!query) return qans;
    return qans.filter((item) => qanMatchesQuery(item, query));
  }, [qans, query]);

  const selectedQan = useMemo(() => {
    if (!qanId || qanId === 'all') return null;
    return qans.find((q) => String(q.id) === String(qanId)) || null;
  }, [qans, qanId]);

  useEffect(() => {
    if (!qanId) return;
    if (qanId === 'all') {
      if (query) setQanId('');
      return;
    }
    if (!filteredQans.some((q) => String(q.id) === String(qanId))) {
      setQanId('');
    }
  }, [filteredQans, qanId, query]);

  function selectQan(id) {
    setQanId(String(id));
    setBulk(null);
    setError('');
  }

  function clearQanSearch() {
    setQanQuery('');
    setBulk(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBulk(null);

    if (!qanId) {
      setError('Please select a QAN first');
      return;
    }

    const { serials } = parseSerials(serialText);
    if (serials.length === 0) {
      setError('Paste at least one serial number');
      return;
    }

    const tooLong = serials.filter((s) => s.length > MAX_SERIAL_LENGTH);
    if (tooLong.length > 0) {
      setError(`Each serial can be at most ${MAX_SERIAL_LENGTH} digits.`);
      return;
    }

    if (serials.length > MAX_SERIALS) {
      setError('Please check fewer serials at a time.');
      return;
    }

    setLoading(true);
    try {
      const data = await api.checkSerials(serials.join(' '), qanId);
      setBulk(data);
      setFilter('all');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setSerialText('');
    setBulk(null);
    setError('');
    setFilter('all');
  }

  function removeSerial(serial) {
    const next = parsedSerials.filter((s) => s !== serial);
    setSerialText(next.join(' '));
    setBulk(null);
  }

  const visibleResults = useMemo(() => {
    if (!bulk?.results) return [];
    if (filter === 'blocked') return bulk.results.filter((r) => r.affected);
    if (filter === 'clear') return bulk.results.filter((r) => !r.affected);
    return bulk.results;
  }, [bulk, filter]);

  return (
    <>
      <form className="check-form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="qanSearch">Search QAN</label>
          <div className="qan-search-row">
            <input
              id="qanSearch"
              type="search"
              value={qanQuery}
              onChange={(e) => {
                setQanQuery(e.target.value);
                setBulk(null);
              }}
              placeholder="Type number only, e.g. 001…"
              autoComplete="off"
              inputMode="search"
            />
            {query && (
              <button type="button" className="ghost-btn" onClick={clearQanSearch}>
                Clear
              </button>
            )}
          </div>
          <p className="field-hint">
            Type to filter. Number-only search works (example: 001 finds QAN-2026-001).
          </p>
        </div>

        <div className="field">
          <div className="qan-picker-head">
            <label htmlFor="qanSelect">QAN dropdown</label>
            <span className="count-hint">
              {qansLoading
                ? 'Loading…'
                : query
                  ? `${filteredQans.length} match${filteredQans.length === 1 ? '' : 'es'}`
                  : `${qans.length} active`}
            </span>
          </div>

          <select
            id="qanSelect"
            value={qanId}
            onChange={(e) => selectQan(e.target.value)}
            disabled={qansLoading || (query ? filteredQans.length === 0 : qans.length === 0)}
            required
          >
            <option value="">
              {qansLoading
                ? 'Loading…'
                : query
                  ? filteredQans.length === 0
                    ? 'No QANs match your search'
                    : 'Please select a QAN'
                  : qans.length === 0
                    ? 'No active QANs'
                    : 'Please select which QAN you want to check'}
            </option>
            {!query && qans.length > 0 && <option value="all">All active QANs</option>}
            {filteredQans.map((q) => (
              <option key={q.id} value={q.id}>
                {q.qanNumber}
                {q.title ? ` — ${q.title}` : ''}
              </option>
            ))}
          </select>

          {!qansLoading && filteredQans.length > 0 && (
            <ul className="qan-pick-list" role="listbox" aria-label="Matching QANs">
              {!query && (
                <li>
                  <button
                    type="button"
                    role="option"
                    aria-selected={qanId === 'all'}
                    className={`qan-pick-card qan-pick-all ${qanId === 'all' ? 'qan-pick-selected' : ''}`}
                    onClick={() => selectQan('all')}
                  >
                    <span className="qan-pick-number">All active QANs</span>
                    <span className="qan-pick-title">Check against every active QAN</span>
                  </button>
                </li>
              )}
              {filteredQans.map((q) => {
                const selected = String(qanId) === String(q.id);
                return (
                  <li key={q.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      className={`qan-pick-card ${selected ? 'qan-pick-selected' : ''}`}
                      onClick={() => selectQan(q.id)}
                    >
                      <span className="qan-pick-number">{q.qanNumber}</span>
                      {q.title ? <span className="qan-pick-title">{q.title}</span> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {qansLoading ? (
            <p className="muted">Loading QANs…</p>
          ) : qans.length === 0 ? (
            <p className="muted">No active QANs available.</p>
          ) : filteredQans.length === 0 ? (
            <p className="muted">No QAN matches “{query}”. Try fewer digits or clear the search.</p>
          ) : null}

          {selectedQan && (
            <p className="selected-qan-chip">
              Selected: <strong>{selectedQan.qanNumber}</strong>
              {selectedQan.title ? ` — ${selectedQan.title}` : ''}
            </p>
          )}
          {qanId === 'all' && (
            <p className="selected-qan-chip">
              Selected: <strong>All active QANs</strong>
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor="serials">
            Serial numbers
            {parsedCount > 0 && <span className="count-hint">{parsedCount} to check</span>}
          </label>
          <textarea
            id="serials"
            name="serials"
            rows={4}
            spellCheck={false}
            placeholder="Paste serials to check"
            value={serialText}
            onChange={(e) => setSerialText(formatWhileTyping(e.target.value))}
            onBlur={() => setSerialText(formatWhileTyping(serialText))}
          />
          <p className="field-hint">Paste serials, then check.</p>

          {parsedSerials.length > 0 && (
            <div className="serial-board" aria-label="Parsed serial numbers">
              {parsedSerials.map((serial) => (
                <div
                  key={serial}
                  className={`serial-tile ${
                    serial.length > MAX_SERIAL_LENGTH ? 'serial-tile-bad' : ''
                  }`}
                >
                  <code>{serial}</code>
                  <span className="serial-tile-meta">{serial.length} dig</span>
                  <button
                    type="button"
                    className="serial-tile-remove"
                    aria-label={`Remove ${serial}`}
                    onClick={() => removeSerial(serial)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="check-actions">
          <button type="submit" disabled={loading || qansLoading || !qanId}>
            {loading ? 'Checking…' : 'Check serials'}
          </button>
          {(serialText || bulk) && (
            <button type="button" className="ghost-btn" onClick={handleReset}>
              Clear
            </button>
          )}
        </div>
      </form>

      {error && <p className="form-error">{error}</p>}

      {bulk && (
        <section className="bulk-results" role="status">
          <div className={`result-panel ${bulk.blockedCount > 0 ? 'result-stop' : 'result-go'}`}>
            <p className="result-label">
              {bulk.blockedCount > 0 ? 'Hold — do not ship' : 'Clear to ship'}
            </p>
            <p className="result-message">{bulk.summary.message}</p>
            {bulk.qanLabel && <p className="result-serial">QAN: {bulk.qanLabel}</p>}
            <div className="bulk-stats">
              <span>
                <strong>{bulk.total}</strong> checked
              </span>
              <span className="stat-stop">
                <strong>{bulk.blockedCount}</strong> hold
              </span>
              <span className="stat-go">
                <strong>{bulk.clearCount}</strong> clear
              </span>
            </div>
          </div>

          <div className="result-filters">
            <button
              type="button"
              className={filter === 'all' ? 'filter-active' : 'ghost-btn'}
              onClick={() => setFilter('all')}
            >
              All ({bulk.total})
            </button>
            <button
              type="button"
              className={filter === 'blocked' ? 'filter-active' : 'ghost-btn'}
              onClick={() => setFilter('blocked')}
            >
              Hold ({bulk.blockedCount})
            </button>
            <button
              type="button"
              className={filter === 'clear' ? 'filter-active' : 'ghost-btn'}
              onClick={() => setFilter('clear')}
            >
              Clear ({bulk.clearCount})
            </button>
          </div>

          <ul className="bulk-board">
            {visibleResults.map((item) => (
              <li
                key={item.serial}
                className={`serial-result-card ${item.affected ? 'bulk-stop' : 'bulk-go'}`}
              >
                <div className="serial-result-top">
                  <code>{item.serial}</code>
                  <span className={`pill ${item.affected ? 'pill-stop' : 'pill-go'}`}>
                    {item.affected ? 'HOLD' : 'OK'}
                  </span>
                </div>
                <p className="bulk-status">
                  {item.affected ? 'Do not ship — send back to CM' : 'Good to ship'}
                </p>
                {item.affected && item.qans?.length > 0 && (
                  <p className="muted">{item.qans.map((q) => q.qanNumber).join(', ')}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

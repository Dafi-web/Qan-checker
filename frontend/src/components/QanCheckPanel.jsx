import { useEffect, useMemo, useState } from 'react';
import {
  MAX_SERIAL_LENGTH,
  MAX_SERIALS,
  formatWhileTyping,
  parseSerials,
} from '../serials';
import { api } from '../api';

/**
 * Shared QAN search + serial check panel for shippers and admins.
 * qans: [{ id, qanNumber, title }]
 */
export default function QanCheckPanel({ qans = [], qansLoading = false }) {
  const [qanQuery, setQanQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [qanId, setQanId] = useState('');
  const [serialText, setSerialText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bulk, setBulk] = useState(null);
  const [filter, setFilter] = useState('all');

  const { serials: parsedSerials } = useMemo(() => parseSerials(serialText), [serialText]);
  const parsedCount = parsedSerials.length;

  const filteredQans = useMemo(() => {
    const q = appliedQuery.trim().toUpperCase();
    if (!q) return qans;
    return qans.filter((item) => {
      const number = String(item.qanNumber || '').toUpperCase();
      const title = String(item.title || '').toUpperCase();
      return number.includes(q) || title.includes(q);
    });
  }, [qans, appliedQuery]);

  useEffect(() => {
    if (qanId === 'all') return;
    if (qanId && filteredQans.some((q) => String(q.id) === String(qanId))) return;
    if (filteredQans.length === 1) {
      setQanId(String(filteredQans[0].id));
      return;
    }
    if (qanId) setQanId('');
  }, [filteredQans, qanId]);

  function handleSearchQan(e) {
    e.preventDefault();
    setAppliedQuery(qanQuery);
    setBulk(null);
  }

  function clearQanSearch() {
    setQanQuery('');
    setAppliedQuery('');
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
              onChange={(e) => setQanQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearchQan(e);
                }
              }}
              placeholder="Type QAN number or title…"
              autoComplete="off"
            />
            <button type="button" className="ghost-btn" onClick={handleSearchQan}>
              Search
            </button>
            {(qanQuery || appliedQuery) && (
              <button type="button" className="ghost-btn" onClick={clearQanSearch}>
                Clear
              </button>
            )}
          </div>
          {appliedQuery && (
            <p className="field-hint">
              Showing {filteredQans.length} of {qans.length} QAN
              {qans.length === 1 ? '' : 's'} matching “{appliedQuery}”.
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor="qanSelect">Which QAN do you want to check?</label>
          <select
            id="qanSelect"
            value={qanId}
            onChange={(e) => {
              setQanId(e.target.value);
              setBulk(null);
            }}
            disabled={qansLoading || filteredQans.length === 0}
            required
          >
            <option value="">
              {qansLoading
                ? 'Loading…'
                : filteredQans.length === 0
                  ? appliedQuery
                    ? 'No QANs match your search'
                    : 'No active QANs'
                  : 'Please select which QAN you want to check'}
            </option>
            {!appliedQuery && qans.length > 0 && <option value="all">All active QANs</option>}
            {filteredQans.map((q) => (
              <option key={q.id} value={q.id}>
                {q.qanNumber}
                {q.title ? ` — ${q.title}` : ''}
              </option>
            ))}
          </select>
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
          <button type="submit" disabled={loading || qansLoading || filteredQans.length === 0}>
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

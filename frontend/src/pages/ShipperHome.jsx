import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, clearAuth, getStoredUser, isLoggedIn } from '../api';
import {
  MAX_SERIAL_LENGTH,
  MAX_SERIALS,
  formatWhileTyping,
  parseSerials,
} from '../serials';

export default function ShipperHome() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const loggedIn = isLoggedIn() && user?.role === 'shipper';

  const [qans, setQans] = useState([]);
  const [qanId, setQanId] = useState('');
  const [qansLoading, setQansLoading] = useState(false);
  const [serialText, setSerialText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bulk, setBulk] = useState(null);
  const [filter, setFilter] = useState('all');

  const { serials: parsedSerials } = useMemo(() => parseSerials(serialText), [serialText]);
  const parsedCount = parsedSerials.length;

  // Admins belong in the console, not on the shipper home.
  useEffect(() => {
    if (isLoggedIn() && getStoredUser()?.role === 'admin') {
      navigate('/admin', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (!loggedIn) return undefined;

    let cancelled = false;
    setQansLoading(true);
    api
      .listActiveQans()
      .then((data) => {
        if (cancelled) return;
        setQans(data);
        if (data.length === 1) setQanId(data[0].id);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setQansLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [loggedIn]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBulk(null);

    if (!loggedIn) {
      navigate('/login');
      return;
    }

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
      setError(
        `Each serial can be at most ${MAX_SERIAL_LENGTH} digits. Longer values are not allowed.`
      );
      return;
    }

    if (serials.length > MAX_SERIALS) {
      setError(`Maximum ${MAX_SERIALS} serial numbers per check (you entered ${serials.length})`);
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

  function logout() {
    clearAuth();
    navigate('/');
  }

  const visibleResults = useMemo(() => {
    if (!bulk?.results) return [];
    if (filter === 'blocked') return bulk.results.filter((r) => r.affected);
    if (filter === 'clear') return bulk.results.filter((r) => !r.affected);
    return bulk.results;
  }, [bulk, filter]);

  return (
    <div className="page shipper-home">
      <header className="topbar topbar-shipper">
        <div className="brand">
          <span className="brand-mark" aria-hidden />
          <div className="brand-text">
            <span className="brand-name">QAN Checker</span>
            <span className="brand-sub">Shipping verification</span>
          </div>
        </div>
        <div className="topbar-actions">
          {loggedIn ? (
            <>
              <span className="user-chip">{user.username}</span>
              <button type="button" className="ghost-btn" onClick={logout}>
                Sign out
              </button>
            </>
          ) : (
            <Link className="topbar-link" to="/login">
              Sign in
            </Link>
          )}
        </div>
      </header>

      <main className="shipper-main">
        <section className="shipper-hero">
          <p className="eyebrow">For shipping teams</p>
          <h1>Verify serial numbers before shipping</h1>
          <p className="lede">
            Select a Quality Alert Notice, paste up to {MAX_SERIALS} serials, and confirm which units
            can ship — and which must go back to CM.
          </p>
        </section>

        {!loggedIn ? (
          <section className="shipper-panel welcome-panel">
            <h2>Ready to check units?</h2>
            <p className="lede">
              Sign in with the shipper account your administrator gave you. The home page is only for
              serial checks — no admin tools here.
            </p>
            <div className="welcome-steps">
              <div className="welcome-step">
                <span className="step-num">1</span>
                <p>Sign in with your shipper access</p>
              </div>
              <div className="welcome-step">
                <span className="step-num">2</span>
                <p>Choose the QAN you need to check</p>
              </div>
              <div className="welcome-step">
                <span className="step-num">3</span>
                <p>Paste serials and see hold / clear results</p>
              </div>
            </div>
            <div className="check-actions">
              <Link className="primary-link-btn" to="/login">
                Sign in to check
              </Link>
            </div>
          </section>
        ) : (
          <>
            <section className="shipper-panel">
              <form className="check-form" onSubmit={handleSubmit}>
                <div className="field">
                  <label htmlFor="qanSelect">Select QAN</label>
                  <select
                    id="qanSelect"
                    value={qanId}
                    onChange={(e) => {
                      setQanId(e.target.value);
                      setBulk(null);
                    }}
                    disabled={qansLoading || qans.length === 0}
                    required
                  >
                    <option value="">
                      {qansLoading
                        ? 'Loading…'
                        : qans.length === 0
                          ? 'No active QANs available'
                          : 'Choose a QAN…'}
                    </option>
                    <option value="all">All active QANs</option>
                    {qans.map((q) => (
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
                    <span className="count-hint">
                      {parsedCount} / {MAX_SERIALS} · max {MAX_SERIAL_LENGTH} digits each
                    </span>
                  </label>
                  <textarea
                    id="serials"
                    name="serials"
                    rows={4}
                    autoFocus
                    spellCheck={false}
                    placeholder={
                      'Paste up to 11 digits per serial — spaces are added automatically\n12345678901 12345678902'
                    }
                    value={serialText}
                    onChange={(e) => setSerialText(formatWhileTyping(e.target.value))}
                    onBlur={() => setSerialText(formatWhileTyping(serialText))}
                  />
                  <p className="field-hint">
                    Max {MAX_SERIAL_LENGTH} digits per serial (shorter is OK). A space is inserted
                    every {MAX_SERIAL_LENGTH} digits.
                  </p>

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
                          <span className="serial-tile-meta">{serial.length} digits</span>
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
                  <button type="submit" disabled={loading || qansLoading || qans.length === 0}>
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
            </section>

            {bulk && (
              <section className="bulk-results" role="status">
                <div
                  className={`result-panel ${
                    bulk.blockedCount > 0 ? 'result-stop' : 'result-go'
                  }`}
                >
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
        )}
      </main>
    </div>
  );
}

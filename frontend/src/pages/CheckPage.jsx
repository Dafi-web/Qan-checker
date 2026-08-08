import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function CheckPage() {
  const [serial, setSerial] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setResult(null);

    const value = serial.trim();
    if (!value) {
      setError('Enter a serial number');
      return;
    }

    setLoading(true);
    try {
      const data = await api.checkSerial(value);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setSerial('');
    setResult(null);
    setError('');
  }

  return (
    <div className="page check-page">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden />
          <span className="brand-name">QAN Checker</span>
        </div>
        <Link className="topbar-link" to="/admin/login">
          Admin
        </Link>
      </header>

      <main className="check-main">
        <section className="check-hero">
          <p className="eyebrow">Serial verification</p>
          <h1>Check if a unit is affected by a QAN</h1>
          <p className="lede">
            Enter the unit serial number. The system will tell you whether to ship or send it back to CM.
          </p>

          <form className="check-form" onSubmit={handleSubmit}>
            <label htmlFor="serial">Serial number</label>
            <div className="check-row">
              <input
                id="serial"
                name="serial"
                autoFocus
                autoComplete="off"
                placeholder="e.g. SN123456789"
                value={serial}
                onChange={(e) => setSerial(e.target.value)}
              />
              <button type="submit" disabled={loading}>
                {loading ? 'Checking…' : 'Check'}
              </button>
            </div>
          </form>

          {error && <p className="form-error">{error}</p>}

          {result && (
            <div
              className={`result-panel ${result.affected ? 'result-stop' : 'result-go'}`}
              role="status"
            >
              <p className="result-label">
                {result.affected ? 'Do not ship' : 'Good to ship'}
              </p>
              <p className="result-message">{result.message}</p>
              <p className="result-serial">Serial: {result.serial}</p>
              {result.affected && result.qans?.length > 0 && (
                <ul className="result-qans">
                  {result.qans.map((q) => (
                    <li key={q._id}>
                      <strong>{q.qanNumber}</strong>
                      {q.title ? ` — ${q.title}` : ''}
                    </li>
                  ))}
                </ul>
              )}
              <button type="button" className="ghost-btn" onClick={handleReset}>
                Check another
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

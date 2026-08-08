import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, clearAuth } from '../api';

export default function QanDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [qan, setQan] = useState(null);
  const [serialText, setSerialText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await api.getQan(id);
      setQan(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function handleAdd(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const data = await api.addSerials(id, serialText);
      setQan(data.qan);
      setSerialText('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(serial) {
    try {
      const data = await api.removeSerial(id, serial);
      setQan(data);
    } catch (err) {
      setError(err.message);
    }
  }

  function logout() {
    clearAuth();
    navigate('/login');
  }

  return (
    <div className="page admin-page">
      <header className="topbar">
        <Link className="brand" to="/admin">
          <span className="brand-mark" aria-hidden />
          <div className="brand-text">
            <span className="brand-name">QAN Checker</span>
            <span className="brand-sub">Administration</span>
          </div>
        </Link>
        <div className="topbar-actions">
          <Link className="topbar-link" to="/admin">
            Back to console
          </Link>
          <button type="button" className="ghost-btn" onClick={logout}>
            Sign out
          </button>
        </div>
      </header>

      <main className="admin-main">
        {loading ? (
          <p className="muted">Loading…</p>
        ) : !qan ? (
          <p className="form-error">{error || 'QAN not found'}</p>
        ) : (
          <>
            <section className="admin-intro">
              <p className="eyebrow">{qan.qanNumber}</p>
              <h1>{qan.title}</h1>
              {qan.description && <p className="lede">{qan.description}</p>}
            </section>

            {error && <p className="form-error">{error}</p>}

            <section className="panel">
              <h2>Add serial numbers</h2>
              <form className="admin-form" onSubmit={handleAdd}>
                <label htmlFor="moreSerials">Paste serials (one per line)</label>
                <textarea
                  id="moreSerials"
                  rows={5}
                  value={serialText}
                  onChange={(e) => setSerialText(e.target.value)}
                  placeholder={'SN2001\nSN2002'}
                  required
                />
                <button type="submit" disabled={saving}>
                  {saving ? 'Adding…' : 'Add serials'}
                </button>
              </form>
            </section>

            <section className="panel">
              <h2>Listed serials ({qan.serialNumbers.length})</h2>
              {qan.serialNumbers.length === 0 ? (
                <p className="muted">No serial numbers on this QAN yet.</p>
              ) : (
                <ul className="serial-list">
                  {qan.serialNumbers.map((serial) => (
                    <li key={serial}>
                      <code>{serial}</code>
                      <button type="button" className="danger-btn" onClick={() => handleRemove(serial)}>
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

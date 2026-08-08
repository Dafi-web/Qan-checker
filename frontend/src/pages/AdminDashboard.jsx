import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, clearAuth, getStoredUser } from '../api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [qans, setQans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    qanNumber: '',
    title: '',
    description: '',
    serialNumbers: '',
  });
  const [saving, setSaving] = useState(false);

  async function loadQans() {
    setLoading(true);
    setError('');
    try {
      const data = await api.listQans();
      setQans(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQans();
  }, []);

  function logout() {
    clearAuth();
    navigate('/admin/login');
  }

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.createQan(form);
      setForm({ qanNumber: '', title: '', description: '', serialNumbers: '' });
      await loadQans();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(qan) {
    try {
      await api.updateQan(qan._id, { active: !qan.active });
      await loadQans();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this QAN and all its serial numbers?')) return;
    try {
      await api.deleteQan(id);
      await loadQans();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page admin-page">
      <header className="topbar">
        <Link className="brand" to="/">
          <span className="brand-mark" aria-hidden />
          <span className="brand-name">QAN Checker</span>
        </Link>
        <div className="topbar-actions">
          <span className="muted">{user?.username}</span>
          <button type="button" className="ghost-btn" onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      <main className="admin-main">
        <section className="admin-intro">
          <h1>Admin dashboard</h1>
          <p className="lede">Create QANs and attach the serial numbers that must not ship.</p>
        </section>

        {error && <p className="form-error">{error}</p>}

        <section className="panel">
          <h2>Create QAN</h2>
          <form className="admin-form" onSubmit={handleCreate}>
            <div className="grid-2">
              <div>
                <label htmlFor="qanNumber">QAN number</label>
                <input
                  id="qanNumber"
                  required
                  value={form.qanNumber}
                  onChange={(e) => setForm({ ...form, qanNumber: e.target.value })}
                  placeholder="QAN-2026-001"
                />
              </div>
              <div>
                <label htmlFor="title">Title</label>
                <input
                  id="title"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Short description"
                />
              </div>
            </div>

            <label htmlFor="description">Notes (optional)</label>
            <input
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />

            <label htmlFor="serialNumbers">Serial numbers (one per line, or comma-separated)</label>
            <textarea
              id="serialNumbers"
              rows={6}
              value={form.serialNumbers}
              onChange={(e) => setForm({ ...form, serialNumbers: e.target.value })}
              placeholder={'SN1001\nSN1002\nSN1003'}
            />

            <button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Create QAN'}
            </button>
          </form>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Existing QANs</h2>
            <button type="button" className="ghost-btn" onClick={loadQans}>
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="muted">Loading…</p>
          ) : qans.length === 0 ? (
            <p className="muted">No QANs yet. Create one above.</p>
          ) : (
            <ul className="qan-list">
              {qans.map((qan) => (
                <li key={qan._id} className="qan-item">
                  <div>
                    <p className="qan-number">
                      {qan.qanNumber}
                      {!qan.active && <span className="badge">Inactive</span>}
                    </p>
                    <p className="qan-title">{qan.title}</p>
                    <p className="muted">{qan.serialNumbers.length} serial number(s)</p>
                  </div>
                  <div className="qan-actions">
                    <Link className="text-link" to={`/admin/qans/${qan._id}`}>
                      Manage serials
                    </Link>
                    <button type="button" className="ghost-btn" onClick={() => toggleActive(qan)}>
                      {qan.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button type="button" className="danger-btn" onClick={() => handleDelete(qan._id)}>
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

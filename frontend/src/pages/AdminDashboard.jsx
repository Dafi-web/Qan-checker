import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, clearAuth, getStoredUser } from '../api';
import IvyLogo from '../components/IvyLogo';
import QanCheckPanel from '../components/QanCheckPanel';
import SiteFooter from '../components/SiteFooter';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [tab, setTab] = useState('check');
  const [qans, setQans] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsReady, setStatsReady] = useState(false);
  const [error, setError] = useState('');
  const [qanSearch, setQanSearch] = useState('');
  const [appliedQanSearch, setAppliedQanSearch] = useState('');
  const [form, setForm] = useState({
    qanNumber: '',
    title: '',
    description: '',
    serialNumbers: '',
  });
  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    role: 'shipper',
  });
  const [saving, setSaving] = useState(false);

  const activeCheckQans = useMemo(
    () =>
      qans
        .filter((q) => q.active)
        .map((q) => ({
          id: q._id,
          qanNumber: q.qanNumber,
          title: q.title,
        })),
    [qans]
  );

  const filteredManageQans = useMemo(() => {
    const q = appliedQanSearch.trim().toUpperCase();
    if (!q) return qans;
    return qans.filter((qan) => {
      const number = String(qan.qanNumber || '').toUpperCase();
      const title = String(qan.title || '').toUpperCase();
      const description = String(qan.description || '').toUpperCase();
      return number.includes(q) || title.includes(q) || description.includes(q);
    });
  }, [qans, appliedQanSearch]);

  async function loadQans() {
    setLoading(true);
    setError('');
    try {
      setQans(await api.listQans());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadUsers() {
    setLoading(true);
    setError('');
    try {
      setUsers(await api.listUsers());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    Promise.all([api.listQans(), api.listUsers()])
      .then(([qanData, userData]) => {
        setQans(qanData);
        setUsers(userData);
      })
      .catch((err) => setError(err.message))
      .finally(() => {
        setLoading(false);
        setStatsReady(true);
      });
  }, []);

  useEffect(() => {
    if (!statsReady) return;
    if (tab === 'access') loadUsers();
    else loadQans();
  }, [tab]);

  function logout() {
    clearAuth();
    navigate('/login');
  }

  function handleSearchManageQans(e) {
    e.preventDefault();
    setAppliedQanSearch(qanSearch);
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

  async function handleCreateUser(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.createUser(userForm);
      setUserForm({ username: '', password: '', role: 'shipper' });
      await loadUsers();
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

  async function handleDeleteUser(id) {
    if (!window.confirm('Revoke access and delete this account?')) return;
    try {
      await api.deleteUser(id);
      await loadUsers();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleUserRole(u) {
    const nextRole = u.role === 'admin' ? 'shipper' : 'admin';
    try {
      await api.updateUser(u._id || u.id, { role: nextRole });
      await loadUsers();
    } catch (err) {
      setError(err.message);
    }
  }

  const shipperCount = users.filter((u) => u.role === 'shipper').length;
  const activeQans = qans.filter((q) => q.active).length;

  return (
    <div className="page admin-page">
      <header className="topbar">
        <IvyLogo to="/admin" size="md" />
        <div className="topbar-actions">
          <span className="user-chip">{user?.username}</span>
          <button type="button" className="ghost-btn" onClick={logout}>
            Sign out
          </button>
        </div>
      </header>

      <main className="admin-main">
        <section className="admin-intro">
          <p className="eyebrow">Administrator</p>
          <h1>Admin page</h1>
          <p className="lede">
            Check serials against QANs, manage Quality Alert Notices, and grant shipper access.
          </p>
          <div className="admin-stats">
            <div className="stat-card">
              <strong>{qans.length}</strong>
              <span>QANs</span>
            </div>
            <div className="stat-card">
              <strong>{activeQans}</strong>
              <span>Active</span>
            </div>
            <div className="stat-card">
              <strong>{statsReady ? users.length : '—'}</strong>
              <span>Accounts</span>
            </div>
          </div>
        </section>

        <div className="tab-row">
          <button
            type="button"
            className={tab === 'check' ? 'filter-active' : 'ghost-btn'}
            onClick={() => setTab('check')}
          >
            Check QAN
          </button>
          <button
            type="button"
            className={tab === 'qans' ? 'filter-active' : 'ghost-btn'}
            onClick={() => setTab('qans')}
          >
            Manage QANs
          </button>
          <button
            type="button"
            className={tab === 'access' ? 'filter-active' : 'ghost-btn'}
            onClick={() => setTab('access')}
          >
            User access
          </button>
        </div>

        {error && <p className="form-error">{error}</p>}

        {tab === 'check' && (
          <section className="panel">
            <h2>Check QAN</h2>
            <p className="panel-note">
              Search for a QAN, select it, then paste serial numbers to see if units are on hold.
            </p>
            {loading && !statsReady ? (
              <p className="muted">Loading…</p>
            ) : (
              <QanCheckPanel qans={activeCheckQans} qansLoading={loading} />
            )}
          </section>
        )}

        {tab === 'qans' && (
          <>
            <section className="panel">
              <h2>Add new QAN</h2>
              <p className="panel-note">
                Attach the serial numbers that must not ship. Shippers will select this QAN on the
                home page.
              </p>
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

                <label htmlFor="serialNumbers">Affected serial numbers (max 11 digits each)</label>
                <textarea
                  id="serialNumbers"
                  rows={6}
                  value={form.serialNumbers}
                  onChange={(e) => setForm({ ...form, serialNumbers: e.target.value })}
                  placeholder={'12345678901\n12345678902'}
                />
                <p className="field-hint">
                  Up to 11 digits per serial. Paste continuous digits and they will be split every
                  11.
                </p>

                <button type="submit" disabled={saving}>
                  {saving ? 'Saving…' : 'Create QAN'}
                </button>
              </form>
            </section>

            <section className="panel">
              <div className="panel-head">
                <h2>All QANs</h2>
                <button type="button" className="ghost-btn" onClick={loadQans}>
                  Refresh
                </button>
              </div>

              <form className="qan-search-row manage-search" onSubmit={handleSearchManageQans}>
                <input
                  type="search"
                  value={qanSearch}
                  onChange={(e) => setQanSearch(e.target.value)}
                  placeholder="Search QAN number or title…"
                  aria-label="Search QANs"
                />
                <button type="submit" className="ghost-btn">
                  Search
                </button>
                {(qanSearch || appliedQanSearch) && (
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => {
                      setQanSearch('');
                      setAppliedQanSearch('');
                    }}
                  >
                    Clear
                  </button>
                )}
              </form>
              {appliedQanSearch && (
                <p className="field-hint">
                  Showing {filteredManageQans.length} of {qans.length} QAN
                  {qans.length === 1 ? '' : 's'} matching “{appliedQanSearch}”.
                </p>
              )}

              {loading ? (
                <p className="muted">Loading…</p>
              ) : qans.length === 0 ? (
                <p className="muted">No QANs yet. Create one above.</p>
              ) : filteredManageQans.length === 0 ? (
                <p className="muted">No QANs match your search.</p>
              ) : (
                <ul className="qan-list">
                  {filteredManageQans.map((qan) => (
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
                          Edit / serials
                        </Link>
                        <button type="button" className="ghost-btn" onClick={() => toggleActive(qan)}>
                          {qan.active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          type="button"
                          className="danger-btn"
                          onClick={() => handleDelete(qan._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}

        {tab === 'access' && (
          <>
            <section className="panel">
              <h2>Grant access</h2>
              <p className="panel-note">
                Create accounts for shippers so they can sign in and check serials on the home page.
                Admins can manage QANs and access.
              </p>
              <form className="admin-form" onSubmit={handleCreateUser}>
                <div className="grid-2">
                  <div>
                    <label htmlFor="newUsername">Username</label>
                    <input
                      id="newUsername"
                      required
                      value={userForm.username}
                      onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                      placeholder="shipper1"
                    />
                  </div>
                  <div>
                    <label htmlFor="newRole">Access level</label>
                    <select
                      id="newRole"
                      value={userForm.role}
                      onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                    >
                      <option value="shipper">Shipper — check serials only</option>
                      <option value="admin">Admin — full control</option>
                    </select>
                  </div>
                </div>

                <label htmlFor="newPassword">Temporary password</label>
                <input
                  id="newPassword"
                  type="password"
                  required
                  minLength={6}
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder="At least 6 characters"
                />

                <button type="submit" disabled={saving}>
                  {saving ? 'Creating…' : 'Grant access'}
                </button>
              </form>
            </section>

            <section className="panel">
              <div className="panel-head">
                <h2>People with access ({users.length})</h2>
                <button type="button" className="ghost-btn" onClick={loadUsers}>
                  Refresh
                </button>
              </div>
              {!loading && (
                <p className="panel-note">
                  {shipperCount} shipper{shipperCount === 1 ? '' : 's'} can use the home page checker.
                </p>
              )}

              {loading ? (
                <p className="muted">Loading…</p>
              ) : users.length === 0 ? (
                <p className="muted">No accounts yet.</p>
              ) : (
                <ul className="qan-list">
                  {users.map((u) => {
                    const id = u._id || u.id;
                    const isSelf = String(id) === String(user?.id || user?._id);
                    return (
                      <li key={id} className="qan-item">
                        <div>
                          <p className="qan-number">
                            {u.username}
                            <span className="badge">{u.role}</span>
                          </p>
                          <p className="muted">
                            {isSelf
                              ? 'Your account'
                              : u.role === 'admin'
                                ? 'Full admin access'
                                : 'Home page — serial checks only'}
                          </p>
                        </div>
                        <div className="qan-actions">
                          {!isSelf && (
                            <>
                              <button
                                type="button"
                                className="ghost-btn"
                                onClick={() => toggleUserRole(u)}
                              >
                                {u.role === 'admin' ? 'Make shipper' : 'Make admin'}
                              </button>
                              <button
                                type="button"
                                className="danger-btn"
                                onClick={() => handleDeleteUser(id)}
                              >
                                Revoke
                              </button>
                            </>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

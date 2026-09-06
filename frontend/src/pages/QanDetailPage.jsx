import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, clearAuth } from '../api';
import IvyLogo from '../components/IvyLogo';
import SiteFooter from '../components/SiteFooter';

export default function QanDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [qan, setQan] = useState(null);
  const [editForm, setEditForm] = useState({
    qanNumber: '',
    title: '',
    description: '',
    active: true,
  });
  const [serialText, setSerialText] = useState('');
  const [serialFilter, setSerialFilter] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingQan, setSavingQan] = useState(false);
  const [savingSerials, setSavingSerials] = useState(false);
  const [removingSerial, setRemovingSerial] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await api.getQan(id);
      setQan(data);
      setEditForm({
        qanNumber: data.qanNumber || '',
        title: data.title || '',
        description: data.description || '',
        active: data.active !== false,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  const filteredSerials = useMemo(() => {
    if (!qan?.serialNumbers) return [];
    const query = serialFilter.trim().toUpperCase();
    if (!query) return qan.serialNumbers;
    return qan.serialNumbers.filter((serial) =>
      String(serial).toUpperCase().includes(query)
    );
  }, [qan, serialFilter]);

  async function handleSaveQan(e) {
    e.preventDefault();
    setSavingQan(true);
    setError('');
    setSuccess('');
    try {
      const updated = await api.updateQan(id, editForm);
      setQan(updated);
      setEditForm({
        qanNumber: updated.qanNumber || '',
        title: updated.title || '',
        description: updated.description || '',
        active: updated.active !== false,
      });
      setSuccess('QAN details saved.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingQan(false);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    setSavingSerials(true);
    setError('');
    setSuccess('');
    try {
      const data = await api.addSerials(id, serialText);
      setQan(data.qan);
      setSerialText('');
      setSuccess(
        data.added === 0
          ? 'No new serials added (all were already listed).'
          : `Added ${data.added} serial number(s). Total: ${data.total}.`
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingSerials(false);
    }
  }

  async function handleRemove(serial) {
    if (!window.confirm(`Remove serial ${serial} from this QAN?`)) return;
    setRemovingSerial(serial);
    setError('');
    setSuccess('');
    try {
      const data = await api.removeSerial(id, serial);
      setQan(data);
      setSuccess(`Removed ${serial}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setRemovingSerial('');
    }
  }

  function logout() {
    clearAuth();
    navigate('/login');
  }

  return (
    <div className="page admin-page">
      <header className="topbar">
        <IvyLogo to="/admin" size="md" />
        <div className="topbar-actions">
          <Link className="topbar-link" to="/admin">
            Admin page
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
              <p className="eyebrow">Edit QAN</p>
              <h1>{qan.qanNumber}</h1>
              <p className="lede">
                Update QAN details, add or remove affected serials, and review the full hold list.
              </p>
            </section>

            {error && <p className="form-error">{error}</p>}
            {success && <p className="form-success">{success}</p>}

            <section className="panel">
              <h2>QAN details</h2>
              <p className="panel-note">Change the number, title, notes, or active status.</p>
              <form className="admin-form" onSubmit={handleSaveQan}>
                <div className="grid-2">
                  <div>
                    <label htmlFor="editQanNumber">QAN number</label>
                    <input
                      id="editQanNumber"
                      required
                      value={editForm.qanNumber}
                      onChange={(e) =>
                        setEditForm({ ...editForm, qanNumber: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label htmlFor="editTitle">Title</label>
                    <input
                      id="editTitle"
                      required
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    />
                  </div>
                </div>

                <label htmlFor="editDescription">Notes (optional)</label>
                <input
                  id="editDescription"
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                />

                <label className="checkbox-row" htmlFor="editActive">
                  <input
                    id="editActive"
                    type="checkbox"
                    checked={editForm.active}
                    onChange={(e) =>
                      setEditForm({ ...editForm, active: e.target.checked })
                    }
                  />
                  <span>Active — shippers can check against this QAN</span>
                </label>

                <button type="submit" disabled={savingQan}>
                  {savingQan ? 'Saving…' : 'Save QAN changes'}
                </button>
              </form>
            </section>

            <section className="panel">
              <h2>Add affected serials</h2>
              <p className="panel-note">
                Paste new serial numbers to add to this QAN. Existing ones are skipped.
              </p>
              <form className="admin-form" onSubmit={handleAdd}>
                <label htmlFor="moreSerials">Serial numbers (one per line, or paste digits)</label>
                <textarea
                  id="moreSerials"
                  rows={5}
                  value={serialText}
                  onChange={(e) => setSerialText(e.target.value)}
                  placeholder={'12345678901\n12345678902'}
                  required
                />
                <p className="field-hint">
                  Up to 11 digits per serial. Continuous digits are split every 11.
                </p>
                <button type="submit" disabled={savingSerials}>
                  {savingSerials ? 'Adding…' : 'Add serials'}
                </button>
              </form>
            </section>

            <section className="panel">
              <div className="panel-head">
                <h2>Affected serials ({qan.serialNumbers.length})</h2>
              </div>
              <p className="panel-note">
                Units on this list must not ship — send them back to CM.
              </p>

              {qan.serialNumbers.length === 0 ? (
                <p className="muted">No serial numbers on this QAN yet.</p>
              ) : (
                <>
                  <label htmlFor="serialFilter">Search serials</label>
                  <input
                    id="serialFilter"
                    className="serial-filter"
                    value={serialFilter}
                    onChange={(e) => setSerialFilter(e.target.value)}
                    placeholder="Type to filter…"
                    autoComplete="off"
                  />
                  {filteredSerials.length === 0 ? (
                    <p className="muted">No serials match “{serialFilter}”.</p>
                  ) : (
                    <ul className="serial-list">
                      {filteredSerials.map((serial) => (
                        <li key={serial}>
                          <code>{serial}</code>
                          <button
                            type="button"
                            className="danger-btn"
                            disabled={removingSerial === serial}
                            onClick={() => handleRemove(serial)}
                          >
                            {removingSerial === serial ? 'Removing…' : 'Remove'}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </section>
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, clearAuth, getStoredUser, isLoggedIn } from '../api';
import IvyLogo from '../components/IvyLogo';
import QanCheckPanel from '../components/QanCheckPanel';
import SiteFooter from '../components/SiteFooter';

export default function ShipperHome() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const loggedIn = isLoggedIn() && user?.role === 'shipper';

  const [qans, setQans] = useState([]);
  const [qansLoading, setQansLoading] = useState(false);
  const [error, setError] = useState('');

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

  function logout() {
    clearAuth();
    navigate('/');
  }

  return (
    <div className="page shipper-home">
      <header className="topbar topbar-shipper">
        <IvyLogo to="/" size="md" />
        <div className="topbar-actions">
          {loggedIn ? (
            <>
              <span className="user-chip">{user.username}</span>
              <button type="button" className="ghost-btn" onClick={logout}>
                Sign out
              </button>
            </>
          ) : (
            <Link className="topbar-cta" to="/login">
              Sign in
            </Link>
          )}
        </div>
      </header>

      <main className="shipper-main">
        <section className="home-hero">
          <p className="home-kicker">Ivy Technology</p>
          <h1>Which QAN do you want to check?</h1>
          <p className="lede">Search and select a Quality Alert Notice, then paste serials to check.</p>
        </section>

        {!loggedIn ? (
          <section className="shipper-panel welcome-panel">
            <h2>How it works</h2>
            <p className="lede welcome-lede">
              Sign in with the shipper account from your administrator, search the QAN, and check.
            </p>
            <div className="trust-row">
              <div className="trust-item">
                <strong>Search</strong>
                <span>Find the QAN you need quickly</span>
              </div>
              <div className="trust-item">
                <strong>Paste</strong>
                <span>Enter the serial numbers</span>
              </div>
              <div className="trust-item">
                <strong>Check</strong>
                <span>Hold and send back, or good to ship</span>
              </div>
            </div>
            <ol className="welcome-steps">
              <li>
                <span className="step-num">1</span>
                <span>Sign in</span>
              </li>
              <li>
                <span className="step-num">2</span>
                <span>Search and select the QAN</span>
              </li>
              <li>
                <span className="step-num">3</span>
                <span>Paste serials and check</span>
              </li>
            </ol>
            <Link className="primary-link-btn" to="/login">
              Sign in to check
            </Link>
          </section>
        ) : (
          <section className="shipper-panel">
            {error && <p className="form-error">{error}</p>}
            <QanCheckPanel qans={qans} qansLoading={qansLoading} />
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

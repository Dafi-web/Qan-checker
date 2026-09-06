import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { api, getStoredUser, isLoggedIn, setAuth } from '../api';
import IvyLogo from '../components/IvyLogo';
import SiteFooter from '../components/SiteFooter';

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isLoggedIn()) {
    const role = getStoredUser()?.role;
    return <Navigate to={role === 'admin' ? '/admin' : '/'} replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.login(username, password);
      setAuth(data.token, data.user);
      navigate(data.user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page auth-page">
      <header className="topbar topbar-shipper">
        <IvyLogo to="/" size="md" />
      </header>

      <main className="auth-main">
        <div className="auth-layout">
          <aside className="auth-aside">
            <p className="eyebrow">Secure access</p>
            <h1>Sign in to check serials.</h1>
            <p>
              Select which QAN you want to check, paste the serials, and review the result.
            </p>
          </aside>
          <form className="auth-card" onSubmit={handleSubmit}>
          <IvyLogo to={null} size="lg" showProduct={false} />
          <h1>Sign in</h1>
          <p className="lede">Use the account issued by your administrator.</p>

          <label htmlFor="username">Username</label>
          <input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            placeholder="Username"
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="Password"
            required
          />

          {error && <p className="form-error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Continue'}
          </button>

          <p className="auth-back">
            <Link className="text-link" to="/">
              ← Back to home
            </Link>
          </p>
          </form>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

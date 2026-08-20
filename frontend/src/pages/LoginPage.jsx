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
        <form className="auth-card" onSubmit={handleSubmit}>
          <IvyLogo to={null} size="lg" />
          <h1>Sign in</h1>
          <p className="lede">Shippers check serials. Admins manage QANs and access.</p>

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
      </main>

      <SiteFooter />
    </div>
  );
}

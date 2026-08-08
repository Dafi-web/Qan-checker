import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api, clearAuth, getStoredUser, isLoggedIn } from './api';

export default function ProtectedRoute({ children, adminOnly = false, shipperOnly = false }) {
  const [status, setStatus] = useState(() => (isLoggedIn() ? 'checking' : 'anon'));

  useEffect(() => {
    if (!isLoggedIn()) {
      setStatus('anon');
      return;
    }

    let cancelled = false;
    api
      .me()
      .then((data) => {
        if (cancelled) return;
        const role = data.user?.role || getStoredUser()?.role;

        if (adminOnly && role !== 'admin') {
          setStatus('shipper-home');
          return;
        }

        if (shipperOnly && role === 'admin') {
          setStatus('admin-home');
          return;
        }

        setStatus('ok');
      })
      .catch(() => {
        if (cancelled) return;
        clearAuth();
        setStatus('anon');
      });

    return () => {
      cancelled = true;
    };
  }, [adminOnly, shipperOnly]);

  if (status === 'checking') {
    return (
      <div className="page">
        <main className="auth-main">
          <p className="muted">Checking session…</p>
        </main>
      </div>
    );
  }

  if (status === 'anon') {
    return <Navigate to="/login" replace />;
  }

  if (status === 'shipper-home') {
    return <Navigate to="/" replace />;
  }

  if (status === 'admin-home') {
    return <Navigate to="/admin" replace />;
  }

  return children;
}

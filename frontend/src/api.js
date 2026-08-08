const API_BASE = '';

function getToken() {
  return localStorage.getItem('qan_token');
}

export function setAuth(token, user) {
  localStorage.setItem('qan_token', token);
  localStorage.setItem('qan_user', JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem('qan_token');
  localStorage.removeItem('qan_user');
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('qan_user') || 'null');
  } catch {
    return null;
  }
}

export function isLoggedIn() {
  return Boolean(getToken());
}

export function isAdmin() {
  return getStoredUser()?.role === 'admin';
}

function redirectToLogin() {
  clearAuth();
  if (window.location.pathname !== '/login') {
    window.location.assign('/login');
  }
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (res.status === 401 && !path.includes('/api/auth/login')) {
    redirectToLogin();
    throw new Error(data.message || 'Please sign in again');
  }

  if (!res.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
}

export const api = {
  login: (username, password) =>
    request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  me: () => request('/api/auth/me'),
  checkSerials: (serialNumbers, qanId) =>
    request('/api/check', {
      method: 'POST',
      body: JSON.stringify({ serialNumbers, qanId: qanId || 'all' }),
    }),
  listActiveQans: () => request('/api/check/qans'),
  listQans: () => request('/api/qans'),
  getQan: (id) => request(`/api/qans/${id}`),
  createQan: (payload) =>
    request('/api/qans', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateQan: (id, payload) =>
    request(`/api/qans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  addSerials: (id, serialNumbers) =>
    request(`/api/qans/${id}/serials`, {
      method: 'POST',
      body: JSON.stringify({ serialNumbers }),
    }),
  removeSerial: (id, serial) =>
    request(`/api/qans/${id}/serials/${encodeURIComponent(serial)}`, {
      method: 'DELETE',
    }),
  deleteQan: (id) =>
    request(`/api/qans/${id}`, {
      method: 'DELETE',
    }),
  listUsers: () => request('/api/users'),
  createUser: (payload) =>
    request('/api/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateUser: (id, payload) =>
    request(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteUser: (id) =>
    request(`/api/users/${id}`, {
      method: 'DELETE',
    }),
};

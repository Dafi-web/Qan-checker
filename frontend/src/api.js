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
  checkSerial: (serialNumber) =>
    request('/api/check', {
      method: 'POST',
      body: JSON.stringify({ serialNumber }),
    }),
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
};

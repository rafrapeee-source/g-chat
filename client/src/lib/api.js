const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // no JSON body
  }

  if (!res.ok) {
    const message = data?.error || `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  return data;
}

export const api = {
  signup: (name, email, password) => request('/auth/signup', { method: 'POST', body: { name, email, password } }),
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  me: (token) => request('/auth/me', { token }),

  searchUsers: (token, q) => request(`/users?q=${encodeURIComponent(q || '')}`, { token }),

  listSpaces: (token) => request('/spaces', { token }),
  createSpace: (token, { name, description, memberIds }) =>
    request('/spaces', { method: 'POST', body: { name, description, memberIds }, token }),
  startDM: (token, userId) => request('/spaces/dm', { method: 'POST', body: { userId }, token }),
  addMember: (token, spaceId, userId) =>
    request(`/spaces/${spaceId}/members`, { method: 'POST', body: { userId }, token }),
  getMessages: (token, spaceId, before) =>
    request(`/spaces/${spaceId}/messages${before ? `?before=${before}` : ''}`, { token }),
};

export { API_URL };

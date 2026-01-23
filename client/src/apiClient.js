import { useAuthStore } from './store';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

export async function apiRequest(path, { method = 'GET', body, token } = {}) {
  const actualToken = token ?? useAuthStore.getState().token;
  const headers = { 'Content-Type': 'application/json' };
  if (actualToken) headers.Authorization = `Bearer ${actualToken}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message || 'Request failed');
  }

  return res.json();
}

import { request } from './http';

export const register = (body) =>
  request('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

export const login = (body) =>
  request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

export const logout = () => request('/api/auth/logout', { method: 'POST' });

export const me = () => request('/api/auth/me');

export const changePassword = (body) =>
  request('/api/auth/password', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

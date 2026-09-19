import { request } from './http';

export function listSessions() {
  return request('/api/sessions');
}

export function getSession(id) {
  return request(`/api/sessions/${id}`);
}

export function createSession(body = {}) {
  return request('/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function saveSession(id, payload) {
  return request(`/api/sessions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function deleteSession(id) {
  return request(`/api/sessions/${id}`, { method: 'DELETE' });
}

export function uploadFile(id, file) {
  const body = new FormData();
  body.append('file', file);
  return request(`/api/sessions/${id}/files`, { method: 'POST', body });
}

export function generateSession(id) {
  return request(`/api/sessions/${id}/generate`, { method: 'POST' });
}

export function regenerateSession(id) {
  return request(`/api/sessions/${id}/regenerate`, { method: 'POST' });
}

export async function downloadCsv(id, title) {
  const res = await fetch(`/api/sessions/${id}/export.csv`, { credentials: 'include' });
  if (!res.ok) throw new Error('Export failed.');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(title || 'test-cases').replace(/\W+/g, '_')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export { stepPath } from './steps';

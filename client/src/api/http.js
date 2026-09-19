export async function request(path, options = {}) {
  const res = await fetch(path, { credentials: 'include', ...options });
  if (options.raw) return res;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Request failed.');
  }
  return data;
}

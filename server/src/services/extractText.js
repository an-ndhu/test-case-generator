const ALLOWED = new Set(['.txt', '.md']);

export function extractText(file) {
  if (!file) return '';

  const name = (file.originalname || '').toLowerCase();
  const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')) : '';

  if (!ALLOWED.has(ext)) {
    const err = new Error('Please attach a .txt or .md file.');
    err.status = 400;
    throw err;
  }

  const text = file.buffer.toString('utf8').trim();
  if (!text) {
    const err = new Error('The attached file is empty.');
    err.status = 400;
    throw err;
  }

  return text;
}

const TXT_MD = /\.(txt|md)$/i;

export const TXT_MD_ACCEPT = '.txt,.md,text/plain,text/markdown';

export function isTxtOrMd(file) {
  if (!file) return false;
  const name = String(file.name || '').toLowerCase();
  if (TXT_MD.test(name)) return true;
  return file.type === 'text/plain' || file.type === 'text/markdown';
}

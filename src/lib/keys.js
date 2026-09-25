import crypto from 'node:crypto';

// No look-alike characters (0/O, 1/I/L)
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function randomCode(length = 5) {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += ALPHABET[crypto.randomInt(ALPHABET.length)];
  }
  return out;
}

// 'navegaid-beauty' -> 'NAVEGAID'
export function prefixFromThemeId(themeId) {
  const first = String(themeId).split('-')[0].toUpperCase().replace(/[^A-Z0-9]/g, '');
  return first.slice(0, 12) || 'THEME';
}

// e.g. NAVEGAID-3456789012-K7Q2M
export function buildLicenseCode(themeId, orderId) {
  return `${prefixFromThemeId(themeId)}-${orderId}-${randomCode(5)}`;
}

export function normalizeCode(code) {
  return String(code ?? '').trim().toUpperCase();
}

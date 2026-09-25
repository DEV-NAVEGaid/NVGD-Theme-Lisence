import { query } from '../db.js';
import { HttpError } from '../lib/errors.js';
import { buildLicenseCode, normalizeCode } from '../lib/keys.js';
import { normalizeShop } from '../lib/shop.js';

const FIELDS = `license_code, order_id, email, theme_id, store_id, status, note,
                created_at, activated_at, last_checked_at`;

function cleanThemeId(value) {
  const themeId = String(value ?? '').trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{1,59}$/.test(themeId)) {
    throw new HttpError(400, 'invalid_theme_id', 'theme_id: 2-60 lowercase letters, numbers or dashes');
  }
  return themeId;
}

function cleanOrderId(value) {
  const orderId = String(value ?? '').trim().replace(/^#/, '');
  if (!/^[A-Za-z0-9-]{3,40}$/.test(orderId)) {
    throw new HttpError(400, 'invalid_order_id', 'order_id is required (3-40 letters, numbers or dashes)');
  }
  return orderId;
}

function cleanEmail(value) {
  if (value === undefined || value === null || String(value).trim() === '') return null;
  const email = String(value).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) {
    throw new HttpError(400, 'invalid_email', 'email is not a valid address');
  }
  return email;
}

// Admin creates a code and sends it to the merchant.
export async function createLicense({ themeId, orderId, email, note }) {
  const theme = cleanThemeId(themeId);
  const order = cleanOrderId(orderId);
  const buyerEmail = cleanEmail(email);

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = buildLicenseCode(theme, order);
    const { rows } = await query(
      `INSERT INTO licenses (license_code, order_id, email, theme_id, note)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (license_code) DO NOTHING
       RETURNING ${FIELDS}`,
      [code, order, buyerEmail, theme, note ? String(note).trim() : null]
    );
    if (rows[0]) return rows[0];
  }
  throw new Error('Could not generate a unique license code');
}

// Called by the theme: is this code allowed on this store?
export async function verifyLicense({ licenseCode, shop, theme }) {
  const code = normalizeCode(licenseCode);
  const storeId = normalizeShop(shop);
  const themeId = theme ? String(theme).trim().toLowerCase() : null;

  if (!code) return { valid: false, reason: 'missing_key' };
  if (!storeId) return { valid: false, reason: 'invalid_shop' };

  const { rows } = await query(
    'SELECT id, theme_id, status, store_id, last_checked_at FROM licenses WHERE license_code = $1',
    [code]
  );
  const license = rows[0];
  if (!license) return { valid: false, reason: 'not_found' };
  if (themeId && license.theme_id !== themeId) return { valid: false, reason: 'wrong_theme' };
  if (license.status !== 'active') return { valid: false, reason: 'revoked' };

  // First use: lock the code to this store
  if (!license.store_id) {
    const activated = await query(
      `UPDATE licenses
       SET store_id = $2, activated_at = NOW(), last_checked_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND store_id IS NULL
       RETURNING id`,
      [license.id, storeId]
    );
    if (activated.rows[0]) return { valid: true, activated: true };
    const again = await query('SELECT store_id FROM licenses WHERE id = $1', [license.id]);
    license.store_id = again.rows[0]?.store_id;
  }

  if (license.store_id === storeId) {
    const last = license.last_checked_at ? new Date(license.last_checked_at).getTime() : 0;
    if (Date.now() - last > 60 * 60 * 1000) {
      await query('UPDATE licenses SET last_checked_at = NOW() WHERE id = $1', [license.id]);
    }
    return { valid: true };
  }

  return { valid: false, reason: 'wrong_shop' };
}

export async function listLicenses({ q, status, theme, limit = 50, offset = 0 }) {
  const { rows } = await query(
    `SELECT ${FIELDS} FROM licenses
     WHERE ($1 = '' OR license_code ILIKE '%' || $1 || '%'
                   OR order_id ILIKE '%' || $1 || '%'
                   OR store_id ILIKE '%' || $1 || '%'
                   OR email ILIKE '%' || $1 || '%')
       AND ($2::text IS NULL OR status = $2)
       AND ($3::text IS NULL OR theme_id = $3)
     ORDER BY created_at DESC
     LIMIT $4 OFFSET $5`,
    [String(q ?? '').trim(), status || null, theme ? String(theme).toLowerCase() : null,
     Math.min(Number(limit) || 50, 200), Math.max(Number(offset) || 0, 0)]
  );
  return rows;
}

export async function getLicense(code) {
  const { rows } = await query(`SELECT ${FIELDS} FROM licenses WHERE license_code = $1`, [
    normalizeCode(code),
  ]);
  if (!rows[0]) throw new HttpError(404, 'license_not_found', 'License not found');
  return rows[0];
}

// Merchant moved to another store
export async function resetLicense(code) {
  await getLicense(code);
  const { rows } = await query(
    `UPDATE licenses SET store_id = NULL, activated_at = NULL, updated_at = NOW()
     WHERE license_code = $1 RETURNING ${FIELDS}`,
    [normalizeCode(code)]
  );
  return rows[0];
}

export async function setStatus(code, status) {
  await getLicense(code);
  const { rows } = await query(
    `UPDATE licenses SET status = $2, updated_at = NOW()
     WHERE license_code = $1 RETURNING ${FIELDS}`,
    [normalizeCode(code), status]
  );
  return rows[0];
}

export async function listThemes() {
  const { rows } = await query(
    `SELECT theme_id, COUNT(*)::int AS codes FROM licenses GROUP BY theme_id ORDER BY theme_id`
  );
  return rows;
}

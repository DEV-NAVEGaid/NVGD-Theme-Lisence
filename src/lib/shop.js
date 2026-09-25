// Returns "store.myshopify.com", or null if not a myshopify domain.
export function normalizeShop(value) {
  const shop = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '');
  return /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(shop) ? shop : null;
}

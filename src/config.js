import dotenv from 'dotenv';

dotenv.config({ quiet: true });

function required(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required env variable ${name} (see .env.example)`);
  }
  return value.trim();
}

function parseTrustProxy(value) {
  if (value === undefined || value === '') return 1;
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^\d+$/.test(value)) return Number(value);
  return value;
}

function list(value) {
  return (value || '').split(',').map((s) => s.trim().replace(/\/$/, '')).filter(Boolean);
}

export const config = {
  port: Number(process.env.PORT || 3000),
  databaseUrl: required('DATABASE_URL'),
  adminToken: required('ADMIN_TOKEN'),
  trustProxy: parseTrustProxy(process.env.TRUST_PROXY),
  // Websites allowed to call /api/admin/* (the admin page). Empty = any origin.
  adminAllowedOrigins: list(process.env.ADMIN_ALLOWED_ORIGINS),
};

if (config.adminToken.length < 24) {
  throw new Error('ADMIN_TOKEN must be at least 24 characters. Generate one with: openssl rand -hex 32');
}

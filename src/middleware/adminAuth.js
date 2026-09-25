import crypto from 'node:crypto';
import { config } from '../config.js';
import { HttpError } from '../lib/errors.js';

export function isValidAdminToken(token) {
  if (!token) return false;
  const a = crypto.createHash('sha256').update(String(token)).digest();
  const b = crypto.createHash('sha256').update(config.adminToken).digest();
  return crypto.timingSafeEqual(a, b);
}

// Requires header: Authorization: Bearer <ADMIN_TOKEN>
export function adminAuth(req, _res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!isValidAdminToken(token)) {
    return next(new HttpError(401, 'unauthorized', 'Admin token is missing or wrong'));
  }
  next();
}

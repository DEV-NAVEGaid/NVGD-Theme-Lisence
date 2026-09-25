import { rateLimit } from 'express-rate-limit';

function limiter(windowMs, limit) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'rate_limited', message: 'Too many requests. Please try again later.' },
  });
}

export const verifyLimiter = limiter(60 * 1000, 60);
export const adminLimiter = limiter(60 * 1000, 120);

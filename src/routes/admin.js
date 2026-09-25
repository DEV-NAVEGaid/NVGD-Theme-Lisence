import cors from 'cors';
import { Router } from 'express';
import { config } from '../config.js';
import { adminAuth } from '../middleware/adminAuth.js';
import { adminLimiter } from '../middleware/rateLimits.js';
import {
  createLicense,
  getLicense,
  listLicenses,
  listThemes,
  resetLicense,
  setStatus,
} from '../services/licenses.js';

const router = Router();

// The admin page is hosted separately, so it needs CORS
const adminCors = cors({
  origin: config.adminAllowedOrigins.length ? config.adminAllowedOrigins : true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

router.use(adminCors);
router.options(/.*/, adminCors);
router.use(adminLimiter, adminAuth);

router.get('/licenses', async (req, res) => {
  const licenses = await listLicenses({
    q: req.query.q,
    status: req.query.status,
    theme: req.query.theme,
    limit: req.query.limit,
    offset: req.query.offset,
  });
  res.json({ licenses });
});

router.post('/licenses', async (req, res) => {
  const { theme_id: themeId, order_id: orderId, email, note } = req.body || {};
  res.status(201).json(await createLicense({ themeId, orderId, email, note }));
});

router.get('/licenses/:code', async (req, res) => {
  res.json(await getLicense(req.params.code));
});

// Merchant moved to another store: the next store that uses the code becomes the owner
router.post('/licenses/:code/reset', async (req, res) => {
  res.json(await resetLicense(req.params.code));
});

router.post('/licenses/:code/revoke', async (req, res) => {
  res.json(await setStatus(req.params.code, 'revoked'));
});

router.post('/licenses/:code/restore', async (req, res) => {
  res.json(await setStatus(req.params.code, 'active'));
});

router.get('/themes', async (_req, res) => {
  res.json({ themes: await listThemes() });
});

export default router;

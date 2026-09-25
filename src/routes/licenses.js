import cors from 'cors';
import { Router } from 'express';
import { verifyLimiter } from '../middleware/rateLimits.js';
import { verifyLicense } from '../services/licenses.js';

const router = Router();

// Called from any Shopify theme editor
const verifyCors = cors({ origin: '*', methods: ['POST'] });

router.options('/verify', verifyCors);
router.post('/verify', verifyCors, verifyLimiter, async (req, res) => {
  const { license_key: licenseKey, license_code: licenseCode, shop, theme } = req.body || {};
  res.json(await verifyLicense({ licenseCode: licenseCode || licenseKey, shop, theme }));
});

export default router;

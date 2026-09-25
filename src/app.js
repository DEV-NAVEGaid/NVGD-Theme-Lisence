import express from 'express';
import helmet from 'helmet';
import { config } from './config.js';
import { query } from './db.js';
import { HttpError } from './lib/errors.js';
import licenseRoutes from './routes/licenses.js';
import adminRoutes from './routes/admin.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', config.trustProxy);
  app.disable('x-powered-by');
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(express.json({ limit: '10kb' }));

  app.get('/health', async (_req, res) => {
    await query('SELECT 1');
    res.json({ ok: true });
  });

  app.use('/api/licenses', licenseRoutes);
  app.use('/api/admin', adminRoutes);

  app.use((_req, _res, next) => next(new HttpError(404, 'not_found', 'Endpoint not found')));

  app.use((err, _req, res, _next) => {
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'invalid_json', message: 'Request body is not valid JSON' });
    }
    if (err instanceof HttpError) {
      return res.status(err.status).json({ error: err.code, message: err.message });
    }
    console.error(err);
    res.status(500).json({ error: 'server_error', message: 'Something went wrong. Please try again.' });
  });

  return app;
}

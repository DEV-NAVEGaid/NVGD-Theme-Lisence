import { config } from './config.js';
import { pool } from './db.js';
import { createApp } from './app.js';

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`License server listening on port ${config.port}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
  });
}

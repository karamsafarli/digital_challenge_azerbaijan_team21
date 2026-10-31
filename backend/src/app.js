import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { prisma } from './db.js';
import { createApiRouter } from './routes/index.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1); // behind nginx in Docker: rate limit by real client IP
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', async (req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: 'ok', db: 'up', time: new Date().toISOString() });
    } catch {
      res.status(503).json({ status: 'degraded', db: 'down', time: new Date().toISOString() });
    }
  });

  app.use('/api', createApiRouter());

  app.use('/api', (req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'JSON formatı yanlışdır' });
    }
    const status = err.status || 500;
    if (status >= 500) console.error(err);
    return res.status(status).json({
      error: status >= 500 ? 'Daxili server xətası' : err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  });

  return app;
}

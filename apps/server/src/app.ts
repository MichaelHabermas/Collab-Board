import path from 'path';
import express from 'express';
import cors from 'cors';
import { authMiddleware } from './auth/auth.middleware';
import { healthRouter } from './routes/health.routes';

export const createApp = (): express.Express => {
  const app = express();

  app.use(
    cors({
      origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:5173',
      credentials: true,
    })
  );
  app.use(express.json());

  // API routes: auth required except /api/health
  app.use('/api', (req, res, next) => {
    if (req.path === '/health') {
      next();
      return;
    }
    authMiddleware(req, res, next);
  });
  app.use('/api', healthRouter);

  // In production, serve the client build
  if (process.env['NODE_ENV'] === 'production') {
    const clientDistPath = path.resolve(__dirname, '../../client/dist');
    app.use(express.static(clientDistPath));

    // SPA fallback — serve index.html for all non-API routes
    app.get('*', (_req, res) => {
      res.sendFile(path.join(clientDistPath, 'index.html'));
    });
  }

  return app;
};

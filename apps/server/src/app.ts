import path from 'path';
import express from 'express';
import cors from 'cors';
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

  // API routes
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

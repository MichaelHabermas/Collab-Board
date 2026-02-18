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

  // Allow Clerk inline styles and scripts; avoid default-src 'none' blocking injectGlobalStyles
  if (process.env['NODE_ENV'] === 'production') {
    app.use((_req, res, next) => {
      res.setHeader(
        'Content-Security-Policy',
        [
          "default-src 'self'",
          "style-src 'self' 'unsafe-inline'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://*.clerk.com",
          "worker-src 'self' blob:",
          "connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://clerk-telemetry.com wss: ws:",
          "frame-src 'self' https://*.clerk.accounts.dev https://*.clerk.com",
          "img-src 'self' data: https:",
          "font-src 'self' data:",
        ].join('; ')
      );
      next();
    });
  }

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

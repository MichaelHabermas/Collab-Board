import http from 'http';
import { Server } from 'socket.io';
import { createApp } from './app';
import { logger } from './shared/lib/logger';
import type { ClientToServerEvents, ServerToClientEvents } from '@collab-board/shared-types';

const PORT = Number(process.env['PORT'] ?? 3000);

const app = createApp();
const httpServer = http.createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:5173',
    credentials: true,
  },
});

io.on('connection', (socket) => {
  logger.info('Client connected', { socketId: socket.id });

  socket.on('disconnect', () => {
    logger.info('Client disconnected', { socketId: socket.id });
  });
});

httpServer.listen(PORT, () => {
  logger.info(`Server listening on port ${String(PORT)}`);
});

export { io };

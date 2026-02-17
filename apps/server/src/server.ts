import http from 'http';
import { Server } from 'socket.io';
import { createApp } from './app';
import { socketAuthMiddleware } from './auth/socket-auth';
import type { IAuthenticatedSocket } from './auth/socket-auth';
import { registerRoomHandlers } from './collaboration/room.handler';
import { registerCursorHandlers } from './collaboration/cursor.handler';
import { connectDatabase, disconnectDatabase } from './modules/board/db';
import { BoardRepository } from './modules/board/board.repo';
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

io.use(socketAuthMiddleware);

const boardRepo = new BoardRepository();

io.on('connection', (socket: IAuthenticatedSocket) => {
  const user = socket.data.user;
  logger.info('Client connected', { socketId: socket.id, userId: user?.userId });

  registerRoomHandlers(socket, boardRepo);
  registerCursorHandlers(socket);

  socket.on('disconnect', () => {
    const userId = socket.data.user?.userId;
    if (userId) {
      for (const room of socket.rooms) {
        if (room.startsWith('board:')) {
          io.to(room).emit('presence:leave', { userId });
        }
      }
    }
    logger.info('Client disconnected', { socketId: socket.id });
  });
});

let shutdownInProgress = false;

const shutdown = (): void => {
  if (shutdownInProgress) {
    return;
  }
  shutdownInProgress = true;
  disconnectDatabase()
    .then(() => {
      httpServer.close(() => {
        process.exit(0);
      });
    })
    .catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Shutdown error', { error: message });
      process.exit(1);
    });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

const main = async (): Promise<void> => {
  await connectDatabase();
  httpServer.listen(PORT, () => {
    logger.info(`Server listening on port ${String(PORT)}`);
  });
};

void main();

export { io };

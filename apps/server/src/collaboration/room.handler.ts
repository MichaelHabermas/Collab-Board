import type { Socket } from 'socket.io';
import { boardJoinSchema, boardLeaveSchema } from '../shared/validation/board.schemas';
import type { IAuthenticatedSocket } from '../auth/socket-auth';
import { logger } from '../shared/lib/logger';

const ROOM_PREFIX = 'board:';

function getRoomName(boardId: string): string {
  return `${ROOM_PREFIX}${boardId}`;
}

/**
 * Registers board:join and board:leave handlers. Joins socket to room board:${boardId}; on leave, socket leaves the room.
 */
export function registerRoomHandlers(socket: IAuthenticatedSocket): void {
  socket.on('board:join', (payload: unknown) => {
    const parsed = boardJoinSchema.safeParse(payload);
    if (!parsed.success) {
      logger.warn('Invalid board:join payload', {
        socketId: socket.id,
        error: parsed.error.flatten(),
      });
      return;
    }
    const { boardId } = parsed.data;
    const room = getRoomName(boardId);
    socket.join(room);
    (socket.data as Socket['data'] & { boardId?: string }).boardId = boardId;
    logger.info('Socket joined room', {
      socketId: socket.id,
      room,
      userId: socket.data.user?.userId,
    });
  });

  socket.on('board:leave', (payload: unknown) => {
    const parsed = boardLeaveSchema.safeParse(payload);
    if (!parsed.success) {
      return;
    }
    const { boardId } = parsed.data;
    const room = getRoomName(boardId);
    socket.leave(room);
    const data = socket.data as Socket['data'] & { boardId?: string };
    if (data.boardId === boardId) {
      data.boardId = undefined;
    }
  });
}

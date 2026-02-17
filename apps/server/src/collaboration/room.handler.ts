import type { Socket } from 'socket.io';
import { boardJoinSchema, boardLeaveSchema } from '../shared/validation/board.schemas';
import type { IAuthenticatedSocket } from '../auth/socket-auth';
import { logger } from '../shared/lib/logger';
import type { BoardRepository } from '../modules/board/board.repo';

const ROOM_PREFIX = 'board:';

/** MongoDB ObjectIds are 24 hex characters; avoid Cast errors for slugs like "default-board". */
const OBJECT_ID_HEX_LENGTH = 24;
const OBJECT_ID_REGEX = /^[a-f0-9]{24}$/i;

function getRoomName(boardId: string): string {
  return `${ROOM_PREFIX}${boardId}`;
}

function isValidObjectId(id: string): boolean {
  return id.length === OBJECT_ID_HEX_LENGTH && OBJECT_ID_REGEX.test(id);
}

/**
 * Registers board:join and board:leave handlers. Joins socket to room board:${boardId};
 * on join, loads board and objects from DB and emits board:load to the joining socket.
 */
export function registerRoomHandlers(
  socket: IAuthenticatedSocket,
  boardRepo: BoardRepository
): void {
  socket.on('board:join', async (payload: unknown) => {
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

    const fallbackBoard = {
      id: boardId,
      title: 'Untitled Board',
      ownerId: '',
      collaborators: [],
      createdAt: new Date(0).toISOString(),
      updatedAt: new Date(0).toISOString(),
    };

    if (!isValidObjectId(boardId)) {
      socket.emit('board:load', {
        board: fallbackBoard,
        objects: [],
        users: [],
      });
      return;
    }

    try {
      const [board, objects] = await Promise.all([
        boardRepo.findBoardById(boardId),
        boardRepo.findObjectsByBoard(boardId),
      ]);
      socket.emit('board:load', {
        board: board ?? fallbackBoard,
        objects,
        users: [],
      });
    } catch (err) {
      logger.warn('Board load failed, sending fallback', {
        socketId: socket.id,
        boardId,
        error: err instanceof Error ? err.message : String(err),
      });
      socket.emit('board:load', {
        board: fallbackBoard,
        objects: [],
        users: [],
      });
    }
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

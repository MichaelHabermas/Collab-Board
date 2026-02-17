import type { Server } from 'socket.io';
import type { IAuthenticatedSocket } from '../auth/socket-auth';
import {
  objectCreateSchema,
  objectMoveSchema,
  objectUpdatePayloadSchema,
} from '../shared/validation/board.schemas';
import { logger } from '../shared/lib/logger';
import type { BoardRepository } from '../modules/board/board.repo';
import type { BoardObject } from '@collab-board/shared-types';

const ROOM_PREFIX = 'board:';

function getRoomName(boardId: string): string {
  return `${ROOM_PREFIX}${boardId}`;
}

/**
 * Registers object:create handler. Validates payload, persists to MongoDB, broadcasts object:created to room.
 */
export function registerObjectHandlers(
  io: Server,
  socket: IAuthenticatedSocket,
  boardRepo: BoardRepository
): void {
  socket.on('object:create', async (payload: unknown) => {
    const parsed = objectCreateSchema.safeParse(payload);
    if (!parsed.success) {
      logger.warn('Invalid object:create payload', {
        socketId: socket.id,
        error: parsed.error.flatten(),
      });
      return;
    }
    const { boardId, object: inputObject } = parsed.data;
    const userId = socket.data.user?.userId;
    if (!userId) {
      return;
    }
    const room = getRoomName(boardId);
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const toCreate: BoardObject = {
      ...inputObject,
      id,
      boardId,
      createdBy: userId,
      updatedAt: now,
    } as BoardObject;
    try {
      const created = await boardRepo.createObject(toCreate);
      io.to(room).emit('object:created', { object: created });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error('object:create failed', { socketId: socket.id, error: message });
      socket.emit('error', { message: 'Failed to create object' });
    }
  });

  socket.on('object:move', async (payload: unknown) => {
    const parsed = objectMoveSchema.safeParse(payload);
    if (!parsed.success) {
      logger.warn('Invalid object:move payload', {
        socketId: socket.id,
        error: parsed.error.flatten(),
      });
      return;
    }
    const { boardId, objectId, x, y } = parsed.data;
    const userId = socket.data.user?.userId;
    if (!userId) {
      return;
    }
    const room = getRoomName(boardId);
    try {
      const updated = await boardRepo.updateObject(objectId, { x, y });
      if (updated) {
        io.to(room).emit('object:updated', { objectId, delta: { x, y }, updatedBy: userId });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error('object:move failed', { socketId: socket.id, error: message });
      socket.emit('error', { message: 'Failed to move object' });
    }
  });

  socket.on('object:update', async (payload: unknown) => {
    const parsed = objectUpdatePayloadSchema.safeParse(payload);
    if (!parsed.success) {
      logger.warn('Invalid object:update payload', {
        socketId: socket.id,
        error: parsed.error.flatten(),
      });
      return;
    }
    const { boardId, objectId, delta } = parsed.data;
    const userId = socket.data.user?.userId;
    if (!userId) {
      return;
    }
    const room = getRoomName(boardId);
    try {
      const updated = await boardRepo.updateObject(objectId, delta);
      if (updated) {
        io.to(room).emit('object:updated', { objectId, delta, updatedBy: userId });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error('object:update failed', { socketId: socket.id, error: message });
      socket.emit('error', { message: 'Failed to update object' });
    }
  });
}

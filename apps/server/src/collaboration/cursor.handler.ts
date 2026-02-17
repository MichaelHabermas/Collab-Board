import type { IAuthenticatedSocket } from '../auth/socket-auth';
import { cursorMoveSchema } from '../shared/validation/board.schemas';

const ROOM_PREFIX = 'board:';

function getBoardRoomFromSocket(socket: IAuthenticatedSocket): string | null {
  const rooms = Array.from(socket.rooms);
  return rooms.find((r) => r.startsWith(ROOM_PREFIX)) ?? null;
}

/**
 * Registers cursor:move handler. Broadcasts cursor:update to others in the same board room. No DB write.
 */
export function registerCursorHandlers(socket: IAuthenticatedSocket): void {
  socket.on('cursor:move', (payload: unknown) => {
    const parsed = cursorMoveSchema.safeParse(payload);
    if (!parsed.success) return;
    const { x, y } = parsed.data;
    const userId = socket.data.user?.userId;
    if (!userId) return;
    const room = getBoardRoomFromSocket(socket);
    if (!room) return;
    socket.to(room).emit('cursor:update', { userId, x, y });
  });
}

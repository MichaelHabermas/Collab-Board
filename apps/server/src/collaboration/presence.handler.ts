import type { Server } from 'socket.io';
import type { UserPresence } from '@collab-board/shared-types';
import type { IAuthenticatedSocket } from '../auth/socket-auth';

const ROOM_PREFIX = 'board:';

const COLOR_PALETTE = [
  '#2563eb',
  '#dc2626',
  '#16a34a',
  '#ca8a04',
  '#9333ea',
  '#0891b2',
  '#ea580c',
  '#be185d',
];

function hashUserId(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i += 1) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

const roomUsers = new Map<string, Map<string, UserPresence>>();

function getRoomMap(room: string): Map<string, UserPresence> {
  let m = roomUsers.get(room);
  if (!m) {
    m = new Map();
    roomUsers.set(room, m);
  }
  return m;
}

/**
 * Builds UserPresence from authenticated socket (server has userId/sessionId only).
 */
export function buildUserPresenceFromSocket(socket: IAuthenticatedSocket): UserPresence {
  const userId = socket.data.user?.userId ?? '';
  const index = Math.abs(hashUserId(userId)) % COLOR_PALETTE.length;
  const color = COLOR_PALETTE[index] ?? COLOR_PALETTE[0]!;
  return {
    userId,
    name: userId.slice(0, 12) || 'Anonymous',
    avatar: '',
    color,
    cursor: null,
    lastSeen: new Date().toISOString(),
  };
}

export function addUserToRoom(room: string, user: UserPresence): void {
  getRoomMap(room).set(user.userId, user);
}

export function removeUserFromRoom(room: string, userId: string): void {
  const m = roomUsers.get(room);
  if (m) {
    m.delete(userId);
    if (m.size === 0) {
      roomUsers.delete(room);
    }
  }
}

export function getUsersInRoom(room: string): UserPresence[] {
  const m = roomUsers.get(room);
  if (!m) {
    return [];
  }
  return Array.from(m.values());
}

/**
 * Clears all presence state (for tests).
 */
export function clearPresenceStore(): void {
  roomUsers.clear();
}

/**
 * Called when a socket joins a board room. Adds user to presence store,
 * broadcasts presence:join to room, and sends presence:list to the joining socket.
 */
export function notifyPresenceJoin(io: Server, socket: IAuthenticatedSocket, room: string): void {
  const user = buildUserPresenceFromSocket(socket);
  addUserToRoom(room, user);
  io.to(room).emit('presence:join', { user });
  socket.emit('presence:list', { users: getUsersInRoom(room) });
}

/**
 * Called on socket disconnect. Removes user from all board rooms and
 * broadcasts presence:leave to each room.
 */
export function notifyPresenceLeave(io: Server, socket: IAuthenticatedSocket): void {
  const userId = socket.data.user?.userId;
  if (!userId) {
    return;
  }
  for (const room of socket.rooms) {
    if (room.startsWith(ROOM_PREFIX)) {
      removeUserFromRoom(room, userId);
      io.to(room).emit('presence:leave', { userId });
    }
  }
}

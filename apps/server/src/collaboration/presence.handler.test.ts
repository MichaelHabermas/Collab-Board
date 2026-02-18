import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Server } from 'socket.io';
import type { IAuthenticatedSocket } from '../auth/socket-auth';
import {
  addUserToRoom,
  removeUserFromRoom,
  getUsersInRoom,
  buildUserPresenceFromSocket,
  clearPresenceStore,
  notifyPresenceJoin,
  notifyPresenceLeave,
} from './presence.handler';

describe('presence.handler', () => {
  beforeEach(() => {
    clearPresenceStore();
  });

  describe('buildUserPresenceFromSocket', () => {
    it('builds UserPresence from socket.data.user', () => {
      const socket = {
        data: { user: { userId: 'user-1', sessionId: 'sess-1' } },
      } as unknown as IAuthenticatedSocket;
      const user = buildUserPresenceFromSocket(socket);
      expect(user.userId).toBe('user-1');
      expect(user.name).toBeDefined();
      expect(typeof user.name).toBe('string');
      expect(user.avatar).toBe('');
      expect(user.color).toBeDefined();
      expect(user.cursor).toBeNull();
      expect(user.lastSeen).toBeDefined();
    });

    it('uses displayName and avatarUrl from overrides when provided', () => {
      const socket = {
        data: { user: { userId: 'user-1', sessionId: 'sess-1' } },
      } as unknown as IAuthenticatedSocket;
      const user = buildUserPresenceFromSocket(socket, {
        displayName: 'Alice',
        avatarUrl: 'https://example.com/avatar.png',
      });
      expect(user.name).toBe('Alice');
      expect(user.avatar).toBe('https://example.com/avatar.png');
    });
  });

  describe('addUserToRoom, getUsersInRoom, removeUserFromRoom', () => {
    it('adds user to room and returns them in getUsersInRoom', () => {
      const user = {
        userId: 'u1',
        name: 'User 1',
        avatar: '',
        color: '#2563eb',
        cursor: null,
        lastSeen: new Date().toISOString(),
      };
      addUserToRoom('board:abc', user);
      expect(getUsersInRoom('board:abc')).toHaveLength(1);
      expect(getUsersInRoom('board:abc')[0]).toEqual(user);
    });

    it('removeUserFromRoom removes user from room', () => {
      const user = {
        userId: 'u1',
        name: 'User 1',
        avatar: '',
        color: '#2563eb',
        cursor: null,
        lastSeen: new Date().toISOString(),
      };
      addUserToRoom('board:abc', user);
      removeUserFromRoom('board:abc', 'u1');
      expect(getUsersInRoom('board:abc')).toHaveLength(0);
    });

    it('returns empty array for unknown room', () => {
      expect(getUsersInRoom('board:unknown')).toEqual([]);
    });

    it('same user in two rooms appears in both', () => {
      const user = {
        userId: 'u1',
        name: 'User 1',
        avatar: '',
        color: '#2563eb',
        cursor: null,
        lastSeen: new Date().toISOString(),
      };
      addUserToRoom('board:a', user);
      addUserToRoom('board:b', user);
      expect(getUsersInRoom('board:a')).toHaveLength(1);
      expect(getUsersInRoom('board:b')).toHaveLength(1);
    });
  });

  describe('notifyPresenceJoin', () => {
    it('adds user to room, broadcasts presence:join, emits presence:list to socket', () => {
      const mockEmit = vi.fn();
      const mockTo = vi.fn(() => ({ emit: vi.fn() }));
      const mockIo = { to: mockTo } as unknown as Server;
      const mockSocket = {
        id: 's1',
        data: { user: { userId: 'user-1', sessionId: 'sess-1' } },
        emit: mockEmit,
      } as unknown as IAuthenticatedSocket;

      notifyPresenceJoin(mockIo, mockSocket, 'board:abc');

      expect(getUsersInRoom('board:abc')).toHaveLength(1);
      expect(getUsersInRoom('board:abc')[0]?.userId).toBe('user-1');

      const toEmit = mockTo.mock.results[0]?.value?.emit;
      expect(mockTo).toHaveBeenCalledWith('board:abc');
      if (toEmit) {
        expect(toEmit).toHaveBeenCalledWith(
          'presence:join',
          expect.objectContaining({ user: expect.objectContaining({ userId: 'user-1' }) })
        );
      }
      expect(mockEmit).toHaveBeenCalledWith('presence:list', { users: expect.any(Array) });
      expect(mockEmit.mock.calls[0]?.[1].users).toHaveLength(1);
    });
  });

  describe('notifyPresenceLeave', () => {
    it('removes user from room and broadcasts presence:leave', () => {
      const user = {
        userId: 'u1',
        name: 'User 1',
        avatar: '',
        color: '#2563eb',
        cursor: null,
        lastSeen: new Date().toISOString(),
      };
      addUserToRoom('board:abc', user);
      expect(getUsersInRoom('board:abc')).toHaveLength(1);

      const mockTo = vi.fn(() => ({ emit: vi.fn() }));
      const mockIo = { to: mockTo } as unknown as Server;
      const mockSocket = {
        id: 's1',
        data: { user: { userId: 'u1', sessionId: 's1' } },
        rooms: new Set(['s1', 'board:abc']),
      } as unknown as IAuthenticatedSocket;

      notifyPresenceLeave(mockIo, mockSocket);

      expect(getUsersInRoom('board:abc')).toHaveLength(0);
      expect(mockTo).toHaveBeenCalledWith('board:abc');
      const toEmit = mockTo.mock.results[0]?.value?.emit;
      if (toEmit) {
        expect(toEmit).toHaveBeenCalledWith('presence:leave', { userId: 'u1' });
      }
    });
  });
});

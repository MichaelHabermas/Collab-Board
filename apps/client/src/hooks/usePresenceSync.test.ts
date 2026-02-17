import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePresenceSync } from './usePresenceSync';
import { collaborationStore } from '@/store/collaborationStore';
import { useSocket } from './useSocket';

vi.mock('@/hooks/useSocket');

describe('usePresenceSync', () => {
  const socketHandlers: Map<string, (payload: unknown) => void> = new Map();
  const mockSocket = {
    on: vi.fn((event: string, handler: (payload: unknown) => void) => {
      socketHandlers.set(event, handler);
    }),
    off: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    socketHandlers.clear();
    collaborationStore.getState().clearPresence();
    vi.mocked(useSocket).mockReturnValue({
      socket: mockSocket as never,
      isConnected: true,
      isReconnecting: false,
      error: '',
      connectionStatus: 'connected',
    });
  });

  it('clears presence when socket is null', () => {
    collaborationStore.getState().addPresence({
      userId: 'u1',
      name: 'U1',
      avatar: '',
      color: '#000',
      cursor: null,
      lastSeen: new Date().toISOString(),
    });
    vi.mocked(useSocket).mockReturnValue({
      socket: null,
      isConnected: false,
      isReconnecting: false,
      error: '',
      connectionStatus: 'disconnected',
    });
    renderHook(() => usePresenceSync());
    expect(collaborationStore.getState().onlineUsers.size).toBe(0);
  });

  it('registers presence:list, presence:join, presence:leave listeners', () => {
    renderHook(() => usePresenceSync());
    expect(socketHandlers.has('presence:list')).toBe(true);
    expect(socketHandlers.has('presence:join')).toBe(true);
    expect(socketHandlers.has('presence:leave')).toBe(true);
  });

  it('updates store when presence:list is received', () => {
    renderHook(() => usePresenceSync());
    const onList = socketHandlers.get('presence:list');
    expect(onList).toBeDefined();
    onList!({
      users: [
        {
          userId: 'u1',
          name: 'User 1',
          avatar: '',
          color: '#2563eb',
          cursor: null,
          lastSeen: new Date().toISOString(),
        },
      ],
    });
    expect(collaborationStore.getState().onlineUsers.size).toBe(1);
    expect(collaborationStore.getState().onlineUsers.get('u1')?.name).toBe('User 1');
  });

  it('adds user when presence:join is received', () => {
    renderHook(() => usePresenceSync());
    const onJoin = socketHandlers.get('presence:join');
    expect(onJoin).toBeDefined();
    onJoin!({
      user: {
        userId: 'u2',
        name: 'User 2',
        avatar: '',
        color: '#dc2626',
        cursor: null,
        lastSeen: new Date().toISOString(),
      },
    });
    expect(collaborationStore.getState().onlineUsers.get('u2')?.name).toBe('User 2');
  });

  it('removes user when presence:leave is received', () => {
    renderHook(() => usePresenceSync());
    const onList = socketHandlers.get('presence:list');
    onList!({
      users: [
        {
          userId: 'u1',
          name: 'User 1',
          avatar: '',
          color: '#2563eb',
          cursor: null,
          lastSeen: new Date().toISOString(),
        },
      ],
    });
    expect(collaborationStore.getState().onlineUsers.size).toBe(1);
    const onLeave = socketHandlers.get('presence:leave');
    onLeave!({ userId: 'u1' });
    expect(collaborationStore.getState().onlineUsers.size).toBe(0);
  });
});

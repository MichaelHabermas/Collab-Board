import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { SOCKET_RECONNECT_OPTIONS, useSocket, type ConnectionStatus } from './useSocket';

const { mockIo } = vi.hoisted(() => ({ mockIo: vi.fn() }));

vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => ({ isLoaded: true, isSignedIn: true }),
}));

vi.mock('socket.io-client', () => ({ io: mockIo }));

vi.mock('@/hooks/useClerkToken', () => ({
  useClerkToken: () => () => Promise.resolve('token'),
}));

describe('useSocket reconnect configuration', () => {
  it('exports explicit reconnection options for exponential backoff', () => {
    expect(SOCKET_RECONNECT_OPTIONS.reconnection).toBe(true);
    expect(SOCKET_RECONNECT_OPTIONS.reconnectionAttempts).toBe(Infinity);
    expect(SOCKET_RECONNECT_OPTIONS.reconnectionDelay).toBe(1000);
    expect(SOCKET_RECONNECT_OPTIONS.reconnectionDelayMax).toBe(30000);
    expect(SOCKET_RECONNECT_OPTIONS.randomizationFactor).toBe(0.5);
  });
});

describe('useSocket connection status', () => {
  beforeEach(() => {
    mockIo.mockReset();
  });

  it('returns connectionStatus and isReconnecting in result', () => {
    const mockOn = vi.fn();
    const mockDisconnect = vi.fn();
    mockIo.mockReturnValue({
      on: mockOn,
      disconnect: mockDisconnect,
      io: { on: vi.fn() },
    });
    const { result } = renderHook(() => useSocket());
    expect(result.current).toHaveProperty('connectionStatus');
    expect(result.current).toHaveProperty('isReconnecting');
    const status: ConnectionStatus = result.current.connectionStatus;
    expect(['connected', 'reconnecting', 'disconnected']).toContain(status);
  });
});

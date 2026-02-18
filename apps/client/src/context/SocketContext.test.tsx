import type { ReactNode } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { SocketProvider, useSocketContext } from './SocketContext';

vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => ({ isLoaded: true, isSignedIn: true }),
}));

vi.mock('@/hooks/useClerkToken', () => ({
  useClerkToken: () => (): Promise<string> => Promise.resolve('test-token'),
}));

const createMockSocket = (): {
  on: ReturnType<typeof vi.fn>;
  io: { on: ReturnType<typeof vi.fn> };
  disconnect: ReturnType<typeof vi.fn>;
} => {
  const mockSocket = {
    on: vi.fn(),
    io: { on: vi.fn() },
    disconnect: vi.fn(),
  };
  mockSocket.on.mockImplementation((event: string, cb: () => void) => {
    if (event === 'connect') {
      queueMicrotask(() => cb());
    }
    return mockSocket;
  });
  return mockSocket;
};

const { mockIo } = vi.hoisted(() => ({ mockIo: vi.fn() }));
vi.mock('socket.io-client', () => ({ io: mockIo }));

function useTwoSockets(): {
  socketA: ReturnType<typeof useSocketContext>['socket'];
  socketB: ReturnType<typeof useSocketContext>['socket'];
} {
  const a = useSocketContext();
  const b = useSocketContext();
  return { socketA: a.socket, socketB: b.socket };
}

function wrapper({ children }: { children: ReactNode }): ReactNode {
  return <SocketProvider>{children}</SocketProvider>;
}

describe('SocketContext', () => {
  it('useSocketContext returns disconnected default when used outside SocketProvider', () => {
    const { result } = renderHook(() => useSocketContext());
    expect(result.current.socket).toBeNull();
    expect(result.current.isConnected).toBe(false);
    expect(result.current.isReconnecting).toBe(false);
    expect(result.current.error).toBe('');
    expect(result.current.connectionStatus).toBe('disconnected');
  });

  it('two consumers inside SocketProvider receive the same socket instance (singleton per tab)', async () => {
    const mockSocket = createMockSocket();
    mockIo.mockReturnValue(mockSocket);

    const { result } = renderHook(() => useTwoSockets(), { wrapper });

    await waitFor(() => {
      expect(result.current.socketA).not.toBeNull();
      expect(result.current.socketB).not.toBeNull();
    });
    expect(result.current.socketA).toBe(result.current.socketB);
  });
});

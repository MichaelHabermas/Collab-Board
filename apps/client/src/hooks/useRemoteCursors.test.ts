import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRemoteCursors } from './useRemoteCursors';
import { useSocket } from './useSocket';

vi.mock('@/hooks/useSocket');

const cursorHandlers: Map<string, (payload: unknown) => void> = new Map();
const mockSocket = {
  on: vi.fn((event: string, handler: (payload: unknown) => void) => {
    cursorHandlers.set(event, handler);
  }),
  off: vi.fn(),
};

function flushAnimationFrames(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

describe('useRemoteCursors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cursorHandlers.clear();
    vi.mocked(useSocket).mockReturnValue({
      socket: mockSocket as never,
      isConnected: true,
      isReconnecting: false,
      error: '',
      connectionStatus: 'connected',
    });
  });

  it('returns empty Map when socket is null', async () => {
    vi.mocked(useSocket).mockReturnValue({
      socket: null,
      isConnected: false,
      isReconnecting: false,
      error: '',
      connectionStatus: 'disconnected',
    });
    const { result } = renderHook(() => useRemoteCursors());
    await act(async () => {
      await flushAnimationFrames();
    });
    expect(result.current.size).toBe(0);
  });

  it('registers cursor:update and presence:leave listeners', () => {
    renderHook(() => useRemoteCursors());
    expect(cursorHandlers.has('cursor:update')).toBe(true);
    expect(cursorHandlers.has('presence:leave')).toBe(true);
  });

  it('adds cursor to map when cursor:update is received', async () => {
    const { result } = renderHook(() => useRemoteCursors());
    const onCursorUpdate = cursorHandlers.get('cursor:update');
    expect(onCursorUpdate).toBeDefined();
    await act(async () => {
      onCursorUpdate!({ userId: 'user-a', x: 100, y: 200, name: 'Alice', color: '#2563eb' });
      await flushAnimationFrames();
    });
    expect(result.current.size).toBeGreaterThanOrEqual(1);
    const cursor = result.current.get('user-a');
    expect(cursor).toBeDefined();
    expect(cursor?.userId).toBe('user-a');
    expect(cursor?.name).toBe('Alice');
    expect(cursor?.color).toBe('#2563eb');
  });
});

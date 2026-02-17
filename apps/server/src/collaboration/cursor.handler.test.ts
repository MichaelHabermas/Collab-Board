import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerCursorHandlers } from './cursor.handler';
import type { IAuthenticatedSocket } from '../auth/socket-auth';

describe('registerCursorHandlers', () => {
  let mockEmit: ReturnType<typeof vi.fn>;
  let mockTo: ReturnType<typeof vi.fn>;
  let mockSocket: IAuthenticatedSocket;

  beforeEach(() => {
    mockEmit = vi.fn();
    mockTo = vi.fn(() => ({ emit: mockEmit }));
    mockSocket = {
      id: 'socket-1',
      data: { user: { userId: 'user-1', sessionId: 'sess-1' } },
      rooms: new Set(['socket-1', 'board:board-abc']),
      to: mockTo,
      on: vi.fn((event: string, handler: (payload: unknown) => void) => {
        if (event === 'cursor:move') {
          (
            mockSocket as unknown as { _cursorHandlers?: Array<(p: unknown) => void> }
          )._cursorHandlers =
            (mockSocket as unknown as { _cursorHandlers?: Array<(p: unknown) => void> })
              ._cursorHandlers ?? [];
          (
            mockSocket as unknown as { _cursorHandlers: Array<(p: unknown) => void> }
          )._cursorHandlers.push(handler);
        }
      }),
    } as unknown as IAuthenticatedSocket;
  });

  it('broadcasts cursor:update to room on valid cursor:move', () => {
    registerCursorHandlers(mockSocket);
    const handlers = (mockSocket as unknown as { _cursorHandlers: Array<(p: unknown) => void> })
      ._cursorHandlers;
    expect(handlers).toHaveLength(1);
    handlers[0]!({ x: 100, y: 200 });
    expect(mockTo).toHaveBeenCalledWith('board:board-abc');
    expect(mockEmit).toHaveBeenCalledWith('cursor:update', {
      userId: 'user-1',
      x: 100,
      y: 200,
    });
  });

  it('does not broadcast on invalid payload', () => {
    registerCursorHandlers(mockSocket);
    const handlers = (mockSocket as unknown as { _cursorHandlers: Array<(p: unknown) => void> })
      ._cursorHandlers;
    handlers[0]!({});
    handlers[0]!({ x: 'bad', y: 0 });
    expect(mockEmit).not.toHaveBeenCalled();
  });
});

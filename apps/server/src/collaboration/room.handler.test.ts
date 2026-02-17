import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerRoomHandlers } from './room.handler';
import type { IAuthenticatedSocket } from '../auth/socket-auth';

describe('registerRoomHandlers', () => {
  let mockJoin: ReturnType<typeof vi.fn>;
  let mockLeave: ReturnType<typeof vi.fn>;
  const boardJoinHandlers: Array<(payload: unknown) => void> = [];
  const boardLeaveHandlers: Array<(payload: unknown) => void> = [];
  let mockSocket: IAuthenticatedSocket;

  beforeEach(() => {
    mockJoin = vi.fn();
    mockLeave = vi.fn();
    boardJoinHandlers.length = 0;
    boardLeaveHandlers.length = 0;
    mockSocket = {
      id: 'socket-1',
      data: { user: { userId: 'user-1', sessionId: 'sess-1' } },
      join: mockJoin,
      leave: mockLeave,
      on: vi.fn((event: string, handler: (payload: unknown) => void) => {
        if (event === 'board:join') boardJoinHandlers.push(handler);
        if (event === 'board:leave') boardLeaveHandlers.push(handler);
      }),
    } as unknown as IAuthenticatedSocket;
  });

  it('joins socket to board room on valid board:join payload', () => {
    registerRoomHandlers(mockSocket);
    expect(boardJoinHandlers).toHaveLength(1);
    boardJoinHandlers[0]!({ boardId: 'board-abc' });
    expect(mockJoin).toHaveBeenCalledWith('board:board-abc');
  });

  it('does not join on invalid board:join payload', () => {
    registerRoomHandlers(mockSocket);
    boardJoinHandlers[0]!({});
    boardJoinHandlers[0]!({ boardId: '' });
    expect(mockJoin).not.toHaveBeenCalled();
  });

  it('leaves socket from board room on board:leave payload', () => {
    registerRoomHandlers(mockSocket);
    expect(boardLeaveHandlers).toHaveLength(1);
    boardLeaveHandlers[0]!({ boardId: 'board-xyz' });
    expect(mockLeave).toHaveBeenCalledWith('board:board-xyz');
  });
});

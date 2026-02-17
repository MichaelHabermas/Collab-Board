import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerRoomHandlers } from './room.handler';
import type { IAuthenticatedSocket } from '../auth/socket-auth';
import type { BoardRepository } from '../modules/board/board.repo';

describe('registerRoomHandlers', () => {
  let mockJoin: ReturnType<typeof vi.fn>;
  let mockLeave: ReturnType<typeof vi.fn>;
  let mockEmit: ReturnType<typeof vi.fn>;
  const boardJoinHandlers: Array<(payload: unknown) => void> = [];
  const boardLeaveHandlers: Array<(payload: unknown) => void> = [];
  let mockSocket: IAuthenticatedSocket;
  let mockBoardRepo: BoardRepository;

  beforeEach(() => {
    mockJoin = vi.fn();
    mockLeave = vi.fn();
    mockEmit = vi.fn();
    boardJoinHandlers.length = 0;
    boardLeaveHandlers.length = 0;
    mockSocket = {
      id: 'socket-1',
      data: { user: { userId: 'user-1', sessionId: 'sess-1' } },
      join: mockJoin,
      leave: mockLeave,
      emit: mockEmit,
      on: vi.fn((event: string, handler: (payload: unknown) => void) => {
        if (event === 'board:join') boardJoinHandlers.push(handler);
        if (event === 'board:leave') boardLeaveHandlers.push(handler);
      }),
    } as unknown as IAuthenticatedSocket;
    mockBoardRepo = {
      findBoardById: vi.fn().mockResolvedValue({
        id: 'board-abc',
        title: 'Test Board',
        ownerId: 'user-1',
        collaborators: [],
        createdAt: new Date(0).toISOString(),
        updatedAt: new Date(0).toISOString(),
      }),
      findObjectsByBoard: vi.fn().mockResolvedValue([]),
    } as unknown as BoardRepository;
  });

  it('joins socket to board room on valid board:join payload', async () => {
    registerRoomHandlers(mockSocket, mockBoardRepo);
    expect(boardJoinHandlers).toHaveLength(1);
    await boardJoinHandlers[0]!({ boardId: 'board-abc' });
    expect(mockJoin).toHaveBeenCalledWith('board:board-abc');
  });

  it('emits board:load with board and objects after join', async () => {
    const objects = [
      {
        id: 'obj-1',
        boardId: 'board-abc',
        type: 'sticky_note' as const,
        x: 0,
        y: 0,
        width: 100,
        height: 80,
        rotation: 0,
        zIndex: 0,
        color: '#fff',
        createdBy: 'user-1',
        updatedAt: new Date().toISOString(),
        content: 'Hi',
        fontSize: 14,
      },
    ];
    vi.mocked(mockBoardRepo.findObjectsByBoard).mockResolvedValue(objects);
    registerRoomHandlers(mockSocket, mockBoardRepo);
    await boardJoinHandlers[0]!({ boardId: 'board-abc' });

    expect(mockEmit).toHaveBeenCalledWith('board:load', {
      board: expect.objectContaining({ id: 'board-abc', title: 'Test Board' }),
      objects,
      users: [],
    });
  });

  it('does not join on invalid board:join payload', async () => {
    registerRoomHandlers(mockSocket, mockBoardRepo);
    await boardJoinHandlers[0]!({});
    await boardJoinHandlers[0]!({ boardId: '' });
    expect(mockJoin).not.toHaveBeenCalled();
  });

  it('leaves socket from board room on board:leave payload', () => {
    registerRoomHandlers(mockSocket, mockBoardRepo);
    expect(boardLeaveHandlers).toHaveLength(1);
    boardLeaveHandlers[0]!({ boardId: 'board-xyz' });
    expect(mockLeave).toHaveBeenCalledWith('board:board-xyz');
  });
});

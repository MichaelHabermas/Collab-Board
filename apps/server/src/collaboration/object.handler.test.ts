import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Server } from 'socket.io';
import { registerObjectHandlers } from './object.handler';
import type { IAuthenticatedSocket } from '../auth/socket-auth';
import type { BoardRepository } from '../modules/board/board.repo';
import type { BoardObject } from '@collab-board/shared-types';

describe('registerObjectHandlers', () => {
  let mockEmitToRoom: ReturnType<typeof vi.fn>;
  let mockSocketEmit: ReturnType<typeof vi.fn>;
  const objectCreateHandlers: Array<(payload: unknown) => void> = [];
  let mockSocket: IAuthenticatedSocket;
  let mockBoardRepo: BoardRepository;
  let mockIo: Server;

  const createdSticky: BoardObject = {
    id: 'server-id-1',
    boardId: 'board-abc',
    type: 'sticky_note',
    x: 10,
    y: 20,
    width: 120,
    height: 80,
    rotation: 0,
    zIndex: 0,
    color: '#fef08a',
    createdBy: 'user-1',
    updatedAt: new Date().toISOString(),
    content: '',
    fontSize: 14,
  };

  beforeEach(() => {
    mockEmitToRoom = vi.fn();
    mockSocketEmit = vi.fn();
    objectCreateHandlers.length = 0;
    mockIo = {
      to: vi.fn(() => ({ emit: mockEmitToRoom })),
    } as unknown as Server;
    mockSocket = {
      id: 'socket-1',
      data: { user: { userId: 'user-1', sessionId: 'sess-1' } },
      emit: mockSocketEmit,
      on: vi.fn((event: string, handler: (payload: unknown) => void) => {
        if (event === 'object:create') objectCreateHandlers.push(handler);
      }),
    } as unknown as IAuthenticatedSocket;
    mockBoardRepo = {
      createObject: vi.fn().mockResolvedValue(createdSticky),
    } as unknown as BoardRepository;
  });

  it('validates object:create, persists, and broadcasts object:created', async () => {
    registerObjectHandlers(mockIo, mockSocket, mockBoardRepo);
    expect(objectCreateHandlers).toHaveLength(1);
    await objectCreateHandlers[0]!({
      boardId: 'board-abc',
      object: {
        boardId: 'board-abc',
        type: 'sticky_note',
        x: 10,
        y: 20,
        width: 120,
        height: 80,
        rotation: 0,
        zIndex: 0,
        color: '#fef08a',
        createdBy: 'user-1',
        content: '',
        fontSize: 14,
      },
    });

    expect(mockBoardRepo.createObject).toHaveBeenCalled();
    expect(mockEmitToRoom).toHaveBeenCalledWith('object:created', {
      object: createdSticky,
    });
    expect(mockIo.to).toHaveBeenCalledWith('board:board-abc');
  });

  it('does not persist or broadcast on invalid object:create payload', async () => {
    registerObjectHandlers(mockIo, mockSocket, mockBoardRepo);
    await objectCreateHandlers[0]!({});
    await objectCreateHandlers[0]!({ boardId: 'b', object: null });
    expect(mockBoardRepo.createObject).not.toHaveBeenCalled();
    expect(mockEmitToRoom).not.toHaveBeenCalled();
  });
});

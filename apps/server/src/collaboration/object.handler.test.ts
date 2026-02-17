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
  const objectMoveHandlers: Array<(payload: unknown) => void> = [];
  const objectUpdateHandlers: Array<(payload: unknown) => void> = [];
  const objectDeleteHandlers: Array<(payload: unknown) => void> = [];
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
    objectMoveHandlers.length = 0;
    objectUpdateHandlers.length = 0;
    objectDeleteHandlers.length = 0;
    mockIo = {
      to: vi.fn(() => ({ emit: mockEmitToRoom })),
    } as unknown as Server;
    mockSocket = {
      id: 'socket-1',
      data: { user: { userId: 'user-1', sessionId: 'sess-1' } },
      emit: mockSocketEmit,
      on: vi.fn((event: string, handler: (payload: unknown) => void) => {
        if (event === 'object:create') objectCreateHandlers.push(handler);
        if (event === 'object:move') objectMoveHandlers.push(handler);
        if (event === 'object:update') objectUpdateHandlers.push(handler);
        if (event === 'object:delete') objectDeleteHandlers.push(handler);
      }),
    } as unknown as IAuthenticatedSocket;
    mockBoardRepo = {
      createObject: vi.fn().mockResolvedValue(createdSticky),
      updateObject: vi.fn().mockResolvedValue(null),
      deleteObject: vi.fn().mockResolvedValue(undefined),
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

  it('validates object:move, updates position, and broadcasts object:updated', async () => {
    vi.mocked(mockBoardRepo.updateObject).mockResolvedValue({
      id: 'obj-1',
      boardId: 'board-abc',
      type: 'sticky_note',
      x: 50,
      y: 60,
      width: 100,
      height: 80,
      rotation: 0,
      zIndex: 0,
      color: '#fff',
      createdBy: 'user-1',
      updatedAt: new Date().toISOString(),
      content: '',
      fontSize: 14,
    });
    registerObjectHandlers(mockIo, mockSocket, mockBoardRepo);
    const moveHandler = objectMoveHandlers[0];
    expect(moveHandler).toBeDefined();
    await moveHandler!({ boardId: 'board-abc', objectId: 'obj-1', x: 50, y: 60 });
    expect(mockBoardRepo.updateObject).toHaveBeenCalledWith('obj-1', { x: 50, y: 60 });
    expect(mockEmitToRoom).toHaveBeenCalledWith('object:updated', {
      objectId: 'obj-1',
      delta: { x: 50, y: 60 },
      updatedBy: 'user-1',
    });
  });

  it('validates object:update, merges delta, and broadcasts object:updated', async () => {
    vi.mocked(mockBoardRepo.updateObject).mockResolvedValue({
      id: 'obj-1',
      boardId: 'board-abc',
      type: 'sticky_note',
      x: 0,
      y: 0,
      width: 100,
      height: 80,
      rotation: 0,
      zIndex: 0,
      color: '#fecaca',
      createdBy: 'user-1',
      updatedAt: new Date().toISOString(),
      content: 'Updated',
      fontSize: 14,
    });
    registerObjectHandlers(mockIo, mockSocket, mockBoardRepo);
    const updateHandler = objectUpdateHandlers[0];
    expect(updateHandler).toBeDefined();
    await updateHandler!({
      boardId: 'board-abc',
      objectId: 'obj-1',
      delta: { content: 'Updated', color: '#fecaca' },
    });
    expect(mockBoardRepo.updateObject).toHaveBeenCalledWith('obj-1', {
      content: 'Updated',
      color: '#fecaca',
    });
    expect(mockEmitToRoom).toHaveBeenCalledWith('object:updated', {
      objectId: 'obj-1',
      delta: { content: 'Updated', color: '#fecaca' },
      updatedBy: 'user-1',
    });
  });

  it('validates object:delete, removes from DB, and broadcasts object:deleted', async () => {
    registerObjectHandlers(mockIo, mockSocket, mockBoardRepo);
    const deleteHandler = objectDeleteHandlers[0];
    expect(deleteHandler).toBeDefined();
    await deleteHandler!({ boardId: 'board-abc', objectId: 'obj-1' });
    expect(mockBoardRepo.deleteObject).toHaveBeenCalledWith('obj-1');
    expect(mockEmitToRoom).toHaveBeenCalledWith('object:deleted', {
      objectId: 'obj-1',
      deletedBy: 'user-1',
    });
  });
});

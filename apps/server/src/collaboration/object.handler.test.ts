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

  it('rejects object:create when object.height is 0 (must be positive)', async () => {
    registerObjectHandlers(mockIo, mockSocket, mockBoardRepo);
    await objectCreateHandlers[0]!({
      boardId: 'board-abc',
      object: {
        boardId: 'board-abc',
        type: 'line',
        x: 0,
        y: 0,
        width: 100,
        height: 0,
        rotation: 0,
        zIndex: 0,
        color: '#64748b',
        createdBy: 'user-1',
        points: [0, 0, 100, 0],
        strokeColor: '#475569',
        strokeWidth: 2,
      },
    });
    expect(mockBoardRepo.createObject).not.toHaveBeenCalled();
    expect(mockEmitToRoom).not.toHaveBeenCalled();
  });

  it('uses client-provided id when valid UUID in object:create', async () => {
    const clientId = 'a1b2c3d4-e5f6-4789-a012-3456789abcde';
    const createdWithClientId = {
      ...createdSticky,
      id: clientId,
    };
    vi.mocked(mockBoardRepo.createObject).mockResolvedValue(createdWithClientId);
    registerObjectHandlers(mockIo, mockSocket, mockBoardRepo);
    await objectCreateHandlers[0]!({
      boardId: 'board-abc',
      object: {
        id: clientId,
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
    expect(mockBoardRepo.createObject).toHaveBeenCalledWith(
      expect.objectContaining({ id: clientId })
    );
    expect(mockEmitToRoom).toHaveBeenCalledWith('object:created', {
      object: createdWithClientId,
    });
  });

  it('accepts object:create for line when height is positive', async () => {
    const createdLine = {
      id: 'server-line-1',
      boardId: 'board-abc',
      type: 'line' as const,
      x: 0,
      y: 0,
      width: 100,
      height: 1,
      rotation: 0,
      zIndex: 0,
      color: '#64748b',
      createdBy: 'user-1',
      updatedAt: new Date().toISOString(),
      points: [0, 0, 100, 0],
      strokeColor: '#475569',
      strokeWidth: 2,
    };
    vi.mocked(mockBoardRepo.createObject).mockResolvedValue(createdLine);
    registerObjectHandlers(mockIo, mockSocket, mockBoardRepo);
    await objectCreateHandlers[0]!({
      boardId: 'board-abc',
      object: {
        boardId: 'board-abc',
        type: 'line',
        x: 0,
        y: 0,
        width: 100,
        height: 1,
        rotation: 0,
        zIndex: 0,
        color: '#64748b',
        createdBy: 'user-1',
        points: [0, 0, 100, 0],
        strokeColor: '#475569',
        strokeWidth: 2,
      },
    });
    expect(mockBoardRepo.createObject).toHaveBeenCalled();
    expect(mockEmitToRoom).toHaveBeenCalledWith('object:created', { object: createdLine });
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

  it('accepts UUID as objectId for object:move, object:update, and object:delete', async () => {
    const uuid = 'b49b7458-bf70-4efc-9da0-bdb2bb38b5aa';
    const updatedObj = { ...createdSticky, id: uuid, x: 10, y: 20 };
    vi.mocked(mockBoardRepo.updateObject).mockResolvedValue(updatedObj);
    registerObjectHandlers(mockIo, mockSocket, mockBoardRepo);
    const moveHandler = objectMoveHandlers[0];
    const updateHandler = objectUpdateHandlers[0];
    const deleteHandler = objectDeleteHandlers[0];
    expect(moveHandler).toBeDefined();
    expect(updateHandler).toBeDefined();
    expect(deleteHandler).toBeDefined();

    await moveHandler!({ boardId: 'board-abc', objectId: uuid, x: 10, y: 20 });
    expect(mockBoardRepo.updateObject).toHaveBeenCalledWith(uuid, { x: 10, y: 20 });
    expect(mockEmitToRoom).toHaveBeenCalledWith('object:updated', {
      objectId: uuid,
      delta: { x: 10, y: 20 },
      updatedBy: 'user-1',
    });

    await updateHandler!({
      boardId: 'board-abc',
      objectId: uuid,
      delta: { width: 150, height: 100, rotation: 15 },
    });
    expect(mockBoardRepo.updateObject).toHaveBeenCalledWith(uuid, {
      width: 150,
      height: 100,
      rotation: 15,
    });

    await deleteHandler!({ boardId: 'board-abc', objectId: uuid });
    expect(mockBoardRepo.deleteObject).toHaveBeenCalledWith(uuid);
    expect(mockEmitToRoom).toHaveBeenCalledWith('object:deleted', {
      objectId: uuid,
      deletedBy: 'user-1',
    });
  });
});

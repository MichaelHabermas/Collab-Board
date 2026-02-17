import { beforeEach, describe, expect, it } from 'vitest';
import type { Server, Socket } from 'socket.io';
import type { BoardObject, UserPresence } from '@collab-board/shared-types';
import type { BoardRepository } from '../modules/board/board.repo';
import { registerRoomHandlers } from './room.handler';
import { registerCursorHandlers } from './cursor.handler';
import { registerObjectHandlers } from './object.handler';
import { clearPresenceStore, notifyPresenceLeave } from './presence.handler';
import type { IAuthenticatedSocket } from '../auth/socket-auth';

interface ITestBoard {
  id: string;
  title: string;
  ownerId: string;
  collaborators: string[];
  createdAt: string;
  updatedAt: string;
}

interface IInMemoryRepo {
  findBoardById: (boardId: string) => Promise<ITestBoard | null>;
  findObjectsByBoard: (boardId: string) => Promise<BoardObject[]>;
  createObject: (object: BoardObject) => Promise<BoardObject>;
  updateObject: (objectId: string, patch: Partial<BoardObject>) => Promise<BoardObject | null>;
  deleteObject: (objectId: string) => Promise<void>;
}

interface IRoomState {
  members: Set<string>;
}

interface ITestEventMap {
  'board:load': Array<{ board: ITestBoard; objects: BoardObject[]; users: UserPresence[] }>;
  'presence:list': Array<{ users: UserPresence[] }>;
  'presence:join': Array<{ user: UserPresence }>;
  'presence:leave': Array<{ userId: string }>;
  'cursor:update': Array<{ userId: string; x: number; y: number; name?: string; color?: string }>;
  'object:created': Array<{ object: BoardObject }>;
  'object:updated': Array<{ objectId: string; delta: Partial<BoardObject>; updatedBy: string }>;
  'object:deleted': Array<{ objectId: string; deletedBy: string }>;
}

const TEST_BOARD_ID = '507f1f77bcf86cd799439011';

function createInMemoryRepo(): IInMemoryRepo {
  const board: ITestBoard = {
    id: TEST_BOARD_ID,
    title: 'Integration Board',
    ownerId: 'owner-1',
    collaborators: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const objectsById = new Map<string, BoardObject>();

  return {
    async findBoardById(boardId) {
      return boardId === TEST_BOARD_ID ? board : null;
    },
    async findObjectsByBoard(boardId) {
      return Array.from(objectsById.values()).filter((object) => object.boardId === boardId);
    },
    async createObject(object) {
      objectsById.set(object.id, object);
      return object;
    },
    async updateObject(objectId, patch) {
      const current = objectsById.get(objectId);
      if (!current) {
        return null;
      }
      const updated = { ...current, ...patch, updatedAt: new Date().toISOString() };
      objectsById.set(objectId, updated);
      return updated;
    },
    async deleteObject(objectId) {
      objectsById.delete(objectId);
    },
  };
}

class TestSocket {
  id: string;
  data: { user: { userId: string; sessionId: string; token: string }; boardId?: string };
  rooms = new Set<string>();
  handlers = new Map<string, (payload: unknown) => void | Promise<void>>();
  outgoingEvents: ITestEventMap = {
    'board:load': [],
    'presence:list': [],
    'presence:join': [],
    'presence:leave': [],
    'cursor:update': [],
    'object:created': [],
    'object:updated': [],
    'object:deleted': [],
  };

  constructor(socketId: string, userId: string) {
    this.id = socketId;
    this.data = { user: { userId, sessionId: `session-${userId}`, token: `token-${userId}` } };
    this.rooms.add(socketId);
  }

  on(eventName: string, handler: (payload: unknown) => void | Promise<void>): void {
    this.handlers.set(eventName, handler);
  }

  async receive(eventName: string, payload: unknown): Promise<void> {
    const handler = this.handlers.get(eventName);
    if (handler) {
      await handler(payload);
    }
  }

  emit(eventName: keyof ITestEventMap, payload: unknown): void {
    this.outgoingEvents[eventName].push(payload as never);
  }

  join(room: string): void {
    this.rooms.add(room);
  }

  leave(room: string): void {
    this.rooms.delete(room);
  }

  roomLookup: (room: string) => IRoomState = () => ({ members: new Set<string>() });
  socketLookup: (socketId: string) => TestSocket | undefined = () => undefined;

  to(room: string): { emit: (eventName: keyof ITestEventMap, payload: unknown) => void } {
    return {
      emit: (eventName: keyof ITestEventMap, payload: unknown) => {
        const roomState = this.roomLookup(room);
        roomState.members.forEach((socketId) => {
          if (socketId === this.id) {
            return;
          }
          const roomSocket = this.socketLookup(socketId);
          if (roomSocket) {
            roomSocket.emit(eventName, payload);
          }
        });
      },
    };
  }
}

function createStickyForTest(objectId: string): BoardObject {
  return {
    id: objectId,
    boardId: TEST_BOARD_ID,
    type: 'sticky_note',
    x: 40,
    y: 60,
    width: 200,
    height: 120,
    rotation: 0,
    zIndex: 0,
    color: '#fef08a',
    createdBy: 'user-a',
    updatedAt: new Date().toISOString(),
    content: 'integration',
    fontSize: 14,
  };
}

describe('socket handlers integration', () => {
  let roomStates: Map<string, IRoomState>;
  let boardRepo: IInMemoryRepo;
  let socketsById: Map<string, TestSocket>;
  let testIo: Server;
  let socketA: TestSocket;
  let socketB: TestSocket;
  let socketC: TestSocket;

  beforeEach(() => {
    clearPresenceStore();
    roomStates = new Map();
    socketsById = new Map();
    boardRepo = createInMemoryRepo();

    const getRoomMembers = (room: string): Set<string> => {
      const existing = roomStates.get(room);
      if (existing) {
        return existing.members;
      }
      const created = { members: new Set<string>() };
      roomStates.set(room, created);
      return created.members;
    };

    const registerSocket = (socket: TestSocket): void => {
      socketsById.set(socket.id, socket);
      socket.roomLookup = (room: string) => {
        const existing = roomStates.get(room);
        if (existing) {
          return existing;
        }
        const created = { members: new Set<string>() };
        roomStates.set(room, created);
        return created;
      };
      socket.socketLookup = (socketId: string) => socketsById.get(socketId);
      socket.join = (room: string): void => {
        getRoomMembers(room).add(socket.id);
        socket.rooms.add(room);
      };
      socket.leave = (room: string): void => {
        getRoomMembers(room).delete(socket.id);
        socket.rooms.delete(room);
      };
    };

    const emitToRoom = (room: string, eventName: keyof ITestEventMap, payload: unknown): void => {
      const members = getRoomMembers(room);
      members.forEach((socketId) => {
        const roomSocket = socketsById.get(socketId);
        if (roomSocket) {
          roomSocket.emit(eventName, payload);
        }
      });
    };

    testIo = {
      to: (room: string) =>
        ({
          emit: (eventName: keyof ITestEventMap, payload: unknown) => {
            emitToRoom(room, eventName, payload);
          },
        }) as Socket,
      except: (socketId: string) =>
        ({
          to: (room: string) =>
            ({
              emit: (eventName: keyof ITestEventMap, payload: unknown) => {
                const members = getRoomMembers(room);
                members.forEach((memberId) => {
                  if (memberId === socketId) {
                    return;
                  }
                  const roomSocket = socketsById.get(memberId);
                  if (roomSocket) {
                    roomSocket.emit(eventName, payload);
                  }
                });
              },
            }) as Socket,
        }) as Server,
    } as unknown as Server;

    socketA = new TestSocket('socket-a', 'user-a');
    socketB = new TestSocket('socket-b', 'user-b');
    socketC = new TestSocket('socket-c', 'user-c');
    registerSocket(socketA);
    registerSocket(socketB);
    registerSocket(socketC);

    [socketA, socketB, socketC].forEach((socket) => {
      registerRoomHandlers(
        testIo,
        socket as unknown as IAuthenticatedSocket,
        boardRepo as unknown as BoardRepository
      );
      registerCursorHandlers(socket as unknown as IAuthenticatedSocket);
      registerObjectHandlers(
        testIo,
        socket as unknown as IAuthenticatedSocket,
        boardRepo as unknown as BoardRepository
      );
    });
  });

  it('syncs presence and cursor events across two connected clients', async () => {
    await socketA.receive('board:join', { boardId: TEST_BOARD_ID });
    const listA = socketA.outgoingEvents['presence:list'][0];
    expect(listA.users.map((user) => user.userId)).toContain('user-a');

    await socketB.receive('board:join', { boardId: TEST_BOARD_ID });
    const joinPayload = socketA.outgoingEvents['presence:join'].at(-1);
    const listB = socketB.outgoingEvents['presence:list'][0];
    expect(joinPayload).toBeDefined();
    expect(joinPayload?.user.userId).toBe('user-b');
    expect(listB.users.map((user) => user.userId)).toEqual(expect.arrayContaining(['user-a', 'user-b']));

    await socketA.receive('cursor:move', { x: 101, y: 202 });
    const cursorPayload = socketB.outgoingEvents['cursor:update'].at(-1);
    expect(cursorPayload).toBeDefined();
    expect(cursorPayload?.userId).toBe('user-a');
    expect(cursorPayload?.x).toBe(101);
    expect(cursorPayload?.y).toBe(202);

    notifyPresenceLeave(testIo, socketA as unknown as IAuthenticatedSocket);
    const leavePayload = socketB.outgoingEvents['presence:leave'].at(-1);
    expect(leavePayload).toBeDefined();
    expect(leavePayload?.userId).toBe('user-a');
  });

  it('syncs object create, move, delete, and board load', async () => {
    await socketA.receive('board:join', { boardId: TEST_BOARD_ID });
    await socketB.receive('board:join', { boardId: TEST_BOARD_ID });

    const sticky = createStickyForTest('550e8400-e29b-41d4-a716-446655440000');
    await socketA.receive('object:create', { boardId: TEST_BOARD_ID, object: sticky });
    const createdPayload = socketB.outgoingEvents['object:created'].at(-1);
    expect(createdPayload).toBeDefined();
    const createdObjectId = createdPayload?.object.id;
    expect(typeof createdObjectId).toBe('string');

    await socketA.receive('object:move', { boardId: TEST_BOARD_ID, objectId: createdObjectId, x: 500, y: 600 });
    const movedPayload = socketB.outgoingEvents['object:updated'].at(-1);
    expect(movedPayload).toBeDefined();
    expect(movedPayload?.objectId).toBe(createdObjectId);
    expect(movedPayload?.delta).toMatchObject({ x: 500, y: 600 });

    await socketC.receive('board:join', { boardId: TEST_BOARD_ID });
    const boardLoadPayload = socketC.outgoingEvents['board:load'].at(-1);
    expect(boardLoadPayload).toBeDefined();
    expect(boardLoadPayload?.board.id).toBe(TEST_BOARD_ID);
    expect(boardLoadPayload?.objects.some((object) => object.id === createdObjectId)).toBe(true);

    await socketA.receive('object:delete', { boardId: TEST_BOARD_ID, objectId: createdObjectId });
    const deletedPayload = socketB.outgoingEvents['object:deleted'].at(-1);
    expect(deletedPayload).toBeDefined();
    expect(deletedPayload?.objectId).toBe(createdObjectId);
  });
});

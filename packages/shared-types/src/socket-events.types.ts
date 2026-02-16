import type { BoardObject, Board, UserPresence } from './board-object.types';

// --- Payload types ---

export interface CursorMovePayload {
  x: number;
  y: number;
}

export interface BoardJoinPayload {
  boardId: string;
}

export interface BoardLeavePayload {
  boardId: string;
}

export interface ObjectCreatePayload {
  boardId: string;
  object: Omit<BoardObject, 'id' | 'updatedAt'>;
}

export interface ObjectUpdatePayload {
  boardId: string;
  objectId: string;
  delta: Partial<BoardObject>;
}

export interface ObjectDeletePayload {
  boardId: string;
  objectId: string;
}

export interface BoardLoadPayload {
  board: Board;
  objects: BoardObject[];
  users: UserPresence[];
}

export interface PresenceJoinPayload {
  user: UserPresence;
}

export interface PresenceLeavePayload {
  userId: string;
}

export interface CursorUpdatePayload {
  userId: string;
  x: number;
  y: number;
}

export interface ObjectCreatedPayload {
  object: BoardObject;
}

export interface ObjectUpdatedPayload {
  objectId: string;
  delta: Partial<BoardObject>;
  updatedBy: string;
}

export interface ObjectDeletedPayload {
  objectId: string;
  deletedBy: string;
}

export interface AIResultPayload {
  requestId: string;
  result: unknown;
  error?: string;
}

export interface ErrorPayload {
  message: string;
  code?: string;
}

// --- Typed Socket.io event maps ---

export interface ClientToServerEvents {
  'cursor:move': (payload: CursorMovePayload) => void;
  'board:join': (payload: BoardJoinPayload) => void;
  'board:leave': (payload: BoardLeavePayload) => void;
  'object:create': (payload: ObjectCreatePayload) => void;
  'object:update': (payload: ObjectUpdatePayload) => void;
  'object:delete': (payload: ObjectDeletePayload) => void;
}

export interface ServerToClientEvents {
  'board:load': (payload: BoardLoadPayload) => void;
  'presence:join': (payload: PresenceJoinPayload) => void;
  'presence:leave': (payload: PresenceLeavePayload) => void;
  'cursor:update': (payload: CursorUpdatePayload) => void;
  'object:created': (payload: ObjectCreatedPayload) => void;
  'object:updated': (payload: ObjectUpdatedPayload) => void;
  'object:deleted': (payload: ObjectDeletedPayload) => void;
  'ai:result': (payload: AIResultPayload) => void;
  'error': (payload: ErrorPayload) => void;
}

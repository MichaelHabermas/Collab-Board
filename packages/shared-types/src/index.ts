export type {
  ObjectType,
  BoardObjectBase,
  StickyNote,
  RectangleShape,
  CircleShape,
  LineShape,
  Frame,
  Connector,
  TextElement,
  BoardObject,
  Board,
  UserPresence,
} from './board-object.types';

export type {
  CursorMovePayload,
  BoardJoinPayload,
  BoardLeavePayload,
  ObjectCreatePayload,
  ObjectUpdatePayload,
  ObjectDeletePayload,
  BoardLoadPayload,
  PresenceJoinPayload,
  PresenceLeavePayload,
  CursorUpdatePayload,
  ObjectCreatedPayload,
  ObjectUpdatedPayload,
  ObjectDeletedPayload,
  AIResultPayload,
  ErrorPayload,
  ClientToServerEvents,
  ServerToClientEvents,
} from './socket-events.types';

export type {
  ToolDefinition,
  ToolCallResult,
  AIExecuteRequest,
  AIExecuteResponse,
} from './ai-command.types';

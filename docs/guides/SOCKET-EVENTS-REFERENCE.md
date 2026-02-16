# Socket.io Events Reference

Single reference for all Socket.io events used by Collab-Board: event name, direction, payload type, and semantics. Complements [Design Document §8](../research/5-BASIC-DESIGN-DOCUMENT.md#8-real-time-sync-architecture) and the PRD V2 architecture sections.

Server handlers live under `apps/server/src/modules/collaboration/handlers/` (e.g. `cursor.handler.ts`, `object.handler.ts`, `presence.handler.ts`). Shared payload types can live in `packages/shared-types/socket-events.types.ts`.

---

## Cursor events (fast path — no DB)

| Event | Direction | Payload | Semantics |
| --- | --- | --- | --- |
| `cursor:move` | Client → Server → All in room | `{ userId: string; name: string; x: number; y: number; color: string }` | Current user’s cursor position. Emit throttled to ~30fps. Server broadcasts to room; not persisted. |

---

## Object events (medium path — optimistic UI + DB persist)

| Event | Direction | Payload | Semantics |
| --- | --- | --- | --- |
| `object:create` | Client → Server → All in room | `{ object: BoardObject }` | New board object. Server validates, persists to MongoDB (throttled), broadcasts. |
| `object:move` | Client → Server → All in room | `{ objectId: string; x: number; y: number }` | Move object. Server updates, persists, broadcasts. |
| `object:resize` | Client → Server → All in room | `{ objectId: string; width: number; height: number }` | Resize object. Server updates, persists, broadcasts. |
| `object:update` | Client → Server → All in room | `{ objectId: string; delta: Partial<BoardObject> }` | Partial update (e.g. text, color). Server merges, persists, broadcasts. |
| `object:delete` | Client → Server → All in room | `{ objectId: string }` | Delete object. Server removes from DB, broadcasts. |

All object events use optimistic UI: client renders first, then emits; rollback on server error. See [ADR-009](../research/4-RECORD-ARCHITECTURE-DECISIONS.md#adr-009-optimistic-ui-with-server-reconciliation).

---

## Presence events (lifecycle)

| Event | Direction | Payload | Semantics |
| --- | --- | --- | --- |
| `presence:join` | Server → All in room | `{ userId: string; name: string; avatar: string; color: string }` | A user joined the board. Broadcast when a socket joins the room. |
| `presence:leave` | Server → All in room | `{ userId: string }` | A user left (disconnect). Broadcast on socket disconnect. |
| `presence:list` | Server → Connecting client | `{ users: Array<{ userId: string; name: string; avatar: string; color: string }> }` | Current users in the room. Sent to the client that just joined (e.g. after `board:join`). |

Presence is maintained in server memory only; see [Design Document §8.1](../research/5-BASIC-DESIGN-DOCUMENT.md#81-socketio-event-taxonomy).

---

## Board events (load and join)

| Event | Direction | Payload | Semantics |
| --- | --- | --- | --- |
| `board:join` | Client → Server | `{ boardId: string }` | Client requests to join a board. Server verifies access, joins socket to room `board:${boardId}`, loads objects from MongoDB, then sends `board:load` and broadcasts `presence:join` for this user. |
| `board:load` | Server → Client | `{ objects: BoardObject[]; board?: { id: string; title: string; ... } }` | Full board state for the connecting client. Sent after `board:join` and on reconnection. |

Occurs on initial connection and after reconnect; client replaces local state with server state. See [Design Document §8.2](../research/5-BASIC-DESIGN-DOCUMENT.md#82-room-management).

---

## AI events (broadcast AI results)

| Event | Direction | Payload | Semantics |
| --- | --- | --- | --- |
| `ai:executing` | Server → All in room | `{ userId: string; command: string }` | Optional: AI command started (for loading indicator). |
| `ai:result` | Server → All in room | `{ objects: BoardObject[] }` | AI created or updated objects. All clients apply to local store and render. |
| `ai:error` | Server → Requesting client | `{ error: string }` | AI execution failed. Only the client that sent the command receives this. |

AI commands are triggered via REST `POST /api/ai/execute`; results are broadcast so all users see AI changes. See [Design Document §9](../research/5-BASIC-DESIGN-DOCUMENT.md#9-ai-agent-architecture).

---

## Connection and auth

- **Handshake:** Client sends Clerk JWT in `socket.auth.token`. Server verifies JWT on the `connection` event before allowing any room join or event handling. Invalid or missing token → connection rejected.
- **Room key:** `board:${boardId}`. One room per board; all users on that board share the same room for cursor, object, presence, and AI events.

See [Design Document §10](../research/5-BASIC-DESIGN-DOCUMENT.md#10-authentication--authorization-flow) and [ADR-006](../research/4-RECORD-ARCHITECTURE-DECISIONS.md#adr-006-clerk-for-authentication).

# Glossary

Definitions for domain and technical terms used across Collab-Board research, design, and implementation. Links point to the Design Document or ADRs where the term is defined or decided.

---

## A–C

**BoardObject** — The document shape for a whiteboard element (sticky note, shape, frame, connector, text). Stored in MongoDB `objects` and in Zustand `boardStore`. See [Design Document §7](../research/5-BASIC-DESIGN-DOCUMENT.md#7-data-model) and [Design Document §6.3](../research/5-BASIC-DESIGN-DOCUMENT.md#63-key-interfaces-dependency-inversion).

**board:join** — Client-emitted Socket.io event sent with `boardId` after connection. Server joins the socket to the room `board:${boardId}` and typically responds with `board:load`. See [Design Document §8](../research/5-BASIC-DESIGN-DOCUMENT.md#8-real-time-sync-architecture).

**Cursor layer** — The top Konva layer used for remote user cursors. Updated imperatively via direct node refs (e.g. `nodeRef.current.position({ x, y })`); no React reconciliation. See [ADR-002](../research/4-RECORD-ARCHITECTURE-DECISIONS.md#adr-002-zustand--direct-konva-refs-for-split-state-management) and [ADR-008](../research/4-RECORD-ARCHITECTURE-DECISIONS.md#adr-008-konvajs-react-konva-for-canvas-rendering).

---

## F–O

**Fast state** — High-frequency state (e.g. cursor positions at 30–60fps). Stored and updated via direct Konva refs, bypassing React. Contrast with **slow state**. See [ADR-002](../research/4-RECORD-ARCHITECTURE-DECISIONS.md#adr-002-zustand--direct-konva-refs-for-split-state-management).

**LLMAdapter** — Server-side interface for AI execution with tools (Dependency Inversion). Implemented by the Gemini integration. See [Design Document §6.3](../research/5-BASIC-DESIGN-DOCUMENT.md#63-key-interfaces-dependency-inversion).

**ObjectType** — Union of board object kinds: `sticky_note`, `rectangle`, `circle`, `line`, `frame`, `connector`, `text`. Used in `BoardObject.type` and in API/socket payloads. See [Design Document §7.1](../research/5-BASIC-DESIGN-DOCUMENT.md#71-mongodb-collections).

**Optimistic UI** — Pattern where the client renders a mutation immediately (e.g. move, create) and then emits to the server; on server error, the client rolls back to the previous state. See [ADR-009](../research/4-RECORD-ARCHITECTURE-DECISIONS.md#adr-009-optimistic-ui-with-server-reconciliation).

---

## P–Z

**Presence** — The set of users currently on a board. Maintained in server memory and broadcast via `presence:join` and `presence:leave`; clients show who is online. See [Design Document §8.1](../research/5-BASIC-DESIGN-DOCUMENT.md#81-socketio-event-taxonomy).

**Room** — A Socket.io room. In this project, each board maps to one room: `board:${boardId}`. All users viewing the same board share that room for cursor, object, and presence events. See [ADR-001](../research/4-RECORD-ARCHITECTURE-DECISIONS.md#adr-001-socketio-over-firebasesupabase-for-real-time-transport).

**Slow state** — State that changes at low frequency (auth, board metadata, object list). Stored in Zustand and drives React re-renders. Contrast with **fast state**. See [ADR-002](../research/4-RECORD-ARCHITECTURE-DECISIONS.md#adr-002-zustand--direct-konva-refs-for-split-state-management).

**StorageAdapter** — Server-side interface for board and object persistence (Dependency Inversion). Implemented by BoardRepository over MongoDB. See [Design Document §6.3](../research/5-BASIC-DESIGN-DOCUMENT.md#63-key-interfaces-dependency-inversion).

**SyncEngine** — Client-side abstraction that uses a TransportAdapter (e.g. Socket.io client) to send and receive sync events (cursors, objects, presence). See [Design Document §6.2](../research/5-BASIC-DESIGN-DOCUMENT.md#62-module-responsibilities--interfaces).

**TransportAdapter** — Server-side interface for broadcasting to rooms and handling connection (Dependency Inversion). Implemented by Socket.io. See [Design Document §6.3](../research/5-BASIC-DESIGN-DOCUMENT.md#63-key-interfaces-dependency-inversion).

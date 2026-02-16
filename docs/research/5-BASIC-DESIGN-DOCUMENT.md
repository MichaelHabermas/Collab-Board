# Collab-Board — Basic Design Document

**Project:** Collab-Board — Real-Time Collaborative Whiteboard with AI Agent  
**Date:** February 16, 2026  
**Author:** [Your Name]  
**Version:** 1.0  
**Status:** Locked — Ready for MVP Implementation

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Project Objectives & Constraints](#2-project-objectives--constraints)
3. [Locked Tech Stack & Documentation References](#3-locked-tech-stack--documentation-references)
4. [Design Principles](#4-design-principles)
5. [System Architecture](#5-system-architecture)
6. [Modular Design & Module Decomposition](#6-modular-design--module-decomposition)
7. [Data Model](#7-data-model)
8. [Real-Time Sync Architecture](#8-real-time-sync-architecture)
9. [AI Agent Architecture](#9-ai-agent-architecture)
10. [Authentication & Authorization Flow](#10-authentication--authorization-flow)
11. [Performance Strategy](#11-performance-strategy)
12. [Testing Strategy](#12-testing-strategy)
13. [Deployment Architecture](#13-deployment-architecture)
14. [Agile Breakdown — Epics & User Stories](#14-agile-breakdown--epics--user-stories)
15. [Risk Register](#15-risk-register)
16. [Document Cross-References](#16-document-cross-references)

---

## 1. Introduction

Collab-Board is a production-scale, real-time collaborative whiteboard application with an AI agent that manipulates board state via natural language commands. The project is modeled on the core functionality of tools like Miro — real-time synchronization, conflict resolution, and smooth canvas performance while streaming data across networks.

This design document locks in the technology stack, establishes the modular architecture following SOLID principles, and breaks the project down into Agile Epics and User Stories. It synthesizes all decisions documented in the Pre-Search Checklist, Tech Stack Options, Identify Tradeoffs, and Record Architecture Decisions documents.

**Core Philosophy:** A simple, solid, multiplayer whiteboard with a working AI agent beats any feature-rich board with broken collaboration. Modular design ensures each concern is isolated, testable, and replaceable.

---

## 2. Project Objectives & Constraints

### Deadlines

| Checkpoint | Deadline | Focus |
| --- | --- | --- |
| Pre-Search | Monday (1 hour in) | Architecture, Planning |
| MVP | Tuesday (24 hours) | Collaborative infrastructure — hard gate |
| Early Submission | Friday (4 days) | Full feature set |
| Final | Sunday (7 days) | Polish, documentation, deployment |

### MVP Hard Gate Requirements

All of the following must be functional at the 24-hour mark:

- Infinite board with pan/zoom
- Sticky notes with editable text
- At least one shape type (rectangle, circle, or line)
- Create, move, and edit objects
- Real-time sync between 2+ users
- Multiplayer cursors with name labels
- Presence awareness (who's online)
- User authentication
- Deployed and publicly accessible

### Performance Targets

| Metric | Target |
| --- | --- |
| Frame rate | 60 FPS during pan, zoom, object manipulation |
| Object sync latency | <100ms |
| Cursor sync latency | <50ms |
| Object capacity | 500+ objects without performance drops |
| Concurrent users | 5+ without degradation |

### Budget Constraint

$0 infrastructure cost for development and launch. All services must operate within free tiers.

### Team

Solo developer + AI coding agents (Cursor primary IDE, Claude Code secondary CLI).

---

## 3. Locked Tech Stack & Documentation References

The following stack is locked for this project. Each technology links to its official documentation.

### Runtime & Language

| Technology | Version | Documentation |
| --- | --- | --- |
| **Bun** | 1.3.x | [https://bun.com/docs](https://bun.com/docs) |
| **TypeScript** | 5.x (strict, noImplicitAny) | [https://www.typescriptlang.org/docs/](https://www.typescriptlang.org/docs/) |

### Frontend

| Technology | Version | Documentation |
| --- | --- | --- |
| **React** | 19 | [https://react.dev/reference/react](https://react.dev/reference/react) |
| **Vite** | 6.x | [https://vite.dev/guide/](https://vite.dev/guide/) |
| **Konva.js** | 10.x | [https://konvajs.org/docs/](https://konvajs.org/docs/) |
| **react-konva** | 19.x | [https://konvajs.org/docs/react/index.html](https://konvajs.org/docs/react/index.html) |
| **Tailwind CSS** | 4.x | [https://tailwindcss.com/docs](https://tailwindcss.com/docs) |
| **shadcn/ui** | latest | [https://ui.shadcn.com/docs](https://ui.shadcn.com/docs) |
| **Zustand** | 5.x | [https://zustand.docs.pmnd.rs/](https://zustand.docs.pmnd.rs/) |

### Backend

| Technology | Version | Documentation |
| --- | --- | --- |
| **Express** | 4.x | [https://expressjs.com/en/4x/api.html](https://expressjs.com/en/4x/api.html) |
| **Socket.io** (Server) | 4.x | [https://socket.io/docs/v4/](https://socket.io/docs/v4/) |
| **Socket.io-client** | 4.x | [https://socket.io/docs/v4/client-api/](https://socket.io/docs/v4/client-api/) |

### Data & Auth

| Technology | Tier | Documentation |
| --- | --- | --- |
| **MongoDB Atlas** | M0 (free, 512MB) | [https://www.mongodb.com/docs/atlas/](https://www.mongodb.com/docs/atlas/) |
| **Mongoose** (ODM) | 8.x | [https://mongoosejs.com/docs/](https://mongoosejs.com/docs/) |
| **Clerk** (React SDK) | free (10k MAU) | [https://clerk.com/docs](https://clerk.com/docs) |
| **Clerk** (Node SDK) | free | [https://clerk.com/docs/references/backend/overview](https://clerk.com/docs/references/backend/overview) |

### AI

| Technology | Tier | Documentation |
| --- | --- | --- |
| **Google Gemini 2.0 Flash** | Pay-as-you-go | [https://ai.google.dev/gemini-api/docs/models](https://ai.google.dev/gemini-api/docs/models) |
| **Google AI SDK (JS)** | latest | [https://ai.google.dev/gemini-api/docs/quickstart](https://ai.google.dev/gemini-api/docs/quickstart) |

### Testing

| Technology | Purpose | Documentation |
| --- | --- | --- |
| **Vitest** | Unit + Integration | [https://vitest.dev/guide/](https://vitest.dev/guide/) |
| **Playwright** | E2E (multiplayer) | [https://playwright.dev/docs/intro](https://playwright.dev/docs/intro) |
| **MSW** | API mocking | [https://mswjs.io/docs/](https://mswjs.io/docs/) |
| **mongodb-memory-server** | Test DB | [https://github.com/nodkz/mongodb-memory-server](https://github.com/nodkz/mongodb-memory-server) |

### Infrastructure & Tooling

| Technology | Tier | Documentation |
| --- | --- | --- |
| **Render** | Free web service | [https://docs.render.com/](https://docs.render.com/) |
| **ESLint** (flat config) | — | [https://eslint.org/docs/latest/](https://eslint.org/docs/latest/) |
| **Prettier** | — | [https://prettier.io/docs/en/](https://prettier.io/docs/en/) |
| **Swagger/OpenAPI** | — | [https://swagger.io/docs/](https://swagger.io/docs/) |
| **Zod** (validation) | 3.x | [https://zod.dev/](https://zod.dev/) |

---

## 4. Design Principles

### 4.1 SOLID Principles — Application to Collab-Board

**Single Responsibility Principle (SRP)**  
Every module, class, and function has one reason to change. Socket event handlers do not contain database logic. Canvas rendering components do not manage network state. AI command parsing is separate from AI command execution.

- `CursorHandler` — only handles cursor socket events
- `ObjectHandler` — only handles object CRUD socket events
- `PresenceHandler` — only handles connection/disconnect presence
- `AICommandParser` — only parses natural language into structured tool calls
- `AICommandExecutor` — only executes parsed tool calls against board state

**Open/Closed Principle (OCP)**  
The system is open for extension, closed for modification. New board object types (e.g., connectors, images) are added by implementing a shared `BoardObject` interface and registering with the object factory — no changes to existing object handlers. New AI commands are added by registering new tool definitions with the Gemini function-calling schema — no changes to the AI execution pipeline.

**Liskov Substitution Principle (LSP)**  
All board objects (StickyNote, Shape, Frame, Connector, Text) implement the `BoardObject` interface and can be used interchangeably wherever a `BoardObject` is expected — in rendering, syncing, persistence, and selection logic.

**Interface Segregation Principle (ISP)**  
Clients depend only on the interfaces they use. The canvas rendering layer depends on `Renderable` (x, y, width, height, render). The sync layer depends on `Syncable` (serialize, deserialize, applyDelta). The AI layer depends on `AIManipulable` (getId, getType, getProperties, applyCommand). No module is forced to depend on methods it doesn't use.

**Dependency Inversion Principle (DIP)**  
High-level modules (board logic, AI agent) depend on abstractions (interfaces), not concrete implementations. The `SyncEngine` depends on a `TransportAdapter` interface, not directly on Socket.io. The `AIAgent` depends on an `LLMAdapter` interface, not directly on the Gemini SDK. The `BoardRepository` depends on a `StorageAdapter` interface, not directly on MongoDB. This allows swapping Socket.io for raw WebSockets, Gemini for GPT-4, or MongoDB for Postgres without changing business logic.

### 4.2 Modular Design

The application is decomposed into cohesive, loosely coupled modules with explicit boundaries and well-defined interfaces between them. Each module can be developed, tested, and deployed independently within the monolith. Module boundaries align with domain responsibilities, not technology layers.

### 4.3 Agile Methodology

Work is broken into Epics (major capability areas) and User Stories (user-facing increments of value). Stories are prioritized by the project's build strategy: cursor sync → object sync → conflict handling → state persistence → board features → AI commands basic → AI commands complex. Each story is independently demonstrable and testable.

---

## 5. System Architecture

### 5.1 High-Level Architecture

```text
┌─────────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                     │
│                                                         │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────┐ │
│  │  Auth     │  │  UI Layer    │  │  Canvas Layer     │ │
│  │  Module   │  │  (React +   │  │  (Konva.js +      │ │
│  │  (Clerk)  │  │   shadcn)   │  │   react-konva)    │ │
│  └─────┬────┘  └──────┬───────┘  └────────┬──────────┘ │
│        │              │                    │             │
│  ┌─────┴──────────────┴────────────────────┴──────────┐ │
│  │              State Layer (Zustand)                  │ │
│  │    Slow: auth, board meta, objects                  │ │
│  │    Fast: cursor positions (direct Konva refs)       │ │
│  └──────────────────────┬─────────────────────────────┘ │
│                         │                               │
│  ┌──────────────────────┴─────────────────────────────┐ │
│  │           Sync Engine (Socket.io Client)           │ │
│  └──────────────────────┬─────────────────────────────┘ │
└─────────────────────────┼───────────────────────────────┘
                          │ WebSocket (persistent)
                          │
┌─────────────────────────┼───────────────────────────────┐
│                     SERVER (Bun + Express Monolith)      │
│                         │                               │
│  ┌──────────────────────┴─────────────────────────────┐ │
│  │           Socket.io Server (Rooms)                 │ │
│  │    cursor:move | object:* | presence:*             │ │
│  └──────────────────────┬─────────────────────────────┘ │
│                         │                               │
│  ┌──────────┐  ┌───────┴────────┐  ┌────────────────┐  │
│  │  Auth    │  │  Board Logic   │  │  AI Agent      │  │
│  │  Guard   │  │  (Handlers)    │  │  (Gemini 2.0   │  │
│  │  (Clerk  │  │                │  │   Flash)       │  │
│  │   JWT)   │  │                │  │                │  │
│  └──────────┘  └───────┬────────┘  └───────┬────────┘  │
│                        │                   │            │
│  ┌─────────────────────┴───────────────────┴──────────┐ │
│  │           Data Access Layer (MongoDB)              │ │
│  └────────────────────────────────────────────────────┘ │
│                                                         │
│  ┌────────────────────────────────────────────────────┐ │
│  │           Static File Server (Vite build)          │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
                    ┌─────┴─────┐
                    │  MongoDB  │
                    │  Atlas    │
                    │  (M0)     │
                    └───────────┘
```

### 5.2 Communication Patterns

| Pattern | Transport | Latency Target | Use Case |
| --- | --- | --- | --- |
| Cursor sync | Socket.io emit (no DB) | <50ms | Real-time cursor positions |
| Object CRUD | Socket.io emit → MongoDB persist | <100ms | Create, move, edit, delete objects |
| Board load | REST GET → MongoDB query | <500ms | Initial board state on connect |
| AI commands | REST POST → Gemini → Socket.io broadcast | <2s | Natural language board manipulation |
| Presence | Socket.io connect/disconnect events | <100ms | Online user list |

---

## 6. Modular Design & Module Decomposition

### 6.1 Project Structure

```text
collabboard/
├── apps/
│   ├── client/                          # Frontend SPA
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/               # Auth module (Clerk integration)
│   │   │   │   │   ├── components/     # <AuthGuard>, <UserAvatar>
│   │   │   │   │   ├── hooks/          # useAuth, useClerkToken
│   │   │   │   │   └── index.ts        # Public API
│   │   │   │   ├── board/              # Board module (canvas + objects)
│   │   │   │   │   ├── components/     # <Board>, <InfiniteCanvas>
│   │   │   │   │   ├── objects/        # <StickyNote>, <Shape>, <Frame>, <Connector>, <TextElement>
│   │   │   │   │   ├── hooks/          # useBoard, usePanZoom, useSelection
│   │   │   │   │   ├── store/          # boardStore (Zustand)
│   │   │   │   │   └── index.ts
│   │   │   │   ├── collaboration/      # Real-time collaboration module
│   │   │   │   │   ├── components/     # <CursorOverlay>, <PresencePanel>
│   │   │   │   │   ├── hooks/          # useSocket, useCursors, usePresence
│   │   │   │   │   ├── sync-engine/    # SyncEngine class, TransportAdapter interface
│   │   │   │   │   ├── store/          # collaborationStore (Zustand)
│   │   │   │   │   └── index.ts
│   │   │   │   ├── ai/                 # AI agent client module
│   │   │   │   │   ├── components/     # <AICommandBar>, <AIFeedback>
│   │   │   │   │   ├── hooks/          # useAICommand
│   │   │   │   │   └── index.ts
│   │   │   │   └── toolbar/            # Toolbar module
│   │   │   │       ├── components/     # <Toolbar>, <ShapePicker>, <ColorPicker>
│   │   │   │       └── index.ts
│   │   │   ├── shared/                 # Cross-cutting concerns
│   │   │   │   ├── components/         # <Layout>, <ErrorBoundary>, <LoadingSpinner>
│   │   │   │   ├── lib/                # Utility functions, constants
│   │   │   │   └── types/              # Shared client TypeScript interfaces
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── index.html
│   │   ├── tailwind.config.ts
│   │   ├── vite.config.ts
│   │   └── package.json
│   └── server/                          # Backend monolith
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/               # Auth guard module
│       │   │   │   ├── clerk-verify.ts # JWT verification middleware
│       │   │   │   ├── socket-auth.ts  # Socket.io handshake auth
│       │   │   │   └── index.ts
│       │   │   ├── board/              # Board persistence module
│       │   │   │   ├── board.model.ts  # Mongoose schema: Board
│       │   │   │   ├── object.model.ts # Mongoose schema: BoardObject
│       │   │   │   ├── board.repo.ts   # BoardRepository (StorageAdapter impl)
│       │   │   │   ├── board.routes.ts # REST routes: /api/boards
│       │   │   │   └── index.ts
│       │   │   ├── collaboration/      # Real-time sync module
│       │   │   │   ├── handlers/
│       │   │   │   │   ├── cursor.handler.ts    # SRP: cursor events only
│       │   │   │   │   ├── object.handler.ts    # SRP: object CRUD events only
│       │   │   │   │   └── presence.handler.ts  # SRP: connect/disconnect only
│       │   │   │   ├── socket-manager.ts         # Room management, broadcast
│       │   │   │   └── index.ts
│       │   │   └── ai/                 # AI agent module
│       │   │       ├── agent.ts        # AIAgent orchestrator
│       │   │       ├── llm-adapter.ts  # LLMAdapter interface + Gemini impl
│       │   │       ├── tools/          # Tool definitions (createStickyNote, etc.)
│       │   │       │   ├── creation.tools.ts
│       │   │       │   ├── manipulation.tools.ts
│       │   │       │   ├── layout.tools.ts
│       │   │       │   └── index.ts
│       │   │       ├── ai.routes.ts    # REST route: /api/ai/execute
│       │   │       └── index.ts
│       │   ├── shared/
│       │   │   ├── interfaces/         # Abstract interfaces (StorageAdapter, TransportAdapter, LLMAdapter)
│       │   │   ├── middleware/         # Express middleware (error handler, CORS, rate limiter)
│       │   │   ├── validation/        # Zod schemas for all inputs
│       │   │   └── types/             # Shared server TypeScript interfaces
│       │   ├── app.ts                 # Express app setup
│       │   └── server.ts              # Entry point: HTTP + Socket.io
│       └── package.json
├── packages/
│   └── shared-types/                   # Shared between client and server
│       ├── board-object.types.ts       # BoardObject, StickyNote, Shape, Frame, etc.
│       ├── socket-events.types.ts      # Socket event payload types
│       ├── ai-command.types.ts         # AI tool call types
│       └── index.ts
├── package.json                        # Root workspace config (Bun workspaces)
├── tsconfig.json                       # Root TypeScript config
└── .cursor/
    └── rules/
        └── collab-board-rule.mdc       # Project coding rules
```

### 6.2 Module Responsibilities & Interfaces

Each module exposes a public API via its `index.ts` barrel export. Internal implementation details are not accessible outside the module boundary.

**Client Modules:**

| Module | Responsibility | Depends On | Exports |
| --- | --- | --- | --- |
| `auth` | Clerk integration, token management | Clerk SDK, shared/types | `<AuthGuard>`, `useAuth`, `useClerkToken` |
| `board` | Canvas rendering, object management, pan/zoom, selection | react-konva, Zustand, shared-types | `<Board>`, `boardStore`, `useBoard`, `useSelection` |
| `collaboration` | Socket.io connection, cursor sync, presence, object sync | Socket.io-client, Zustand, board store | `<CursorOverlay>`, `<PresencePanel>`, `useSocket`, `SyncEngine` |
| `ai` | AI command input, API call, feedback display | collaboration (for broadcast), board store | `<AICommandBar>`, `useAICommand` |
| `toolbar` | Tool selection, shape/color pickers | board store | `<Toolbar>`, `<ShapePicker>`, `<ColorPicker>` |

**Server Modules:**

| Module | Responsibility | Depends On | Exports |
| --- | --- | --- | --- |
| `auth` | JWT verification, socket handshake auth | Clerk Node SDK | `verifyClerkJWT`, `socketAuthMiddleware` |
| `board` | Board and object persistence, REST routes | Mongoose, shared-types | `BoardRepository`, board REST router |
| `collaboration` | Socket event handlers, room management | Socket.io, board module | `CursorHandler`, `ObjectHandler`, `PresenceHandler`, `SocketManager` |
| `ai` | LLM integration, tool definitions, command execution | Gemini SDK, board module, collaboration module | `AIAgent`, `LLMAdapter`, AI REST router |

### 6.3 Key Interfaces (Dependency Inversion)

```typescript
// packages/shared-types/board-object.types.ts
interface BoardObject {
  id: string;
  boardId: string;
  type: ObjectType;
  x: number;
  y: number;
  width: number;
  height: number;
  createdBy: string;
  updatedAt: Date;
}

// apps/server/src/shared/interfaces/storage-adapter.ts
interface StorageAdapter {
  findObjectsByBoard(boardId: string): Promise<BoardObject[]>;
  createObject(obj: BoardObject): Promise<BoardObject>;
  updateObject(id: string, delta: Partial<BoardObject>): Promise<BoardObject>;
  deleteObject(id: string): Promise<void>;
}

// apps/server/src/shared/interfaces/transport-adapter.ts
interface TransportAdapter {
  broadcastToRoom(room: string, event: string, data: unknown): void;
  onConnection(handler: (socket: AuthenticatedSocket) => void): void;
}

// apps/server/src/shared/interfaces/llm-adapter.ts
interface LLMAdapter {
  executeWithTools(
    prompt: string,
    tools: ToolDefinition[],
    context: BoardState
  ): Promise<ToolCallResult[]>;
}
```

---

## 7. Data Model

### 7.1 MongoDB Collections

#### boards

```typescript
{
  _id: ObjectId,
  title: string,
  ownerId: string,           // Clerk user ID
  collaborators: string[],   // Clerk user IDs
  createdAt: Date,
  updatedAt: Date
}
```

#### objects

```typescript
{
  _id: ObjectId,
  boardId: ObjectId,          // Indexed
  type: "sticky_note" | "rectangle" | "circle" | "line" | "frame" | "connector" | "text",
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: number,
  content: string | null,     // Text content for sticky notes and text elements
  color: string,
  fontSize: number | null,
  fromObjectId: string | null, // For connectors
  toObjectId: string | null,   // For connectors
  connectorStyle: string | null,
  parentFrameId: string | null, // For frame grouping
  zIndex: number,
  createdBy: string,           // Clerk user ID
  updatedAt: Date
}
```

### 7.2 Indexes

- `objects.boardId` — Primary read path: load all objects for a board
- `boards.ownerId` — User's boards listing
- `boards.collaborators` — Shared boards lookup

### 7.3 Data Flow Rules

- Cursor positions are **never** persisted to MongoDB — they exist only in Socket.io server memory and client Konva refs.
- Object mutations are persisted to MongoDB via throttled batches (100ms debounce) to reduce write load.
- Board state is loaded from MongoDB as a single query on client connection; subsequent updates come via Socket.io.

---

## 8. Real-Time Sync Architecture

### 8.1 Socket.io Event Taxonomy

#### Cursor Events (fast path — no DB)

| Event | Direction | Payload |
| --- | --- | --- |
| `cursor:move` | Client → Server → All in room | `{ userId, name, x, y, color }` |

#### Object Events (medium path — optimistic + DB persist)

| Event | Direction | Payload |
| --- | --- | --- |
| `object:create` | Client → Server → All in room | `{ object: BoardObject }` |
| `object:move` | Client → Server → All in room | `{ objectId, x, y }` |
| `object:resize` | Client → Server → All in room | `{ objectId, width, height }` |
| `object:update` | Client → Server → All in room | `{ objectId, delta: Partial<BoardObject> }` |
| `object:delete` | Client → Server → All in room | `{ objectId }` |

#### Presence Events (lifecycle)

| Event | Direction | Payload |
| --- | --- | --- |
| `presence:join` | Server → All in room | `{ userId, name, avatar, color }` |
| `presence:leave` | Server → All in room | `{ userId }` |
| `presence:list` | Server → Connecting client | `{ users: User[] }` |

#### AI Events (broadcast AI results)

| Event | Direction | Payload |
| --- | --- | --- |
| `ai:executing` | Server → All in room | `{ userId, command }` |
| `ai:result` | Server → All in room | `{ objects: BoardObject[] }` |
| `ai:error` | Server → Requesting client | `{ error: string }` |

### 8.2 Room Management

Each board maps to a Socket.io room: `board:${boardId}`. On connection, the server verifies the Clerk JWT, resolves the user, joins the socket to the board room, loads the full board state from MongoDB, and sends it to the connecting client along with the current presence list.

### 8.3 Conflict Resolution

Last-write-wins at the object level. Each object mutation includes a timestamp. If two users edit the same object simultaneously, the last mutation received by the server wins. This is documented as acceptable per project requirements.

### 8.4 Optimistic UI Pattern

1. User performs action (e.g., moves sticky note)
2. Client immediately renders the mutation locally (perceived <1ms latency)
3. Client emits Socket.io event to server
4. Server validates, persists to MongoDB, broadcasts to room
5. Other clients receive broadcast and apply mutation
6. If server returns error, originating client rolls back to pre-mutation state

---

## 9. AI Agent Architecture

### 9.1 Command Flow

```text
User types "Create a SWOT analysis template"
    │
    ▼
Client: POST /api/ai/execute { command: "...", boardId: "..." }
    │
    ▼
Server: AIAgent.execute(command, boardContext)
    │
    ├─► getBoardState() — loads current objects for context
    │
    ├─► LLMAdapter.executeWithTools(prompt, tools, context)
    │       │
    │       ▼
    │   Gemini 2.0 Flash: plans multi-step tool calls
    │       │
    │       ▼
    │   Returns: [
    │     createFrame("Strengths", x1, y1, w, h),
    │     createFrame("Weaknesses", x2, y1, w, h),
    │     createFrame("Opportunities", x1, y2, w, h),
    │     createFrame("Threats", x2, y2, w, h),
    │     createStickyNote("Add items here", ...) × 4
    │   ]
    │
    ├─► AICommandExecutor: executes each tool call sequentially
    │       │
    │       ▼
    │   Creates objects in MongoDB, collects results
    │
    ├─► Socket.io broadcast: ai:result { objects: [...] }
    │
    ▼
All clients render new objects in real-time
```

### 9.2 Tool Schema (Minimum 9 Functions)

| Tool | Signature | Category |
| --- | --- | --- |
| `createStickyNote` | `(text, x, y, color)` | Creation |
| `createShape` | `(type, x, y, width, height, color)` | Creation |
| `createFrame` | `(title, x, y, width, height)` | Creation |
| `createConnector` | `(fromId, toId, style)` | Creation |
| `moveObject` | `(objectId, x, y)` | Manipulation |
| `resizeObject` | `(objectId, width, height)` | Manipulation |
| `updateText` | `(objectId, newText)` | Manipulation |
| `changeColor` | `(objectId, color)` | Manipulation |
| `getBoardState` | `()` | Context |

### 9.3 AI Performance Targets

| Metric | Target |
| --- | --- |
| Response latency | <2 seconds for single-step commands |
| Command breadth | 6+ command types (creation, manipulation, layout, complex) |
| Complexity | Multi-step operation execution |
| Reliability | Consistent, accurate execution |

---

## 10. Authentication & Authorization Flow

### 10.1 Authentication Flow

```text
1. User visits app → Clerk <SignIn /> component renders
2. User authenticates via Magic Link or Google OAuth
3. Clerk issues JWT (session token)
4. Client stores token, attaches to:
   - REST requests: Authorization: Bearer <token>
   - Socket.io handshake: socket.auth.token = <token>
5. Server verifies JWT on every REST request (Clerk Node middleware)
6. Server verifies JWT on Socket.io connection event (one-time handshake)
7. Unauthorized connections are rejected before room join
```

### 10.2 Authorization Model

| Resource | Permission | Enforcement |
| --- | --- | --- |
| Board | Owner: full access | Application-level check in board routes |
| Board | Collaborator: edit access | `collaborators[]` array contains userId |
| Socket room | Authenticated users only | JWT verified on handshake |
| AI commands | Any authenticated board member | Board membership check before execution |

---

## 11. Performance Strategy

### 11.1 Split State Architecture

| State Type | Update Frequency | Storage | React Integration |
| --- | --- | --- | --- |
| Auth, board metadata | Rare (login, board switch) | Zustand `authStore` | Standard React subscriptions |
| Object list | Medium (user actions, ~1-5/sec) | Zustand `boardStore` | Granular Zustand selectors |
| Cursor positions | High (30-60fps per user) | Direct Konva node refs | Bypasses React entirely |

### 11.2 Canvas Performance

- Konva Stage/Layer architecture: separate layers for grid, objects, cursors, and selection
- `requestAnimationFrame` for cursor rendering loop
- Cursor layer updates use `nodeRef.current.position({ x, y })` — no React reconciliation
- Konva handles 10,000+ nodes; 500-object target is well within bounds
- Direct Konva refs for drag operations to maintain 60fps during object manipulation

### 11.3 Network Optimization

- Cursor emit throttled to 30fps (33ms interval) — balances smoothness with bandwidth
- Object mutations debounced for MongoDB persistence (100ms batch window)
- Board state loaded once on connection; incremental updates via Socket.io thereafter
- No polling — all updates are push-based via persistent WebSocket

---

## 12. Testing Strategy

### 12.1 Testing Pyramid

| Level | Tool | Target | Coverage Goal |
| --- | --- | --- | --- |
| Unit | Vitest | Utility functions, coordinate math, AI command parsing, Zod schemas | 80% of utils |
| Integration | Vitest + socket.io-client + mongodb-memory-server | Socket handlers, board repository, AI tool execution | 60% of handlers |
| E2E | Playwright (multi-context) | Multiplayer sync, presence, AI commands, disconnect/reconnect | Critical paths |

### 12.2 Key Test Scenarios (from Project Requirements)

1. 2 users editing simultaneously in different browsers
2. One user refreshing mid-edit (state persistence check)
3. Rapid creation and movement of sticky notes and shapes (sync performance)
4. Network throttling and disconnection recovery
5. 5+ concurrent users without degradation

### 12.3 Mocking Strategy

- **Clerk auth:** MSW intercepts Clerk API calls, returns mock JWTs
- **Gemini AI:** Mocked responses for deterministic AI handler testing
- **MongoDB:** mongodb-memory-server for integration tests (real queries, in-memory DB)
- **Socket.io:** socket.io-client connects to test server instance

---

## 13. Deployment Architecture

### 13.1 Single Monolith on Render

```text
Render Web Service (Free Tier)
├── Static files: /dist/* → Vite production build (React SPA)
├── WebSocket: wss://collabboard.onrender.com/socket.io/
├── REST API: https://collabboard.onrender.com/api/*
└── API Docs: https://collabboard.onrender.com/api-docs (Swagger UI)
```

### 13.2 Environment Variables

```text
CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
MONGODB_URI=mongodb+srv://...
GEMINI_API_KEY=...
PORT=3000
NODE_ENV=production
```

### 13.3 CI/CD Pipeline

```text
git push to main
    │
    ▼
Render auto-deploy
    ├── bun install
    ├── bun run build (Vite frontend build)
    ├── bun run start (Express server with static serving)
    └── ~30s total build time
```

### 13.4 Scaling Path (Post-MVP)

| Trigger | Action | Cost |
| --- | --- | --- |
| Free tier sleep annoyance | Upgrade to Render Standard | $7/month |
| >1,000 concurrent sockets | Add Socket.io Redis adapter + second instance | $14/month + Redis |
| >512MB data | Upgrade to MongoDB M10 | $60/month |
| >10k MAU | Upgrade to Clerk Pro | $25/month |

---

## 14. Agile Breakdown — Epics & User Stories

### Build Priority Order

Per the project requirements, the build strategy follows this priority:

1. Cursor sync — Get two cursors moving across browsers
2. Object sync — Create sticky notes that appear for all users
3. Conflict handling — Handle simultaneous edits
4. State persistence — Survive refreshes and reconnects
5. Board features — Shapes, frames, connectors, transforms
6. AI commands (basic) — Single-step creation/manipulation
7. AI commands (complex) — Multi-step template generation

---

### EPIC 1: Project Foundation & Authentication

*Establishes the monolith skeleton, dev environment, and user authentication. Every subsequent Epic depends on this foundation.*

**US-1.1:** As a developer, I want to initialize a Bun monorepo with client (React 19 + Vite) and server (Express) workspaces so that the project structure supports modular development from day one.

**Acceptance Criteria:**

- `bun install` succeeds at the root
- `bun run dev` starts both client dev server and Express server concurrently
- TypeScript strict mode enabled across all workspaces
- ESLint flat config + Prettier configured
- `packages/shared-types` is importable from both client and server

**US-1.2:** As a developer, I want to deploy the skeleton monolith to Render so that there is a live deployment target from the first hour.

**Acceptance Criteria:**

- Git push to `main` triggers auto-deploy on Render
- Static files served from Express at root URL
- Health check endpoint at `/api/health` returns 200
- Build completes in under 60 seconds

**US-1.3:** As a user, I want to sign in with Google OAuth or a magic link so that I can access my boards without creating a password.

**Acceptance Criteria:**

- Clerk `<SignIn />` component renders on unauthenticated visit
- Google OAuth flow completes and redirects to the board
- Magic link email sends and completes authentication
- `<UserButton />` shows the authenticated user's avatar and name
- Unauthenticated users cannot access board routes

**US-1.4:** As a developer, I want Socket.io connections authenticated via Clerk JWT on handshake so that only logged-in users can join board rooms.

**Acceptance Criteria:**

- Socket.io client sends `socket.auth.token` from Clerk session
- Server verifies JWT on `connection` event using Clerk Node SDK
- Invalid or missing tokens result in connection rejection
- Valid connections proceed to room join

---

### EPIC 2: Infinite Canvas & Board Rendering

*Establishes the Konva.js canvas layer with pan, zoom, and the basic rendering pipeline. No multiplayer yet — single-user canvas interaction.*

**US-2.1:** As a user, I want an infinite canvas that I can pan by clicking and dragging the background so that I can navigate a large workspace.

**Acceptance Criteria:**

- Konva Stage renders fullscreen in the browser viewport
- Click-and-drag on empty canvas pans the viewport
- Pan is smooth at 60fps with no visible jank
- Canvas position persists during the session (doesn't reset on re-render)

**US-2.2:** As a user, I want to zoom in and out using my scroll wheel (or pinch gesture) so that I can see an overview or focus on details.

**Acceptance Criteria:**

- Scroll wheel zooms toward the cursor position
- Zoom range is bounded (e.g., 10% to 500%)
- Zoom is smooth and does not cause flickering
- Objects scale correctly with zoom level

**US-2.3:** As a user, I want to see a subtle grid or dot pattern on the canvas background so that I have spatial orientation while panning.

**Acceptance Criteria:**

- Background layer renders a repeating pattern
- Pattern scales appropriately with zoom
- Pattern does not interfere with object interaction

---

### EPIC 3: Board Objects — CRUD

*Adds the ability to create, render, edit, and delete board objects. Single-user only — sync comes in the next Epic.*

**US-3.1:** As a user, I want to create a sticky note by clicking a button in the toolbar and clicking on the canvas so that I can add text content to the board.

**Acceptance Criteria:**

- Toolbar contains a "Sticky Note" tool
- Clicking the canvas with the tool active creates a sticky note at that position
- Sticky note renders as a colored rectangle with text
- Sticky note is added to Zustand `boardStore`

**US-3.2:** As a user, I want to double-click a sticky note to edit its text inline so that I can change what it says.

**Acceptance Criteria:**

- Double-click opens an inline text editor on the sticky note
- Text changes are reflected on the canvas in real-time
- Clicking outside the editor or pressing Escape saves and closes
- Empty text is allowed (sticky note remains with no text)

**US-3.3:** As a user, I want to change the color of a sticky note so that I can visually categorize my ideas.

**Acceptance Criteria:**

- Selecting a sticky note shows a color picker in the toolbar or context menu
- Choosing a color immediately updates the sticky note's fill
- At least 6 color options are available

**US-3.4:** As a user, I want to create basic shapes (rectangle, circle, line) so that I can diagram and annotate on the board.

**Acceptance Criteria:**

- Toolbar contains tools for rectangle, circle, and line
- Each shape type renders correctly on the canvas with a solid fill color
- Shapes have configurable width, height (or radius), and color

**US-3.5:** As a user, I want to move objects by clicking and dragging them so that I can rearrange the board layout.

**Acceptance Criteria:**

- Any object can be dragged to a new position
- Drag is smooth at 60fps
- Object position updates in `boardStore` on drag end

**US-3.6:** As a user, I want to resize objects by dragging handles on the selection box so that I can adjust their size.

**Acceptance Criteria:**

- Selecting an object shows resize handles (corners and edges)
- Dragging a handle resizes the object proportionally or freely
- Minimum size is enforced to prevent zero-dimension objects

**US-3.7:** As a user, I want to delete selected objects by pressing the Delete/Backspace key so that I can remove items from the board.

**Acceptance Criteria:**

- Pressing Delete or Backspace removes all selected objects
- Objects are removed from `boardStore` and from the canvas
- Deletion is immediate with no confirmation dialog (speed over safety for MVP)

**US-3.8:** As a user, I want to select multiple objects by holding Shift and clicking, or by dragging a selection rectangle, so that I can move or delete groups.

**Acceptance Criteria:**

- Shift+click toggles individual objects in/out of selection
- Click-and-drag on empty canvas draws a selection rectangle
- All objects intersecting the selection rectangle are selected on release
- Selected objects show a unified bounding box

---

### EPIC 4: Real-Time Cursor Sync

*The first multiplayer capability. Two browsers see each other's cursors moving in real-time. This is the highest-priority sync feature.*

**US-4.1:** As a user, I want to see other users' cursors moving on the board in real-time so that I know where they are working.

**Acceptance Criteria:**

- Each connected user's cursor appears on all other clients
- Cursor movement is smooth with <50ms perceived latency
- Cursors are rendered on a dedicated Konva layer (not via React state)
- Cursor updates are emitted at 30fps (throttled)

**US-4.2:** As a user, I want to see each remote cursor labeled with the user's name so that I know who is where.

**Acceptance Criteria:**

- Each remote cursor displays the user's name (from Clerk profile)
- Name label is positioned near the cursor and readable at all zoom levels
- Each user's cursor has a unique color

**US-4.3:** As a user, I want remote cursors to disappear when a user leaves the board so that the presence display is accurate.

**Acceptance Criteria:**

- When a user disconnects, their cursor is removed within 2 seconds
- The removal is driven by Socket.io `disconnect` event
- No stale cursors remain on the canvas after disconnection

---

### EPIC 5: Real-Time Object Sync

*Extends the single-user object CRUD from Epic 3 to work across all connected clients in real-time.*

**US-5.1:** As a user, I want objects I create to appear on all other connected users' boards immediately so that we can collaborate in real-time.

**Acceptance Criteria:**

- Creating a sticky note or shape emits `object:create` via Socket.io
- All other clients in the same board room receive and render the new object
- Object appears within <100ms on remote clients

**US-5.2:** As a user, I want object movements to sync in real-time so that when I drag a sticky note, other users see it move.

**Acceptance Criteria:**

- Dragging an object emits `object:move` events
- Remote clients see the object move smoothly (interpolated if needed)
- Drag start and drag end positions are consistent across clients

**US-5.3:** As a user, I want text edits, color changes, and resizes to sync in real-time so that all users see the same board state.

**Acceptance Criteria:**

- `object:update` events broadcast all property changes
- Remote clients apply updates to their local store and re-render
- Changes are reflected within <100ms

**US-5.4:** As a user, I want object deletions to sync in real-time so that removed objects disappear for everyone.

**Acceptance Criteria:**

- `object:delete` removes the object from all clients
- Deleted objects are removed from MongoDB

---

### EPIC 6: Presence & Connection Resilience

*Completes the multiplayer experience with presence awareness, board loading, and disconnect/reconnect handling.*

**US-6.1:** As a user, I want to see a list of who is currently on the board so that I know who I'm collaborating with.

**Acceptance Criteria:**

- A presence panel or indicator shows connected users' names and avatars
- Users appear when they join and disappear when they leave
- The list updates within 2 seconds of a join/leave event

**US-6.2:** As a user, I want the full board state to load when I join so that I see all existing objects and can start collaborating immediately.

**Acceptance Criteria:**

- On Socket.io connection, server sends all objects for the board via `board:load`
- Client renders all objects from the loaded state
- Board load completes in <500ms for boards with up to 500 objects

**US-6.3:** As a user, I want the board to survive a page refresh so that I don't lose my work.

**Acceptance Criteria:**

- All objects persist in MongoDB
- Refreshing the page reconnects via Socket.io and reloads board state
- Board state after refresh matches state before refresh

**US-6.4:** As a user, I want the app to automatically reconnect if my network drops so that I don't lose my session.

**Acceptance Criteria:**

- Socket.io automatic reconnect with exponential backoff is enabled
- On reconnect, full board state is re-synced from server
- A visual indicator shows connection status (connected, reconnecting, disconnected)
- Buffered events during disconnect are sent on reconnect

---

### EPIC 7: Advanced Board Features

*Extends the board with frames, connectors, text elements, transforms, and operations required for the full feature set.*

**US-7.1:** As a user, I want to create frames that group and organize content areas so that I can structure my board visually.

**Acceptance Criteria:**

- Frames render as labeled rectangular regions
- Objects inside a frame can be moved with the frame (group drag)
- Frames have a title label and customizable dimensions

**US-7.2:** As a user, I want to draw connector lines or arrows between objects so that I can show relationships.

**Acceptance Criteria:**

- Connectors attach to source and target objects by ID
- Moving a connected object updates the connector's path
- At least two styles are available: line and arrow

**US-7.3:** As a user, I want to add standalone text elements to the board so that I can annotate without a sticky note background.

**Acceptance Criteria:**

- Text elements render as plain text on the canvas
- Text is editable inline on double-click
- Font size and color are configurable

**US-7.4:** As a user, I want to rotate objects so that I can orient them at any angle.

**Acceptance Criteria:**

- A rotation handle appears on selected objects
- Dragging the handle rotates the object around its center
- Rotation angle is persisted and synced

**US-7.5:** As a user, I want to duplicate selected objects so that I can quickly create copies.

**Acceptance Criteria:**

- A keyboard shortcut (Ctrl/Cmd+D) or toolbar button duplicates selected objects
- Duplicates are offset slightly from the original
- Duplicated objects are synced to all clients

**US-7.6:** As a user, I want to copy and paste objects so that I can reuse content across the board.

**Acceptance Criteria:**

- Ctrl/Cmd+C copies selected objects to a clipboard buffer
- Ctrl/Cmd+V pastes objects at the current cursor or viewport center
- Pasted objects are new objects (new IDs) and are synced

---

### EPIC 8: AI Board Agent — Basic Commands

*Introduces the AI agent with single-step creation and manipulation commands.*

**US-8.1:** As a user, I want a command bar where I can type natural language instructions to the AI agent so that I can manipulate the board with text.

**Acceptance Criteria:**

- A command bar is accessible via a keyboard shortcut (e.g., `/` or Ctrl+K)
- Typing a command and pressing Enter sends it to the AI endpoint
- A loading indicator shows while the AI processes
- Results appear on the board within <2 seconds for simple commands

**US-8.2:** As a user, I want to say "Add a yellow sticky note that says 'User Research'" and have it appear on the board so that I can create objects by voice/text.

**Acceptance Criteria:**

- The AI correctly parses the command and calls `createStickyNote`
- A yellow sticky note with text "User Research" appears on the canvas
- The note is positioned at a sensible default location (viewport center or near cursor)
- The created object syncs to all connected users

**US-8.3:** As a user, I want to say "Create a blue rectangle" and have a shape appear so that I can create shapes via AI.

**Acceptance Criteria:**

- The AI calls `createShape(type: "rectangle", color: "blue", ...)`
- A blue rectangle appears on the canvas
- Default dimensions are sensible if not specified

**US-8.4:** As a user, I want to say "Move all the pink sticky notes to the right side" so that the AI can manipulate existing objects.

**Acceptance Criteria:**

- The AI calls `getBoardState()` to find pink sticky notes
- It calls `moveObject()` for each matching object
- All matching objects move to the right side of the current viewport
- Movements sync to all connected users

**US-8.5:** As a user, I want to say "Change the sticky note color to green" and have the AI update the selected or specified object so that I can restyle objects via text.

**Acceptance Criteria:**

- The AI calls `changeColor(objectId, "green")`
- The target object's color updates on the canvas
- Change syncs to all connected users

**US-8.6:** As a user, I want all AI-generated results to appear for all connected users in real-time so that AI is a shared tool, not a private one.

**Acceptance Criteria:**

- AI results are broadcast via Socket.io `ai:result` event
- All clients in the room render AI-created or AI-modified objects
- An indicator shows which user triggered the AI command

---

### EPIC 9: AI Board Agent — Complex & Layout Commands

*Extends the AI agent with multi-step operations, layout commands, and template generation.*

**US-9.1:** As a user, I want to say "Arrange these sticky notes in a grid" and have the AI reposition objects into an organized layout so that I can tidy my board.

**Acceptance Criteria:**

- The AI reads board state, identifies relevant objects
- Objects are repositioned into a grid with consistent spacing
- Grid arrangement respects object dimensions

**US-9.2:** As a user, I want to say "Create a SWOT analysis template" and have 4 labeled quadrants appear so that I can use structured thinking tools.

**Acceptance Criteria:**

- The AI plans and executes multiple tool calls sequentially
- Four frames appear labeled Strengths, Weaknesses, Opportunities, Threats
- Frames are positioned in a 2×2 grid
- Each frame contains at least one starter sticky note

**US-9.3:** As a user, I want to say "Build a user journey map with 5 stages" and have a multi-object template appear so that I can quickly set up workshop structures.

**Acceptance Criteria:**

- The AI creates 5 labeled frames or columns
- Columns are evenly spaced horizontally
- Each column contains a header and placeholder content
- Template generation completes in <5 seconds

**US-9.4:** As a user, I want to say "Set up a retrospective board" and get columns for "What Went Well," "What Didn't," and "Action Items" so that I can run a retro session.

**Acceptance Criteria:**

- Three frames or labeled columns are created
- Columns have correct titles
- Layout is clean and ready for collaboration

**US-9.5:** As a user, I want multiple users to issue AI commands simultaneously without conflict so that the AI is truly collaborative.

**Acceptance Criteria:**

- Two users can submit AI commands at the same time
- Both commands execute and produce results without overwriting each other
- Results from both commands appear on all clients

---

### EPIC 10: Testing, Documentation & Polish

*Covers testing targets, API documentation, the demo video, the development log, and final submission requirements.*

**US-10.1:** As a developer, I want unit tests for utility functions (coordinate math, AI command parsing, Zod schemas) so that core logic is verified.

**Acceptance Criteria:**

- Vitest test files exist for all utility modules
- Tests pass with `bun run test`
- Coverage meets 60% target for utility code

**US-10.2:** As a developer, I want integration tests for Socket.io handlers using socket.io-client and mongodb-memory-server so that real-time sync logic is verified.

**Acceptance Criteria:**

- Tests simulate two clients connecting to a test server
- Object creation, movement, and deletion events are tested
- Cursor sync events are tested for latency and correctness

**US-10.3:** As a developer, I want Playwright E2E tests that open two browser contexts and verify real-time sync so that the multiplayer contract is proven.

**Acceptance Criteria:**

- At least one Playwright test opens two browser windows
- One window creates an object; the other window asserts it appears
- Network throttling test verifies reconnect behavior

**US-10.4:** As a developer, I want Swagger API documentation auto-generated at `/api-docs` so that the REST API is discoverable.

**Acceptance Criteria:**

- `swagger-ui-express` serves interactive docs at `/api-docs`
- All REST routes are documented with request/response schemas
- AI execution endpoint is documented with example payloads

**US-10.5:** As a developer, I want to produce a 3-5 minute demo video showing real-time collaboration, AI commands, and architecture explanation so that the submission is complete.

**Acceptance Criteria:**

- Video demonstrates two users collaborating in real-time
- Video shows at least 3 AI commands (creation, manipulation, complex)
- Video includes a brief architecture overview
- Video is 3-5 minutes in length

**US-10.6:** As a developer, I want to complete the AI Development Log and AI Cost Analysis so that my AI-first methodology is documented.

**Acceptance Criteria:**

- 1-page AI Development Log covers: tools & workflow, MCP usage, effective prompts (3-5), code analysis (% AI-generated), strengths & limitations, key learnings
- AI Cost Analysis includes: actual dev spend, production projections for 100/1K/10K/100K users with assumptions

---

## 15. Risk Register

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Bun compatibility issue with a dependency | Low | Medium | Fall back to Node.js; Express/Socket.io are verified on Bun |
| Render free tier sleep during demos | Medium | Medium | Uptime ping service; upgrade to Standard ($7/month) if needed |
| Gemini rate limits hit during testing | Low | Low | Implement backoff queue; rate limits are 1,500 req/min |
| MongoDB M0 512MB fills during development | Low | Low | Reset test data; production boards are small (<1MB per board) |
| Socket.io connection storm on demo day | Medium | Medium | Test with 5+ concurrent users before demo; Render handles ~1,000 connections |
| Konva performance with 500+ objects | Low | Medium | Verified: Konva handles 10,000+ nodes; use layer separation |
| Clerk outage during demo | Very Low | High | Accept risk; no self-hosted auth alternative in 24h |
| AI agent produces incorrect layouts | Medium | Low | Mocked tests for known commands; fallback to manual creation |

---

## 16. Document Cross-References

| Document | Contents | Path |
| --- | --- | --- |
| Pre-Search Checklist | Constraints, architecture discovery, post-stack refinement, cost analysis | `1-PRE-SEARCH-CHECKLIST.md` |
| Tech Stack Options | Per-layer option analysis with rationale | `2-TECH-STACK-OPTIONS.md` |
| Identify Tradeoffs | Elaborated tradeoffs for each stack choice | `3-IDENTIFY-TRADEOFFS.md` |
| Record Architecture Decisions | 12 ADRs with context, decision, rationale, consequences | `4-RECORD-ARCHITECTURE-DECISIONS.md` |
| Project Requirements | MVP gate, features, testing scenarios, submission requirements | `G4 Week 1 - CollabBoard (1).pdf` |
| Project Coding Rule | React 19, Vite, Bun, Tailwind v4, shadcn, Konva | `.cursor/rules/collab-board-rule.mdc` |

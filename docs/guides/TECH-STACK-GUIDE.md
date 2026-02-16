# Tech Stack Guide

In-depth guide to each technology in the Collab-Board stack: what it is, why it’s used, key concepts, API surface used in this project, and gotchas. For “why” decisions, see [Record Architecture Decisions](../research/4-RECORD-ARCHITECTURE-DECISIONS.md) (ADRs) and [Design Document](../research/5-BASIC-DESIGN-DOCUMENT.md).

---

## Runtime & language

### Bun

- **Why here:** ~30% faster cold starts (e.g. on Render), native TypeScript (no ts-node), single lockfile (`bun.lockb`), faster installs. See [ADR-007](../research/4-RECORD-ARCHITECTURE-DECISIONS.md#adr-007-bun-as-runtime-over-nodejs).
- **Concepts:** Drop-in Node-compatible runtime; use `bun run`, `bun install`, `bunx` (replaces npx). Run `.ts` files directly.
- **In this project:** Server runs on Bun; client is built with Vite (Bun or Node can run Vite). Use Bun only — no npm/yarn/pnpm per project rules.
- **Gotchas:** Some npm packages assume Node APIs; Express, Socket.io, Vite, MongoDB driver are well-supported on Bun.

### TypeScript

- **Config:** Strict mode, `noImplicitAny`. Shared config in root; apps may extend.
- **Conventions:** Named exports only; `import type { ... }` for type-only imports; no `any`.

---

## Frontend

### React 19

- **Why here:** Team and project rules; SPA is sufficient; react-konva integrates cleanly. See [2-TECH-STACK-OPTIONS](../research/2-TECH-STACK-OPTIONS.md).
- **Concepts:** Function components only, hooks, no SSR. No `React.FC`; return type `ReactElement` (or `JSX.Element`).
- **In this project:** `apps/client` (or root `src/` before monorepo). Max 2 `useEffect` per file; extract logic to custom hooks. Components as `React.memo` where they don’t depend on frequently changing props.
- **Gotchas:** High-frequency updates (cursors) must bypass React via Konva refs to avoid reconciliation cost.

**Docs:** [react.dev](https://react.dev/reference/react)

### Vite

- **Why here:** Fast HMR and builds, first-class TypeScript and React, works with Bun.
- **Concepts:** Dev server, HMR, production build; env vars with `VITE_` prefix.
- **In this project:** Frontend build and dev server; config in `vite.config.ts`; path alias (e.g. `~/`) for imports.
- **Gotchas:** Only `VITE_*` env vars are exposed to client code.

**Docs:** [vite.dev/guide](https://vite.dev/guide/)

### Tailwind CSS v4

- **Why here:** Utility-first speed; matches project rule; no CSS-in-JS. See [ADR-012](../research/4-RECORD-ARCHITECTURE-DECISIONS.md#adr-012-tailwind-css-v4--shadcnui-for-styling).
- **Concepts:** Utility classes; v4 uses `@tailwindcss/vite` and new config approach.
- **In this project:** Global styles and component classes; theme/shadcn in `tailwind.config.ts` (or app config).
- **Gotchas:** Class names can be long; avoid inline styles.

**Docs:** [tailwindcss.com/docs](https://tailwindcss.com/docs)

### shadcn/ui

- **Why here:** Accessible, customizable components as source code (not a heavy dependency). See [ADR-012](../research/4-RECORD-ARCHITECTURE-DECISIONS.md#adr-012-tailwind-css-v4--shadcnui-for-styling).
- **Concepts:** Copy-paste components into the repo; Tailwind + Radix primitives; `components.json` for CLI.
- **In this project:** Buttons, modals, inputs, dialogs, dropdowns in `src/components/ui/` (or client app equivalent).
- **Gotchas:** Components are React-only; theming is via CSS variables.

**Docs:** [ui.shadcn.com/docs](https://ui.shadcn.com/docs)

---

## Canvas

### Konva.js + react-konva

- **Why here:** Declarative shapes (Rect, Circle, Line, Text), Stage/Layer model, pan/zoom, events; React binding via react-konva; cursors use direct refs for 60fps. See [ADR-008](../research/4-RECORD-ARCHITECTURE-DECISIONS.md#adr-008-konvajs-react-konva-for-canvas-rendering).
- **Concepts:** `Stage` → `Layer` → nodes (Rect, Circle, Line, Text, etc.). Coordinates in stage space; draggable stage for pan, scale for zoom. Transformer for resize/rotate. Refs to Konva nodes for imperative updates.
- **In this project:** Layers: grid (background), objects (board elements), selection (Transformer), cursors (top; updated via refs only). See [Design Document §11.2](../research/5-BASIC-DESIGN-DOCUMENT.md#112-canvas-performance).
- **API surface:** `Stage`, `Layer`, `Rect`, `Circle`, `Line`, `Text`, `Transformer`; `nodeRef.current.position({ x, y })` for cursor updates.
- **Gotchas:** Updating cursor position via React state at 30fps causes re-renders and jank; always use direct ref updates for the cursor layer. Konva is 2D canvas, not WebGL.

**Docs:** [konvajs.org/docs](https://konvajs.org/docs/), [react-konva](https://konvajs.org/docs/react/index.html)

---

## State management

### Zustand + direct Konva refs

- **Why here:** Context at 30fps kills performance; Zustand gives granular subscriptions; cursors bypass React via Konva refs for <50ms sync. See [ADR-002](../research/4-RECORD-ARCHITECTURE-DECISIONS.md#adr-002-zustand--direct-konva-refs-for-split-state-management).
- **Concepts:** Zustand stores (e.g. `authStore`, `boardStore`, `collaborationStore`); selectors to limit re-renders. Boundary: ~5+ updates/sec → Konva refs; else Zustand. See [Glossary](GLOSSARY.md) (slow state / fast state).
- **In this project:** Auth, board metadata, object list in Zustand; cursor positions in a Map of Konva node refs, updated in a requestAnimationFrame or throttle loop.
- **Gotchas:** Two mental models; document which state lives where. Testing cursor state needs Konva node assertions.

**Docs:** [zustand.docs.pmnd.rs](https://zustand.docs.pmnd.rs/)

---

## Real-time transport

### Socket.io

- **Why here:** Firebase/Supabase latency (100–300ms) violates <50ms cursor spec; Socket.io on the monolith gives 10–30ms, rooms, reconnect. See [ADR-001](../research/4-RECORD-ARCHITECTURE-DECISIONS.md#adr-001-socketio-over-firebasesupabase-for-real-time-transport).
- **Concepts:** Persistent connection; rooms (`board:${boardId}`); handshake auth (`socket.auth.token` = Clerk JWT). Client: connect with auth, emit/listen. Server: verify JWT on connection, attach handlers, broadcast to room.
- **In this project:** Full event catalog in [SOCKET-EVENTS-REFERENCE.md](SOCKET-EVENTS-REFERENCE.md). Client: SyncEngine or equivalent; server: handlers in `apps/server/src/modules/collaboration/handlers/`.
- **Gotchas:** Auth must be verified before joining rooms; invalid token should disconnect. Cursor traffic never touches the DB.

**Docs:** [socket.io/docs/v4](https://socket.io/docs/v4/), [client API](https://socket.io/docs/v4/client-api/)

---

## Backend

### Express (monolith)

- **Why here:** Single deploy target: static files, REST API, Socket.io in one process; no CORS between our own services; always-on (no cold start). See [ADR-004](../research/4-RECORD-ARCHITECTURE-DECISIONS.md#adr-004-express-monolith-over-microservicesserverless).
- **Concepts:** Middleware (CORS, Clerk JWT, error handler); routes for health, boards, AI; Socket.io attached to same HTTP server.
- **In this project:** Key routes: `GET /api/health`, board CRUD, `POST /api/ai/execute`. Static serve of Vite build in production. See [API-REFERENCE.md](API-REFERENCE.md).
- **Gotchas:** All concerns share one process; use error-handling middleware so a route crash doesn’t take down the Socket server.

**Docs:** [expressjs.com](https://expressjs.com/en/4x/api.html)

---

## Data layer

### MongoDB Atlas + Mongoose

- **Why here:** Document store fits schemaless board objects; zero migrations during iteration; simple read pattern (load by `boardId`). See [ADR-005](../research/4-RECORD-ARCHITECTURE-DECISIONS.md#adr-005-mongodb-atlas-over-firebase-firestoresupabase-postgres).
- **Concepts:** Collections: `boards`, `objects`. Indexes: `objects.boardId`, `boards.ownerId`, `boards.collaborators`. Cursors are not persisted.
- **In this project:** Mongoose schemas for Board and BoardObject; BoardRepository implements StorageAdapter. Throttled writes (e.g. 100ms batch) for object mutations. See [Design Document §7](../research/5-BASIC-DESIGN-DOCUMENT.md#7-data-model).
- **Gotchas:** No referential integrity at DB level; validate with Zod at the app layer. M0 free tier 512MB limit.

**Docs:** [mongodb.com/docs/atlas](https://www.mongodb.com/docs/atlas/), [mongoosejs.com](https://mongoosejs.com/docs/)

---

## Authentication

### Clerk (React + Node SDK)

- **Why here:** Pre-built React components (SignIn, UserButton); JWT works with Socket handshake; 10k MAU free. See [ADR-006](../research/4-RECORD-ARCHITECTURE-DECISIONS.md#adr-006-clerk-for-authentication).
- **Concepts:** Magic link + Google OAuth; Clerk issues JWT. Client: REST `Authorization: Bearer <token>`, Socket `socket.auth.token = token`. Server: verify JWT on every REST request and once on Socket connection.
- **In this project:** React: `<SignIn />`, `<UserButton />`, `useAuth`, `useClerkToken`. Server: Clerk Node SDK to verify JWT; reject Socket connection if invalid.
- **Gotchas:** Token must be sent on Socket handshake; don’t join rooms before verification. See [Design Document §10](../research/5-BASIC-DESIGN-DOCUMENT.md#10-authentication--authorization-flow).

**Docs:** [clerk.com/docs](https://clerk.com/docs), [Backend overview](https://clerk.com/docs/references/backend/overview)

---

## AI

### Google Gemini 2.0 Flash

- **Why here:** Lower cost than GPT-4; 1M token context (full board state); OpenAI-compatible API; <2s for single-step. See [ADR-003](../research/4-RECORD-ARCHITECTURE-DECISIONS.md#adr-003-google-gemini-20-flash-for-ai-board-agent).
- **Concepts:** REST `POST /api/ai/execute` with `{ command, boardId }`. Server: load board state, call Gemini with tool definitions (createStickyNote, moveObject, getBoardState, etc.), execute tool calls, persist to MongoDB, broadcast `ai:result` via Socket.io.
- **In this project:** AIAgent orchestrator; LLMAdapter interface (Gemini impl); tools in `server/.../ai/tools/`. Tool list in [Design Document §9.2](../research/5-BASIC-DESIGN-DOCUMENT.md#92-tool-schema-minimum-9-functions) and [SOCKET-EVENTS-REFERENCE](SOCKET-EVENTS-REFERENCE.md#ai-events-broadcast-ai-results).
- **Gotchas:** Rate limits (1,500 req/min free tier); monitor and add backoff if needed. Quality may lag GPT-4 on complex layout; acceptable for MVP.

**Docs:** [Gemini API models](https://ai.google.dev/gemini-api/docs/models), [Quickstart](https://ai.google.dev/gemini-api/docs/quickstart)

---

## Validation

### Zod

- **In this project:** All server inputs (REST body, query, and Socket payloads) validated with Zod schemas. Shared types can live in `packages/shared-types` and be validated on both sides where needed.
- **Gotchas:** Never build MongoDB queries from raw user input; always parse and validate first.

**Docs:** [zod.dev](https://zod.dev/)

---

## Testing

### Vitest + Playwright + MSW + mongodb-memory-server

- **Why here:** Vitest is Vite-native and fast; Playwright supports multi-context for multiplayer E2E; MSW mocks Clerk; mongodb-memory-server for integration tests without Atlas. See [ADR-011](../research/4-RECORD-ARCHITECTURE-DECISIONS.md#adr-011-vitest--playwright-for-testing).
- **Concepts:** Unit/integration with Vitest; E2E with Playwright (two browser contexts for sync tests); MSW for auth; in-memory MongoDB for handler tests.
- **In this project:** Unit: utils, coordinate math, AI parsing, Zod schemas. Integration: Socket handlers with socket.io-client + mongodb-memory-server. E2E: real-time sync, disconnect/reconnect. Mock Gemini responses for AI route tests.
- **Gotchas:** Jest docs often need translating to Vitest. Playwright E2E is slower; use for critical paths. 60% coverage target for MVP.

**Docs:** [vitest.dev](https://vitest.dev/guide/), [playwright.dev](https://playwright.dev/docs/intro), [MSW](https://mswjs.io/docs/), [mongodb-memory-server](https://github.com/nodkz/mongodb-memory-server)

---

## Infrastructure

### Render

- **Why here:** Free tier web service; Git push → deploy; always-on for WebSockets. See [ADR-010](../research/4-RECORD-ARCHITECTURE-DECISIONS.md#adr-010-render-free-tier-for-hosting-and-deployment).
- **Concepts:** Single web service runs the Express monolith (static + API + Socket.io). Env vars set in Render dashboard.
- **Gotchas:** Free tier sleeps after ~15 min inactivity; first request after sleep is slow. Use uptime ping or upgrade to Standard ($7/mo) if needed.

**Docs:** [docs.render.com](https://docs.render.com/)

### Swagger / OpenAPI

- **In this project:** `swagger-ui-express` serves interactive API docs at `/api-docs`. Auto-generate from Express routes where possible. See [API-REFERENCE.md](API-REFERENCE.md).

**Docs:** [swagger.io/docs](https://swagger.io/docs/)

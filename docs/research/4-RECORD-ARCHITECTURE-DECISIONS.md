# Record Architecture Decisions

**Project:** Collab-Board — Real-Time Collaborative Whiteboard with AI Agent  
**Date:** February 16, 2026  
**Author:** [Your Name]  
**Status:** Accepted — Ready for MVP Implementation

This document records the key architecture decisions for the Collab-Board project using the Architecture Decision Record (ADR) format. Each decision is traceable to project constraints (24h MVP gate, $0 launch budget, <50ms cursor latency, 5+ concurrent users) and defensible against alternatives considered. For full option analysis see [2-TECH-STACK-OPTIONS.md](2-TECH-STACK-OPTIONS.md); for tradeoff elaboration see [3-IDENTIFY-TRADEOFFS.md](3-IDENTIFY-TRADEOFFS.md); for constraints and architecture see [1-PRE-SEARCH-CHECKLIST.md](1-PRE-SEARCH-CHECKLIST.md).

---

## ADR-001: Socket.io over Firebase/Supabase for Real-Time Transport

**Status:** Accepted

**Context:** The project requires <50ms cursor sync latency between 5+ concurrent users, with real-time object creation, presence awareness, and graceful disconnect/reconnect. The 24h MVP gate demands a transport layer that works on day one with minimal configuration.

**Decision:** Use Socket.io running on the Express monolith for all real-time communication — cursor movement, object CRUD broadcasts, and presence events. Rooms are scoped per board (`board:${id}`).

**Rationale:**

- Firebase Firestore and Realtime DB introduce 100–300ms latency due to the database-as-transport model, violating the <50ms cursor spec outright.
- Supabase Realtime uses Postgres Change Data Capture, which adds write-to-DB overhead before broadcasting — unsuitable for high-frequency cursor events that should never touch persistent storage.
- Socket.io provides persistent WebSocket connections with 10–30ms round-trip on Render, built-in rooms for board isolation, automatic reconnect with exponential backoff, and HTTP long-polling fallback.
- Running Socket.io in the same process as the Express API eliminates CORS between services and reduces deployment targets to one.

**Consequences:**

- We own and operate the WebSocket server: connection limits, backpressure, and monitoring are our responsibility.
- Horizontal scaling requires adding the Socket.io Redis adapter when concurrent users exceed single-instance capacity (~1,000 connections).
- No managed real-time DB means cursor state lives only in server memory — acceptable since cursors are ephemeral and don't need persistence.

**Alternatives Rejected:**

| Alternative | Rejection Reason |
| --- | --- |
| Firebase Realtime DB | 100–300ms latency violates <50ms cursor spec |
| Supabase Realtime | DB-write-first model adds unnecessary latency for ephemeral cursor data |
| Raw WebSockets | Would require reimplementing rooms, reconnect, fallbacks, and multiplexing from scratch |

---

## ADR-002: Zustand + Direct Konva Refs for Split State Management

**Status:** Accepted

**Context:** The whiteboard has two fundamentally different state update patterns: slow state (auth, board metadata, object list) that changes on user actions, and fast state (cursor positions) that updates at 30–60fps per connected user. React's reconciliation cycle cannot handle both without performance degradation.

**Decision:** Use Zustand for slow state (auth context, board metadata, object list) and direct Konva ref mutations for fast state (cursor positions). Cursors bypass React entirely.

**Rationale:**

- Context API at 30fps cursor updates causes app-wide re-renders across the component tree, killing frame rate and introducing visible jank.
- Redux adds significant boilerplate (actions, reducers, selectors) for minimal benefit over Zustand in a solo-developer, time-constrained sprint.
- Zustand provides granular subscriptions — only components that read a specific slice re-render when that slice changes.
- Konva's imperative API (`nodeRef.current.position({ x, y })`) allows cursor layer updates at 60fps without triggering React reconciliation, achieving the <50ms sync target.

**Consequences:**

- Two mental models coexist: declarative Zustand for slow state and imperative Konva refs for fast state. Developers must know the boundary.
- The boundary is documented and enforced by convention: anything that updates more than ~5 times/second goes through Konva refs, everything else through Zustand.
- Testing fast state requires Konva-aware assertions rather than standard React Testing Library patterns.

**Alternatives Rejected:**

| Alternative | Rejection Reason |
| --- | --- |
| Context API (sole state) | App-wide re-renders at 30fps = performance death |
| Redux | Excessive boilerplate for 24h MVP; no advantage over Zustand for this use case |
| Jotai | Viable but Zustand was the more familiar and project-aligned choice |

---

## ADR-003: Google Gemini 2.0 Flash for AI Board Agent

**Status:** Accepted

**Context:** The AI agent must support 6+ command types (creation, manipulation, layout, complex templates), respond in <2s for single-step commands, and operate within a $0 development budget. The agent needs full board context to execute layout and multi-step commands intelligently.

**Decision:** Use Google Gemini 2.0 Flash with OpenAI-compatible function calling for all AI board operations.

**Rationale:**

- ~90% cost reduction versus GPT-4 ($0.075 vs $0.70+ per 1M input tokens), keeping development costs under $1 and production costs viable at scale ($1.50/month at 100 users, $150/month at 10,000 users).
- 1M token context window allows sending the full board state (`getBoardState()`) for complex commands like "arrange these sticky notes in a grid" or "create a SWOT analysis template" without truncation.
- Sub-second latency for simple creation commands, <2s for multi-step layout operations — meets the performance target.
- OpenAI-compatible API means the integration code can migrate to GPT-4, Claude, or other providers with minimal changes if Gemini quality proves insufficient.

**Consequences:**

- Rate limits (1,500 req/min on free tier) need monitoring. At scale, concurrent AI commands from multiple users could approach limits during demo bursts.
- Model quality on nuanced layout reasoning may lag GPT-4 or Claude — acceptable for MVP scope (creation, manipulation, grid layout, templates).
- Vendor dependency on Google; mitigated by OpenAI-compatible API specification.

**Alternatives Rejected:**

| Alternative | Rejection Reason |
| --- | --- |
| OpenAI GPT-4 | ~10x cost ($0.70+/1M tokens); budget constraint violation for development and production |
| Anthropic Claude | Similar cost concerns; no OpenAI-compatible API at time of evaluation |
| Groq | Fast inference but smaller context window; Gemini's 1M context fits board-state use case better |

---

## ADR-004: Express Monolith over Microservices/Serverless

**Status:** Accepted

**Context:** The application has three server-side concerns — static file serving, REST API for AI commands, and WebSocket transport for real-time sync. The 24h MVP gate demands minimal deployment complexity and zero cold-start latency.

**Decision:** Deploy a single Express monolith on Bun that serves the static React build, the Socket.io WebSocket server, and the REST API from one process on Render.

**Rationale:**

- Single deploy target: one `git push` triggers one build (~30s with Bun) and one service restart. No deployment coordination, no service discovery, no inter-service networking.
- Zero CORS issues: the API, WebSocket upgrade, and static assets share the same origin.
- Zero cold starts: Render's always-on web service keeps the process running, which is mandatory for persistent WebSocket connections.
- Serverless (Lambda) was rejected because WebSocket connections cannot persist across invocations, and cold starts (500ms–3s) violate the latency requirements.

**Consequences:**

- Scaling is vertical first (Render Pro tier). Horizontal scaling requires the Socket.io Redis adapter to share connection state across instances.
- No scale-to-zero: the service runs continuously even with zero users, consuming the Render free tier allocation.
- All concerns share one process — a crash in the AI route handler could theoretically take down the WebSocket server. Mitigated by Express error handling middleware and process-level restart on Render.

**Alternatives Rejected:**

| Alternative | Rejection Reason |
| --- | --- |
| Microservices | Deployment coordination, network latency between services, and CORS configuration add complexity beyond 24h MVP scope |
| Serverless (Lambda) | Cold starts violate latency requirements; WebSocket persistence is unsupported or requires API Gateway v2 with added complexity |
| Separate frontend/backend deploys | Unnecessary CORS configuration and two deployment targets for no benefit at MVP scale |

---

## ADR-005: MongoDB Atlas over Firebase Firestore/Supabase Postgres

**Status:** Accepted

**Context:** Board objects (sticky notes, shapes, frames, connectors, text elements) have divergent schemas — a sticky note has `text` and `color`, a shape has `type`, `width`, `height`, a frame has `title` and child references. The 24h MVP demands zero migration overhead during rapid iteration.

**Decision:** Use MongoDB Atlas (M0 free tier) as the document store for boards and board objects.

**Rationale:**

- Document model naturally fits schemaless board objects with divergent fields per type. No migrations needed when adding new object types or properties during the sprint.
- Read pattern is simple: load all objects for a board on connection (`db.objects.find({ boardId })`). One indexed query satisfies the primary read path.
- Cursor traffic stays entirely in Socket.io server memory and never touches the database, keeping write volume to object CRUD operations only (throttled to 100ms batches).
- M0 free tier (512MB) is sufficient for development and launch with 5–20 users.

**Consequences:**

- No referential integrity at the database level. Schema discipline is enforced at the application layer via Zod validation.
- At scale, aggregation queries and compound indexes require careful design — acceptable since MVP access patterns are simple (query by `boardId`, write individual objects).
- 512MB storage limit on M0; upgrade to M10 ($60/month) when persistent data grows beyond free tier.

**Alternatives Rejected:**

| Alternative | Rejection Reason |
| --- | --- |
| Firebase Firestore | 100–300ms latency (rejected alongside Firebase Realtime in ADR-001); per-read/write pricing model less predictable |
| Supabase (Postgres) | Schema migrations for divergent object types during rapid iteration week would slow development |
| AWS DynamoDB | Adds operational complexity (IAM, provisioned throughput) for a simple query-by-boardId access pattern |

---

## ADR-006: Clerk for Authentication

**Status:** Accepted

**Context:** The MVP requires user authentication (hard gate requirement), multiplayer cursor labels with user names, and board-level access control. The 24h deadline means authentication infrastructure must be functional within 1–2 hours.

**Decision:** Use Clerk (React SDK + Node SDK) for authentication with JWT verification on the Socket.io handshake.

**Rationale:**

- Pre-built React components (`<SignIn />`, `<UserButton />`, `<SignedIn />`) save 4–6 hours of UI development compared to building auth screens from scratch.
- Magic links + Google OAuth provide passwordless UX — no password hashing, storage, or reset flow to implement.
- JWT tokens from Clerk are verified on the Socket.io `connection` event (`socket.auth.token`), securing WebSocket connections without custom middleware.
- 10,000 MAU free tier is sufficient for development, testing, and launch.

**Consequences:**

- Vendor dependency: if Clerk changes pricing, has an outage, or deprecates features, the auth layer is affected.
- Mitigated by standard JWT and OAuth protocols — migration path to Lucia (self-hosted) or another provider is documented and involves swapping the SDK, not rewriting auth logic.
- Clerk adds a third-party JavaScript bundle to the frontend — acceptable for MVP, monitorable via Lighthouse.

**Alternatives Rejected:**

| Alternative | Rejection Reason |
| --- | --- |
| Firebase Auth | Ties project to Firebase ecosystem when all other Firebase services were rejected |
| Supabase Auth | Viable, but Clerk's React component library integrates faster for MVP timeline |
| Custom JWT | 4–6 hours of implementation time (login UI, token generation, refresh flow, password handling) — unacceptable under 24h gate |

---

## ADR-007: Bun as Runtime over Node.js

**Status:** Accepted

**Context:** The development sprint is 24 hours for MVP, 7 days total. Every minute of tooling friction — slow installs, transpilation steps, cold starts — compounds against the deadline. The server runs TypeScript throughout.

**Decision:** Use Bun as the JavaScript/TypeScript runtime for both the development environment and production server.

**Rationale:**

- ~30% faster cold starts on Render compared to Node.js, reducing deployment feedback loops.
- Native TypeScript execution without `ts-node` or a separate build step for the server — write `.ts`, run `.ts`.
- Single lockfile (`bun.lockb`) and faster dependency installation reduce `node_modules` friction.
- Built-in bundler available as fallback, though Vite handles frontend builds.

**Consequences:**

- Smaller ecosystem than Node.js: some npm packages assume Node-specific APIs (`fs`, `crypto`, `child_process` internals).
- For this stack (Express, Socket.io, Vite, MongoDB driver), Bun compatibility is verified and solid.
- Team members unfamiliar with Bun need to learn minor CLI differences (`bun install`, `bun run`, `bunx`).

**Alternatives Rejected:**

| Alternative | Rejection Reason |
| --- | --- |
| Node.js + npm | Slower cold starts, requires ts-node for TypeScript, larger node_modules |
| Node.js + pnpm | Faster installs than npm but still requires ts-node; Bun's native TS support is the primary differentiator |

---

## ADR-008: Konva.js (react-konva) for Canvas Rendering

**Status:** Accepted

**Context:** The whiteboard requires an infinite canvas with pan/zoom, declarative shape rendering (sticky notes, rectangles, circles, lines, frames, connectors), object transforms (move, resize, rotate), hit detection, and event handling. The canvas must support 500+ objects at 60fps.

**Decision:** Use Konva.js with the react-konva binding for all canvas rendering.

**Rationale:**

- React integration via react-konva allows declarative shape composition (`<Rect />`, `<Circle />`, `<Line />`, `<Text />`) within the React component tree for object-level rendering.
- Stage/Layer architecture maps directly to the whiteboard model: a background layer for the grid, an objects layer for board elements, and a cursor layer for multiplayer cursors.
- Built-in pan/zoom (Stage `draggable` + `scaleX`/`scaleY`), transformer nodes for resize/rotate handles, and hit-region event handling come out of the box.
- High-frequency cursor updates bypass react-konva and use direct `nodeRef` mutations for 60fps without React reconciliation (see ADR-002).
- Konva handles 10,000+ nodes, well beyond the 500-object performance target.

**Consequences:**

- Konva uses a 2D canvas context — no WebGL acceleration. For this whiteboard use case (shapes, text, connectors), 2D canvas performance is sufficient and simpler to debug.
- react-konva has a smaller community than the React DOM ecosystem; some patterns require Konva-native solutions rather than standard React approaches.

**Alternatives Rejected:**

| Alternative | Rejection Reason |
| --- | --- |
| Fabric.js | Different abstraction model (object-centric rather than layer-centric); less direct React integration |
| PixiJS | Optimized for WebGL game rendering (sprites, particles); overkill for declarative whiteboard shapes and adds GPU complexity |
| Vanilla HTML5 Canvas | Would require building shape management, pan/zoom, hit detection, event delegation, and transforms from scratch — weeks of work |

---

## ADR-009: Optimistic UI with Server Reconciliation

**Status:** Accepted

**Context:** Object creation and movement must feel instantaneous to the user performing the action (<50ms perceived latency), while still broadcasting reliably to all connected collaborators and persisting to MongoDB.

**Decision:** Render all local object mutations immediately on the client (optimistic update), emit the event via Socket.io, and roll back only if the server returns an error acknowledgment.

**Rationale:**

- Waiting for the MongoDB round-trip before rendering would add 30–100ms of perceived latency on every drag, creation, and edit — violating the UX target.
- Optimistic rendering provides <1ms perceived latency for the acting user. The Socket.io broadcast delivers the update to other clients within 10–30ms.
- Conflict resolution uses last-write-wins, which is documented and acceptable per project requirements.
- Rollback on server error is rare in practice (validation failures, permission denials) and handled by reverting the Zustand store to pre-mutation state.

**Consequences:**

- Brief visual inconsistency is possible: a user might see their optimistic update momentarily before a server rejection rolls it back.
- Last-write-wins can cause data loss in true simultaneous edits to the same object — acceptable per project spec and mitigated by the low probability of exact-same-object collisions.
- DB write batching (100ms throttle) means persistence lags slightly behind in-memory state — a crash between emission and persistence could lose the most recent batch.

---

## ADR-010: Render (Free Tier) for Hosting and Deployment

**Status:** Accepted

**Context:** The project requires a publicly accessible deployed application with WebSocket support, zero cold starts for real-time sync, and a $0 infrastructure budget for development and launch.

**Decision:** Deploy the Express monolith on Render's free web service tier with Git-push auto-deploy.

**Rationale:**

- Free tier provides always-on web service with WebSocket upgrade support — both mandatory for persistent Socket.io connections.
- Git push to `main` triggers auto-deploy with Bun build completing in ~30s, enabling rapid iteration during the sprint.
- Single service hosts static frontend, WebSocket server, and REST API (see ADR-004), keeping deployment simple.
- No edge/SSR requirement for a whiteboard SPA eliminates Vercel's primary advantage.

**Consequences:**

- Free tier sleeps after 15 minutes of inactivity. Demo or testing sessions after idle periods will hit a cold wake (~10–30s). Mitigated by uptime ping services or upgrading to Render Standard ($7/month).
- No geographic distribution or edge caching — all users connect to a single region. Acceptable for 5–20 user launch scale.
- Resource limits on free tier (512MB RAM, shared CPU) may constrain concurrent user capacity under load.

**Alternatives Rejected:**

| Alternative | Rejection Reason |
| --- | --- |
| Vercel | Optimized for serverless/edge; WebSocket support requires workarounds; always-on behavior not native |
| Firebase Hosting | Would pair naturally with Firebase backend, which was rejected in ADR-001 and ADR-005 |
| AWS (EC2/ECS) | Operational overhead (VPC, security groups, load balancers) far exceeds MVP scope |

---

## ADR-011: Vitest + Playwright for Testing

**Status:** Accepted

**Context:** The project requires testing of real-time sync behavior, AI command execution, multiplayer scenarios, and network resilience. The 60% coverage target for MVP focuses on the most critical paths: sync logic and AI command handlers.

**Decision:** Use Vitest for unit and integration tests, and Playwright for end-to-end multiplayer testing.

**Rationale:**

- Vitest is Vite-native and runs 2–5x faster than Jest for the same test suite, reducing feedback loops during the sprint.
- Playwright supports multiple browser contexts in a single test — essential for testing two users editing simultaneously, verifying real-time sync, and simulating disconnect/reconnect scenarios.
- Integration tests use `socket.io-client` paired with `mongodb-memory-server` to test Socket.io handlers against a real (in-memory) database without external dependencies.
- MSW mocks Clerk authentication in tests; Gemini responses are mocked for deterministic AI handler testing.

**Consequences:**

- Vitest has fewer community examples than Jest — some patterns require translation from Jest documentation.
- Playwright E2E tests are slower than unit tests (~5–15s per scenario) but necessary for verifying the core multiplayer contract.
- 60% coverage is a pragmatic MVP target; critical sync and AI paths are covered, but edge cases in UI interaction may be deferred.

**Alternatives Rejected:**

| Alternative | Rejection Reason |
| --- | --- |
| Jest | Slower execution than Vitest; not Vite-native; requires separate configuration |
| Cypress | Single browser context model makes multiplayer testing difficult; Playwright's multi-context support is a better fit |

---

## ADR-012: Tailwind CSS v4 + shadcn/ui for Styling

**Status:** Accepted

**Context:** The whiteboard UI consists of a toolbar, sidebar panels (layers, properties, presence), modals (auth, settings), and the Konva canvas. UI development time must be minimized to prioritize real-time sync and AI agent work.

**Decision:** Use Tailwind CSS v4 for utility-first styling and shadcn/ui for pre-built accessible components.

**Rationale:**

- Tailwind's utility classes enable rapid UI prototyping without writing custom CSS files or managing class name collisions.
- shadcn/ui provides accessible, customizable components (buttons, modals, inputs, dialogs, dropdowns) as copy-paste code rather than a heavy npm dependency — components are owned and modifiable.
- Both align with the project rule (`.cursor/rules/collab-board-rule.mdc`) and the team's known stack, eliminating learning overhead.

**Consequences:**

- Tailwind class names can become verbose in complex layouts — acceptable given the speed benefit.
- shadcn/ui components are React-specific; if framework migration were ever needed, these would require rewriting. Not a concern for this project.

---

## Cross-Cutting Decision Summary

| Constraint | How the Architecture Addresses It |
| --- | --- |
| **24h MVP gate** | Monolith deployment (ADR-004), Clerk pre-built auth (ADR-006), Bun native TS (ADR-007), shadcn/ui components (ADR-012) |
| **$0 launch budget** | Render free tier (ADR-010), MongoDB M0 (ADR-005), Clerk 10k MAU free (ADR-006), Gemini Flash pricing (ADR-003) |
| **<50ms cursor latency** | Socket.io persistent connections (ADR-001), direct Konva ref mutations (ADR-002), optimistic UI (ADR-009) |
| **5+ concurrent users** | Socket.io rooms (ADR-001), Konva 10k+ node capacity (ADR-008), horizontal scaling path via Redis adapter (ADR-004) |
| **<2s AI response** | Gemini Flash sub-second simple commands (ADR-003), synchronous REST endpoint in monolith (ADR-004) |
| **Speed-to-ship vs scale** | All decisions favor the 7-day sprint; scaling paths (Redis adapter, Render upgrade, MongoDB M10) are documented but not built |
| **Vendor lock-in** | Standard protocols throughout: JWT (Clerk → Lucia), OpenAI-compatible API (Gemini → GPT-4/Claude), Socket.io (portable WebSocket abstraction) |

---

## Decision Log

| ADR | Decision | Date | Status |
| --- | --- | --- | --- |
| ADR-001 | Socket.io for real-time transport | 2026-02-16 | Accepted |
| ADR-002 | Zustand + Konva refs for split state | 2026-02-16 | Accepted |
| ADR-003 | Gemini 2.0 Flash for AI agent | 2026-02-16 | Accepted |
| ADR-004 | Express monolith architecture | 2026-02-16 | Accepted |
| ADR-005 | MongoDB Atlas for persistence | 2026-02-16 | Accepted |
| ADR-006 | Clerk for authentication | 2026-02-16 | Accepted |
| ADR-007 | Bun as runtime | 2026-02-16 | Accepted |
| ADR-008 | Konva.js for canvas rendering | 2026-02-16 | Accepted |
| ADR-009 | Optimistic UI with reconciliation | 2026-02-16 | Accepted |
| ADR-010 | Render for hosting | 2026-02-16 | Accepted |
| ADR-011 | Vitest + Playwright for testing | 2026-02-16 | Accepted |
| ADR-012 | Tailwind v4 + shadcn/ui for styling | 2026-02-16 | Accepted |

---

## Sources & References

- [1-PRE-SEARCH-CHECKLIST.md](1-PRE-SEARCH-CHECKLIST.md) — constraints, architecture, key decisions, cost analysis
- [2-TECH-STACK-OPTIONS.md](2-TECH-STACK-OPTIONS.md) — per-layer option analysis with rationale
- [3-IDENTIFY-TRADEOFFS.md](3-IDENTIFY-TRADEOFFS.md) — elaborated tradeoffs for each stack choice
- [G4 Week 1 - Collab-Board (1).pdf](../G4%20Week%201%20-%20CollabBoard%20(1).pdf) — project requirements, MVP gate, Possible Paths table, Pre-Search appendix

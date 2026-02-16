# Identify Tradeoffs

**Project:** Collab-Board — Real-Time Collaborative Whiteboard with AI Agent  
**Date:** February 16, 2026  
**Status:** Elaborated from Tech Stack Report

This document spells out the tradeoffs of the chosen stack for the Collab-Board MVP. Each decision is defensible against the project constraints (24h MVP gate, $0 launch budget, &lt;50ms cursor latency). For the full option analysis and rationale, see [2-TECH-STACK-OPTIONS.md](2-TECH-STACK-OPTIONS.md); for constraints and architecture, see [1-PRE-SEARCH-CHECKLIST.md](1-PRE-SEARCH-CHECKLIST.md).

---

## Runtime: Bun

- **Decision:** Bun as runtime (replacing Node.js with npm/yarn/pnpm).
- **Benefits:** ~30% faster cold starts on Render, native TypeScript (no ts-node), single lockfile, built-in bundler. Reduces iteration friction and `node_modules` bloat during the 24h MVP window.
- **Costs / risks:** Smaller ecosystem than Node; some packages assume Node-specific APIs or behavior.
- **Alternatives rejected:** Node.js was rejected for slower cold starts and extra tooling (ts-node) when speed-to-ship was critical.
- **Mitigation:** The chosen stack (Express, Socket.io, Vite) is well-supported on Bun; compatibility is solid for this project.

---

## Frontend Framework: React 19

- **Decision:** React 19 with TypeScript, function components, and hooks (SPA, no SSR).
- **Benefits:** Team and project rules already align; react-konva integrates cleanly. SPA is sufficient for a whiteboard; no SEO or SSR requirement.
- **Costs / risks:** Vue/Svelte can yield smaller bundles; React’s reconciliation can be costly at high update rates.
- **Alternatives rejected:** Vue/Svelte/vanilla would require new patterns and possibly conflict with project rules; React was the known path.
- **Mitigation:** High-frequency cursor updates bypass React entirely via direct Konva refs, so the 60 FPS and &lt;50ms cursor targets are met without fighting reconciliation.

---

## Build Tool: Vite

- **Decision:** Vite for frontend build and dev server.
- **Benefits:** Fast HMR and builds, first-class TypeScript and React support, works with Bun. Aligns with known stack and project rule.
- **Costs / risks:** Turbopack is newer and can be faster in some scenarios; we may leave some performance on the table.
- **Alternatives rejected:** Webpack is slower for dev; Turbopack is less battle-tested for our stack.
- **Mitigation:** Vite is sufficient for MVP; no need to chase marginal build gains during the 7-day sprint.

---

## Canvas Rendering: Konva.js (react-konva)

- **Decision:** Konva.js with react-konva for the whiteboard canvas.
- **Benefits:** Declarative shapes (Rect, Circle, Line, Text), Stage/Layer model, pan/zoom, and event handling fit Miro-like objects. React integration via react-konva; high-frequency cursor updates use direct refs to avoid re-renders and hit 60 FPS.
- **Costs / risks:** PixiJS is stronger for games and particles; Fabric has a different abstraction. Konva is not the best fit for every canvas use case.
- **Alternatives rejected:** Fabric.js has a different mental model and less direct React integration. PixiJS is optimized for games/WebGL, not declarative whiteboard objects. Vanilla canvas would require far more custom code for shapes, pan/zoom, and events.
- **Mitigation:** None required; Konva is the right fit for this use case (objects + transforms + pan/zoom).

---

## Styling: Tailwind CSS v4 + shadcn/ui

- **Decision:** Tailwind v4 plus shadcn/ui for UI styling and components.
- **Benefits:** Matches known stack and project rule. Utility-first speeds UI work; shadcn provides accessible, customizable components (buttons, modals, inputs) without a heavy dependency.
- **Costs / risks:** Tailwind class names can be verbose; some purging/config nuance with v4.
- **Alternatives rejected:** CSS Modules or styled-components add more setup and cognitive load; no need for CSS-in-JS complexity for this app.
- **Mitigation:** None needed; tradeoff is acceptable and well understood.

---

## State Management: Zustand + Direct Konva Refs

- **Decision:** Zustand for auth, board metadata, and object list; direct Konva ref updates for cursor positions.
- **Benefits:** Context API at 30fps cursor updates would cause app-wide re-renders and kill performance. Zustand gives granular subscriptions so only affected components re-render. Cursors bypass React entirely via Konva ref updates for 60fps and &lt;50ms sync.
- **Costs / risks:** Two mental models (Zustand for “slow” state, imperative refs for “fast” state); developers must know where each kind of state lives.
- **Alternatives rejected:** Redux adds boilerplate; Context API fails at high update rates; Jotai is viable but Zustand was chosen for simplicity and project alignment.
- **Mitigation:** Document and enforce boundaries: slow state (auth, board, objects) in Zustand; fast state (cursor positions) only in Konva refs.

---

## Real-Time Transport: Socket.io

- **Decision:** Socket.io for WebSocket transport (cursors, objects, presence).
- **Benefits:** Firebase Firestore/Realtime has 100–300ms latency and would violate the &lt;50ms cursor spec. Socket.io on Render gives 10–30ms cursor updates with persistent connections, rooms (`board:${id}`), and automatic reconnect. Fits monolith deployment (same process as API).
- **Costs / risks:** We operate and scale our own WebSocket server; no managed real-time DB. At scale we own connection limits, backpressure, and horizontal scaling.
- **Alternatives rejected:** Firebase Realtime DB and Supabase Realtime were rejected primarily on latency. Raw WebSockets would require reimplementing rooms, reconnect, and fallbacks.
- **Mitigation:** Use Socket.io Redis adapter for horizontal scaling when concurrent users exceed single-instance limits; document scaling path in architecture.

---

## Database: MongoDB Atlas (M0)

- **Decision:** MongoDB Atlas (M0 free tier) as the document store for boards and objects.
- **Benefits:** Document store fits schemaless board objects (sticky notes, shapes, frames with divergent fields). Zero migrations during rapid iteration. Read pattern: board load on connection (single query by `boardId`). Cursor traffic stays in Socket.io memory and does not hit the DB.
- **Costs / risks:** No strong relational constraints or referential integrity; schema discipline is on us. At very large scale, aggregation and indexing require care.
- **Alternatives rejected:** Firebase Firestore was rejected on latency and cost model. Supabase (Postgres) would require migrations for schema churn. DynamoDB adds complexity for our access pattern (query by boardId).
- **Mitigation:** Index on `boardId`; use aggregation and careful queries as scale grows. Relational constraints are not required for boards/objects in this MVP.

---

## Authentication: Clerk

- **Decision:** Clerk (React SDK + Node SDK) for auth; JWT verification on Socket.io handshake.
- **Benefits:** Pre-built React components save 4–6 hours. Magic links + Google OAuth avoid password handling. JWT works with Socket.io (`socket.auth.token`). 10k MAU free tier is enough for launch.
- **Costs / risks:** Vendor dependency; if Clerk changes pricing or we outgrow free tier, we must adapt or migrate.
- **Alternatives rejected:** Firebase Auth ties us to Firebase ecosystem. Supabase Auth is viable but Clerk’s React UX was faster to integrate. Custom JWT would cost too much time for the 24h gate.
- **Mitigation:** Standard JWT and protocols; migration path to Lucia (or similar) is documented if we need to swap later.

---

## AI Integration: Google Gemini 2.0 Flash

- **Decision:** Google Gemini 2.0 Flash for the AI board agent (OpenAI-compatible API).
- **Benefits:** ~90% cost reduction vs GPT-4 ($0.075 vs $0.70+ per 1M tokens), 1M token context (full board state for complex layout commands), OpenAI-compatible API for easier migration. Sub-second latency for simple commands, &lt;2s for multi-step.
- **Costs / risks:** Rate limits (1,500 req/min on free tier); must monitor at scale. Model quality may lag GPT-4/Claude on some tasks.
- **Alternatives rejected:** GPT-4/Claude were rejected on cost for dev and production projections. Groq was considered but Gemini’s context window and pricing fit board-state use cases better.
- **Mitigation:** Monitor rate limits; quality is sufficient for creation, manipulation, layout, and templates. If limits bite, upgrade tier or add queue/backoff.

---

## Backend Architecture: Express Monolith

- **Decision:** Express monolith on Bun: one service serving static frontend, WebSocket server, and REST API.
- **Benefits:** Single deploy target for 24h MVP. No CORS between our own services, no cold starts (always-on Render). WebSocket + API + static hosting in one process.
- **Costs / risks:** Scaling is vertical first, then horizontal with Socket.io Redis adapter. No serverless scale-to-zero; we accepted zero cold-start tolerance.
- **Alternatives rejected:** Microservices would add deployment coordination and network latency for the MVP. Serverless (Lambda) was rejected due to cold starts and WebSocket complexity.
- **Mitigation:** Redis adapter for Socket.io when horizontal scaling is needed; document scaling in architecture.

---

## Hosting/Deployment: Render

- **Decision:** Render (free web service tier) for the monolith.
- **Benefits:** Free tier for dev and launch; Git push → auto-deploy, Bun build ~30s. Single service serves static build, Socket.io upgrade, and REST. Always-on avoids cold starts.
- **Costs / risks:** Free tier sleeps after 15min inactivity; demos or testing after idle can hit cold wake. No edge/SSR (not required for whiteboard SPA).
- **Alternatives rejected:** Vercel is optimized for serverless/edge; WebSocket support and always-on behavior fit Render better. Firebase Hosting would pair with Firebase backend we did not choose. AWS adds operational overhead for MVP.
- **Mitigation:** Uptime ping to prevent sleep during critical testing, or upgrade to Render Standard ($7/month) if sleep causes issues.

---

## Testing: Vitest + Playwright

- **Decision:** Vitest for unit and integration tests; Playwright for E2E (multiplayer, real-time sync, throttling, disconnect recovery).
- **Benefits:** Vitest is Vite-native and fast; Playwright supports multiple browser contexts for realistic multiplayer E2E. 60% coverage target for MVP. MSW for Clerk; mocked Gemini for AI routes.
- **Costs / risks:** Jest has more community examples and snippets; Vitest is newer. Cypress has different tradeoffs than Playwright for our multi-context needs.
- **Alternatives rejected:** Jest was rejected in favor of Vitest for speed and Vite integration. Cypress was rejected in favor of Playwright for multi-context and stability in our scenarios.
- **Mitigation:** 60% coverage focus on sync logic and AI handlers; use socket.io-client and mongodb-memory-server for integration tests.

---

## Cross-Cutting Tradeoffs

- **Speed-to-ship vs long-term scale:** Choices favor the 24h MVP and 7-day deadline. Scaling (Redis adapter, Render upgrade, DB indexing) is documented for later; we did not over-engineer for scale in week one.
- **Cost vs control:** $0 target drove free tiers (Render, MongoDB M0, Clerk). We accepted operational ownership of the Socket.io server and MongoDB in exchange for latency control and no per-seat real-time pricing.
- **Vendor lock-in:** Accepted for Clerk and Gemini with explicit swap paths: standard JWT and protocols (Clerk → Lucia), OpenAI-compatible API (Gemini → other providers). Lock-in is bounded and acceptable for MVP.

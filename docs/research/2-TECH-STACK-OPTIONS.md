# Tech Stack Options

**Project:** Collab-Board — Real-Time Collaborative Whiteboard with AI Agent  
**Date:** February 16, 2026  
**Author:** [Your Name]  
**Status:** Decisions locked — Ready for MVP Implementation

---

## Stack Summary Table

| Layer | Chosen Technology |
| ------- | ------------------- |
| Runtime | Bun |
| Frontend Framework | React 19 |
| Build Tool | Vite |
| Canvas Rendering | Konva.js (react-konva) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| State Management | Zustand + direct Konva refs |
| Real-Time Transport | Socket.io |
| Database | MongoDB Atlas |
| Authentication | Clerk |
| AI Integration | Google Gemini 2.0 Flash |
| Backend Architecture | Express monolith |
| Hosting/Deployment | Render |
| Testing | Vitest + Playwright |

---

## Per-Layer Breakdown

### Runtime

| | |
| -- | -- |
| **Options Considered** | Bun, Node.js (npm/yarn/pnpm) |
| **Chosen** | Bun |
| **Why** | 30% faster cold starts on Render, native TypeScript (no ts-node), single lockfile, built-in bundler. Reduces iteration friction and `node_modules` bloat during the 24h MVP window. |
| **Tradeoffs** | Smaller ecosystem than Node; some packages assume Node. For this stack (Express, Socket.io, Vite) compatibility is solid. |

---

### Frontend Framework

| | |
| -- | -- |
| **Options Considered** | React 19, Vue, Svelte, Vanilla JS (per PDF "any framework with canvas support") |
| **Chosen** | React 19 |
| **Why** | Team already knows React; project rule enforces React 19 + TypeScript + function components + hooks. SPA is sufficient (no SSR). Konva integrates via react-konva. |
| **Tradeoffs** | Vue/Svelte can yield smaller bundles; React’s reconciliation is bypassed for high-frequency cursor updates anyway via direct Konva refs. |

---

### Build Tool

| | |
| -- | -- |
| **Options Considered** | Vite, Webpack, Turbopack |
| **Chosen** | Vite |
| **Why** | Fast HMR and builds, first-class TypeScript and React support, works with Bun. Aligns with known stack and cursor rule. |
| **Tradeoffs** | Turbopack is newer/faster in some cases; Vite is battle-tested and sufficient for MVP. |

---

### Canvas Rendering

| | |
| -- | -- |
| **Options Considered** | Konva.js, Fabric.js, PixiJS, HTML5 Canvas (vanilla) |
| **Chosen** | Konva.js with react-konva |
| **Why** | React integration via react-konva; declarative shapes (Rect, Circle, Line, Text), Stage/Layer model, pan/zoom, and event handling fit whiteboard objects. High-frequency cursor updates use direct refs to avoid React re-renders and hit 60 FPS. |
| **Tradeoffs** | PixiJS is stronger for games/particles; Fabric has different abstraction. Konva is the right fit for Miro-like objects and transforms. |

---

### Styling

| | |
| -- | -- |
| **Options Considered** | Tailwind v4 + shadcn/ui, CSS Modules, styled-components |
| **Chosen** | Tailwind CSS v4 + shadcn/ui |
| **Why** | Matches known stack and project rule. Utility-first speeds UI work; shadcn provides accessible, customizable components (buttons, modals, inputs) without heavy dependency. |
| **Tradeoffs** | Tailwind class names can be verbose; purging and v4 config are well understood. No need for CSS-in-JS complexity. |

---

### State Management

| | |
| -- | -- |
| **Options Considered** | Zustand + direct Konva refs, Redux, Context API, Jotai |
| **Chosen** | Zustand (auth, board metadata, object list) + direct Konva refs (cursor positions) |
| **Why** | Context API at 30fps cursor updates causes app-wide re-renders and kills performance. Zustand gives granular subscriptions so only affected components re-render. Cursors bypass React entirely via Konva ref updates for 60fps and &lt;50ms sync. |
| **Tradeoffs** | Two mental models (Zustand vs imperative refs); documented and scoped so slow state stays in Zustand, fast state in Konva. |

---

### Real-Time Transport

| | |
| -- | -- |
| **Options Considered** | Socket.io, Firebase Realtime DB, Supabase Realtime, raw WebSockets |
| **Chosen** | Socket.io |
| **Why** | Firebase Firestore/Realtime has 100–300ms latency and violates the &lt;50ms cursor spec. Socket.io on Render gives 10–30ms cursor updates with persistent connections, rooms (`board:${id}`), and automatic reconnect. Fits monolith deployment (same process as API). |
| **Tradeoffs** | We operate and scale our own WebSocket server (Redis adapter later for horizontal scaling). No managed real-time DB; acceptable for MVP and control over latency. |

---

### Database

| | |
| -- | -- |
| **Options Considered** | MongoDB Atlas, Firebase Firestore, Supabase (Postgres), AWS DynamoDB |
| **Chosen** | MongoDB Atlas (M0 free tier) |
| **Why** | Document store fits schemaless board objects (sticky notes, shapes, frames with different fields). Zero migrations during rapid iteration. Read pattern: board load on connection (single query by `boardId`). Cursor traffic stays in Socket.io memory and does not hit the DB. |
| **Tradeoffs** | No strong relational constraints; not needed for boards/objects. At scale, indexing and aggregation are sufficient. |

---

### Authentication

| | |
| -- | -- |
| **Options Considered** | Clerk, Firebase Auth, Supabase Auth, custom JWT |
| **Chosen** | Clerk (React SDK + Node SDK) |
| **Why** | Pre-built React components save 4–6 hours. Magic links + Google OAuth avoid password handling. JWT verification on Socket.io handshake (`socket.auth.token`) secures WebSocket. 10k MAU free tier is enough for launch. Swappable to Lucia later if needed. |
| **Tradeoffs** | Vendor dependency; acceptable for MVP. Standard JWT and protocols keep migration path open. |

---

### AI Integration

| | |
| -- | -- |
| **Options Considered** | Google Gemini 2.0 Flash, OpenAI GPT-4, Anthropic Claude, Groq |
| **Chosen** | Google Gemini 2.0 Flash |
| **Why** | ~90% cost reduction vs GPT-4 ($0.075 vs $0.70+ per 1M tokens), 1M token context (full board state for complex layout commands), OpenAI-compatible API for easier migration. Sub-second latency for simple commands, &lt;2s for multi-step. |
| **Tradeoffs** | Rate limits (1,500 req/min free tier); monitor at scale. Model quality vs GPT-4/Claude is sufficient for creation/manipulation/layout and templates. |

---

### Backend Architecture

| | |
| -- | -- |
| **Options Considered** | Express monolith, microservices, serverless (Lambda) |
| **Chosen** | Express monolith (Bun runtime) |
| **Why** | Single deploy target for 24h MVP: static frontend, WebSocket server, and REST API in one process. No CORS between our own services, no cold starts (always-on Render). WebSocket + API + static hosting together. |
| **Tradeoffs** | Scaling is vertical first, then horizontal with Socket.io Redis adapter. No serverless scale-to-zero; cold start tolerance was zero. |

---

### Hosting/Deployment

| | |
| -- | -- |
| **Options Considered** | Render, Vercel, Firebase Hosting, AWS |
| **Chosen** | Render (free web service tier) |
| **Why** | Free tier for dev and launch; Git push → auto-deploy, Bun build ~30s. Single service serves static build, Socket.io upgrade, and REST. Always-on avoids cold starts. |
| **Tradeoffs** | Free tier sleeps after 15min inactivity; uptime ping or upgrade to $7/month if needed. No edge/SSR; not required for whiteboard SPA. |

---

### Testing

| | |
| -- | -- |
| **Options Considered** | Vitest + Playwright, Jest + Cypress |
| **Chosen** | Vitest (unit + integration) + Playwright (E2E) |
| **Why** | Vitest for utility functions (coordinate math, AI command parsing) and Socket.io handlers (socket.io-client + mongodb-memory-server). Playwright for multiplayer E2E (two browser contexts, real-time sync, throttling, disconnect recovery). 60% coverage target for MVP. MSW for Clerk; mocked Gemini for AI routes. |
| **Tradeoffs** | Jest has more examples; Vitest is faster and Vite-native. Playwright over Cypress for multi-context and stability. |

---

## Final Stack At-a-Glance

- **Runtime:** Bun  
- **Language:** TypeScript (strict, noImplicitAny)  
- **Frontend:** React 19 + Vite + Tailwind v4 + shadcn/ui  
- **Canvas:** Konva.js + react-konva  
- **State:** Zustand + direct Konva refs for cursors  
- **Real-time:** Socket.io  
- **Database:** MongoDB Atlas (M0)  
- **Auth:** Clerk (React + Node SDK, JWT on Socket.io)  
- **AI:** Google Gemini 2.0 Flash (OpenAI-compatible)  
- **Backend:** Express monolith on Bun  
- **Hosting:** Render (monolith: static + WebSocket + REST)  
- **Testing:** Vitest (unit/integration) + Playwright (E2E)  
- **API Docs:** Swagger/OpenAPI (swagger-ui-express) at `/api-docs`  

---

## Sources & References

- [Pre-Search Checklist (0-PRE-SEARCH-CHECKLIST.md)](0-PRE-SEARCH-CHECKLIST.md) — constraints, architecture, key decisions, cost analysis  
- [G4 Week 1 - Collab-Board (1).pdf](../G4%20Week%201%20-%20CollabBoard%20(1).pdf) — project requirements, MVP gate, Possible Paths table, Pre-Search appendix  
- Project rule: `.cursor/rules/collab-board-rule.mdc` — React 19, Vite, Bun, Tailwind v4, shadcn, Konva

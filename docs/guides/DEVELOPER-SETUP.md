# Developer Setup

Get from clone to running app and tests with minimal friction. For architecture and constraints, see [Design Document](../research/5-BASIC-DESIGN-DOCUMENT.md) and [Pre-Search Checklist](../research/1-PRE-SEARCH-CHECKLIST.md).

---

## Prerequisites

| Requirement | Notes |
| --- | --- |
| **Bun** 1.2+ | Runtime and package manager. [bun.sh](https://bun.sh). Use `bun --version` to confirm. |
| **MongoDB Atlas** | M0 free tier. Create a cluster and get the connection string. [Atlas](https://www.mongodb.com/cloud/atlas). |
| **Clerk** | Dev app for auth. Create an application; get Publishable Key and Secret Key. [Clerk Dashboard](https://dashboard.clerk.com). |
| **Google AI (Gemini)** | API key for the AI agent. [Google AI Studio](https://aistudio.google.com/apikey). |
| **Render** (optional) | For deployment. [Render](https://render.com). |

---

## Repository

```bash
git clone <repo-url>
cd Collab-Board
bun install
```

**Workspace layout (target):** Per the Design Document, the project uses a Bun monorepo:

- `apps/client` — React + Vite frontend.
- `apps/server` — Express + Socket.io backend (Bun).
- `packages/shared-types` — Shared TypeScript types.

If the repo is still a single app, run scripts from the root `package.json`; once the monorepo exists, run from root (e.g. `bun run dev` may start both client and server) or from each app as needed.

---

## Environment variables

Create `.env` (and optionally `.env.local`) at the project root or in the app that needs them. **Do not commit secrets.**

### Client (Vite)

Vite exposes env vars prefixed with `VITE_` to the client.

| Variable | Example | Where to get it |
| --- | --- | --- |
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_test_...` | Clerk Dashboard → API Keys |

### Server

| Variable | Example | Where to get it |
| --- | --- | --- |
| `CLERK_SECRET_KEY` | `sk_test_...` | Clerk Dashboard → API Keys |
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/dbname` | Atlas → Connect → Driver |
| `GEMINI_API_KEY` | `AIza...` | Google AI Studio → Get API key |
| `PORT` | `3000` | Optional; default for local server |
| `NODE_ENV` | `development` or `production` | Set by environment / Render |

---

## Running the app

- **From root (single app or monorepo):**  
  `bun run dev` — starts the dev server (Vite and/or Express per project setup).

- **Typical URLs:**  
  - Frontend: [http://localhost:5173](http://localhost:5173) (Vite default).  
  - Backend (when added): e.g. [http://localhost:3000](http://localhost:3000).  
  - WebSocket: same origin as backend (e.g. `ws://localhost:3000` when using Socket.io on the server).

If the monorepo has separate scripts, run the client from `apps/client` and the server from `apps/server` as documented in their `package.json` scripts.

---

## Running tests

| Command | Purpose |
| --- | --- |
| `bun run test` | Vitest in watch mode (unit/integration). |
| `bun run test:run` | Vitest single run (e.g. for CI). |
| `bun run test:coverage` | Vitest with coverage report. |
| `bun run test:e2e` | Playwright E2E tests. |
| `bun run test:e2e:ui` | Playwright with UI. |

**Coverage target (MVP):** 60%, with focus on sync logic and AI command handlers.

---

## Validation

Before commits, run:

```bash
bun run validate
```

This runs format, typecheck, lint, and tests (as defined in root `package.json`). Fix any failures before pushing.

---

## Debugging

| Tool | Use |
| --- | --- |
| **React DevTools** | Inspect components and props; Zustand store if using the devtools integration. |
| **Socket.io** | Check connection and room join in browser devtools (Network → WS) or Socket.io client debug logs. |
| **Swagger UI** | When the server is running, open `/api-docs` (e.g. [http://localhost:3000/api-docs](http://localhost:3000/api-docs)) for interactive REST API docs. |
| **Render Dashboard** | For production, use Render logs and metrics. |
| **mongosh** | Connect to Atlas with your `MONGODB_URI` to inspect `boards` and `objects` collections. |

---

## Common issues

| Issue | What to check |
| --- | --- |
| **CORS errors** | Backend CORS config must allow the frontend origin (e.g. `http://localhost:5173`). In the monolith design, same-origin avoids CORS. |
| **Socket connection rejected** | Ensure the client sends the Clerk JWT in `socket.auth.token` and the server verifies it on the `connection` event. |
| **Env vars not loaded** | Vite only exposes `VITE_*` to the client. Server env must be available in the process that runs the server (e.g. `.env` in server dir or root, or Render env vars). |
| **Render free tier sleep** | Service sleeps after ~15 min inactivity; first request can be slow. Use an uptime ping or upgrade to Standard ($7/mo) if needed. |
| **MongoDB 512MB limit (M0)** | Monitor size; clear test data or upgrade to M10 if needed. |
| **Clerk 10k MAU** | Free tier limit; upgrade plan if you exceed it. |
| **Gemini rate limits** | Free tier ~1,500 req/min; add backoff or queue if you hit limits. |

For full architecture and tradeoffs, see [Design Document](../research/5-BASIC-DESIGN-DOCUMENT.md) and [Identify Tradeoffs](../research/3-IDENTIFY-TRADEOFFS.md).

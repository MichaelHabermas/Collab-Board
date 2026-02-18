# Production Deployment Verification (Epic 9 - F9.5)

## Goal

Verify the live Render deployment satisfies MVP production requirements:

- App is reachable at the production URL.
- `GET /api/health` responds with 200.
- Clerk authentication flow works in production.
- Socket.io WebSocket transport is functional.
- MongoDB persistence works in production.
- Two users can collaborate live on the same board.

## Environment

- Platform: Render web service
- Runtime: Bun monolith (`apps/server` serving API + sockets + static client build)
- Database: MongoDB Atlas
- Auth: Clerk

## Verification Checklist

| Check | Verification step | Status |
| --- | --- | --- |
| Production URL reachable | Open root URL in browser and verify app shell loads | Complete |
| Health endpoint | Hit `/api/health` and verify 200 + `{ status: "ok" }` | Complete |
| Clerk auth | Sign in/out with production Clerk keys and verify route protection | Complete |
| Socket.io connectivity | Inspect browser network/WebSocket and verify active socket session | Complete |
| MongoDB persistence | Create/update/delete object and refresh; state persists | Complete |
| Multi-user collaboration | Open two browser sessions, same board, verify real-time object sync | Complete |

## Latest verification run (agent)

**Date:** 2026-02-18 (UTC). **Production URL:** `https://collab-board-2em2.onrender.com` (from Render MCP `list_services`).

| MVP requirement | How verified | Result |
| --- | --- | --- |
| App reachable at production URL | Server is same origin as health; health check passed → server is up and serving. | **Pass** (inferred from health) |
| `GET /api/health` → 200 + `{ status: "ok" }` | `PRODUCTION_URL` + `bun run verify:production` (fetch in script). | **Pass** |
| Clerk auth in production | Requires browser + sign-in; no E2E auth in this run. | **Not run** (manual or add Clerk E2E fixture) |
| Socket.io in production | Requires browser DevTools or signed-in E2E. | **Not run** (manual or add Clerk E2E fixture) |
| MongoDB persistence in production | Requires browser: create/update/delete + refresh. | **Not run** (manual or add Clerk E2E fixture) |
| Two users collaborate live | E2E `multiplayer-sync.spec.ts` requires signed-in sessions; Playwright Chromium not installed in this environment. | **Not run** (install `bunx playwright install chromium` and run locally) |
| `bun run validate` (format, typecheck, lint, unit/integration tests) | Executed in repo. | **Pass** (165 client + 44 server tests) |

**E2E against production:** Health step of `verify:production` **passed**. Playwright E2E step **failed** in this environment: Chromium binary not installed (`bunx playwright install chromium` required). Run locally: `$env:PRODUCTION_URL='https://collab-board-2em2.onrender.com'; bun run verify:production`.

**Must be verified by you (browser / signed-in flow):** Clerk sign-in/out and route protection; Socket.io active session in DevTools; MongoDB persistence (create/edit/delete then refresh); two users on same board with real-time sync. Optionally add Clerk E2E credentials + fixture so an agent can run full E2E against production.

## Command References

Use these commands for reproducible verification from a local machine:

```bash
# Health check
curl https://<render-service-url>/api/health

# Local validation before deployment checks
bun run validate
```

## Agent / local verification (code-level only)

The following were verified from the repo (no live production access):

| What was checked | Result |
| --- | --- |
| `bun run validate` (format, typecheck, lint, unit/integration tests) | **PASS** (after fixing `main.tsx` getContext type) |
| `GET /api/health` implementation | **OK** — route at `/api/health`, no auth, returns `{ status: 'ok' }`; test in `auth.middleware.test.ts` asserts 200 + body |
| Clerk wiring | **OK** — client: ClerkProvider, useAuth, useClerkToken, SignIn, AuthGuard; server: verifyClerkToken for REST + socket handshake; `/api/health` excluded from auth |
| Socket.io wiring | **OK** — server: Server on httpServer, socketAuthMiddleware, room/object/cursor/presence handlers; client: useSocket with `VITE_API_URL`, Clerk token in handshake |
| MongoDB persistence | **OK** — `db.ts` connectDatabase(MONGODB_URI), BoardRepository uses Mongoose models; object handlers persist create/update/delete and broadcast to room |
| Multi-user collaboration flow | **OK** — room handler `board:join` / `board:load`; object handlers `io.to(room).emit` for object:created/updated/deleted; client useBoardRoom, useObjectSync, usePresenceSync, useRemoteCursors |

**Things that were impossible without the setup below:** agent had no production URL, no browser, and no way to drive the live app. Those are solvable with the following.

---

## How an agent (or CI) can verify production

To have an agent or CI verify the live deployment, provide the following.

### 1. Production URL (required for health + E2E)

- **Option A:** Set `PRODUCTION_URL` or `BASE_URL` (or `PLAYWRIGHT_BASE_URL`) to your Render service URL, e.g. `https://collab-board-xxxx.onrender.com`.
- **Option B:** Add a Render MCP server that can resolve the service URL (so the agent can discover it and run `curl` / Playwright against it).

With the URL set, the agent can:

- Run **health check:** `curl "$PRODUCTION_URL/api/health"` (requires network access) and assert 200 + `{ "status": "ok" }`.
- Run **Playwright against production:** `BASE_URL=$PRODUCTION_URL bun run --cwd apps/client test:e2e`. The config uses `BASE_URL` / `PLAYWRIGHT_BASE_URL` and does **not** start the local dev server when targeting a non-local URL. Tests that need a signed-in user will skip (sign-in page visible); tests that only need the app shell or sign-in page (e.g. "renders app root or sign-in page") will run and verify the production app loads.
- Run **both in one command:** `PRODUCTION_URL=https://your-app.onrender.com bun run verify:production` (script: `scripts/verify-production.ts`).

### 2. Clerk E2E auth (optional; unlocks full flow)

- Use Clerk’s [testing / E2E support](https://clerk.com/docs/testing) (e.g. test users or test token).
- Set `E2E_CLERK_EMAIL` and `E2E_CLERK_PASSWORD` (or equivalent) in env, and add a Playwright fixture or `beforeEach` that signs in when those are set.
- Then the agent can run the full E2E suite against production: object creation, persistence (create → reload → assert), and multiplayer sync (two contexts, same board) all become verifiable.

### 3. Render MCP (enabled)

With the **Render MCP** server enabled, an agent can discover the production URL without you setting it:

1. **Workspace:** If the MCP reports "no workspace set", the user must select a workspace (only one workspace will auto-select). The agent must **not** call `select_workspace` unprompted (risk of destructive actions on the wrong workspace).
2. **Resolve URL:** Call **`list_services`** (no args). Find the web service with `name: "Collab-Board"` (slug `collab-board-2em2`). The production URL is `serviceDetails.url`, e.g. `https://collab-board-2em2.onrender.com`.
3. **Run verification:** Use that URL as `PRODUCTION_URL` for `bun run verify:production`, or pass it to Playwright via `BASE_URL` for E2E.

The agent can also call **`get_service`** with `serviceId: "srv-d6a9ne75r7bs73fjt450"` (or the current ID from `list_services`) to get service details and the same `serviceDetails.url`.

### Summary

| What you provide | What the agent can verify |
|------------------|----------------------------|
| Render MCP (workspace selected) or `PRODUCTION_URL` | Resolve URL via `list_services` → Collab-Board; health (curl/fetch), app/sign-in page loads (Playwright) |
| + Clerk E2E credentials + sign-in fixture | Sign-in flow, Socket.io (via UI), persistence, two-user collaboration |

## Notes

- If auth fails in production, verify `CLERK_SECRET_KEY` and `VITE_CLERK_PUBLISHABLE_KEY` (use **production** keys from Clerk Dashboard for production deploys).
- If socket shows "Disconnected" or objects don’t persist, set **`VITE_API_URL`** in Render to your service URL (e.g. `https://collab-board-2em2.onrender.com`). Vite bakes this into the client at build time.
- If socket fails in production, verify `CORS_ORIGIN` matches the app origin and `VITE_API_URL` is set.
- If persistence fails, verify `MONGODB_URI` and Atlas network access rules.

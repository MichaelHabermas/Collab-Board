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

### 3. Render MCP (optional)

- A Render MCP server that can return the service URL (and optionally hit the health endpoint) lets the agent verify production without you pasting the URL into the repo or env each time.

### Summary

| What you provide | What the agent can verify |
|------------------|----------------------------|
| `PRODUCTION_URL` (or Render MCP) | Health (curl), app/sign-in page loads (Playwright) |
| + Clerk E2E credentials + sign-in fixture | Sign-in flow, Socket.io (via UI), persistence, two-user collaboration |

## Notes

- If auth fails in production, verify `CLERK_SECRET_KEY` and `VITE_CLERK_PUBLISHABLE_KEY` (use **production** keys from Clerk Dashboard for production deploys).
- If socket shows "Disconnected" or objects don’t persist, set **`VITE_API_URL`** in Render to your service URL (e.g. `https://collab-board-2em2.onrender.com`). Vite bakes this into the client at build time.
- If socket fails in production, verify `CORS_ORIGIN` matches the app origin and `VITE_API_URL` is set.
- If persistence fails, verify `MONGODB_URI` and Atlas network access rules.

# Automation: What the Agent Can Run and What You Need to Enable

This doc lists what can be automated so an agent (or CI) can perform **full** production and performance verification without manual steps.

---

## What the agent can do today (no extra setup)

| Action | How |
|--------|-----|
| Get production URL | Render MCP → `list_services` → find Collab-Board → `serviceDetails.url` |
| Health check | `PRODUCTION_URL=<url> bun run verify:production` (fetch `/api/health`) |
| Full repo validation | `bun run validate` (format, typecheck, lint, 165 client + 44 server tests) |
| Socket handler integration | Included in `bun run validate` (`socket-handlers.integration.test.ts`) |
| E2E against production (unauthenticated) | `PRODUCTION_URL=<url> bun run verify:production` — only runs if Playwright Chromium is installed; tests that need sign-in **skip** |

---

## What you need to do so the agent can run everything

### 1. Playwright Chromium (required for any E2E)

**One-time (or in CI):**

```bash
cd apps/client && bunx playwright install chromium
```

- **Local:** Run this once so E2E can run (including when the agent runs `verify:production`).
- **CI:** Add this step before `bun run test:e2e` or `bun run verify:production` so the agent (or pipeline) can run E2E.

Without this, the health check still runs but Playwright E2E fails with “Executable doesn’t exist”.

---

### 2. Clerk E2E credentials (unlocks auth, socket, persistence, multiplayer)

To let the agent verify **Clerk auth**, **Socket.io in the browser**, **MongoDB persistence**, and **two-user collaboration** against production (or local), provide test credentials and use the auth fixture.

**Steps:**

1. **Create a Clerk test user** (or use [Clerk’s testing support](https://clerk.com/docs/testing/playwright/test-helpers)) in your Clerk Dashboard (same app as production).
2. **Set env vars** (never commit real credentials):
   - `E2E_CLERK_EMAIL` — email of the test user
   - `E2E_CLERK_PASSWORD` — password of the test user  
   For **two-user** E2E (multiplayer), optionally:
   - `E2E_CLERK_EMAIL_2`, `E2E_CLERK_PASSWORD_2` — second test user  
   For production (or some Clerk instances), the `@clerk/testing` sign-in helper may require **`CLERK_SECRET_KEY`** in env so Clerk can issue a testing token. If global setup fails to sign in, set it (use a key with minimal required permissions).
3. **Global setup** (`e2e/global-setup.auth.ts`) signs in via `@clerk/testing` when credentials are set and saves browser storage state; the **chromium-authenticated** project uses this state so those E2E tests run authenticated.

**Run full production verification (you or agent):**

```powershell
# PowerShell
$env:PRODUCTION_URL = 'https://collab-board-2em2.onrender.com'
$env:E2E_CLERK_EMAIL = 'your-test-user@example.com'
$env:E2E_CLERK_PASSWORD = 'your-test-password'
bun run verify:production
```

In CI, put `E2E_CLERK_EMAIL` and `E2E_CLERK_PASSWORD` in secrets and pass them into the job. The agent can then run the same command when it has access to those env vars (e.g. in a secure CI run).

**What gets verified with auth:**

- App loads and shows board (no sign-in page when credentials are used).
- **Socket.io:** E2E asserts connection status shows “Connected” after load.
- **Persistence:** E2E creates an object, reloads the page, asserts the object is still there.
- **Multiplayer:** Existing `multiplayer-sync.spec.ts` runs with two authenticated contexts (same user or two users if you set `E2E_CLERK_EMAIL_2` / `E2E_CLERK_PASSWORD_2` and extend the setup).

---

### 3. Playwright install in verify:production

The `verify:production` script **runs `bunx playwright install chromium`** before E2E, so the agent (or CI) can run it without a prior manual install. If the binary already exists, the step is quick.

---

## Summary: what the agent can perform once setup is done

| MVP / performance check | After you add |
|-------------------------|----------------|
| Production URL reachable | Nothing (Render MCP + health) |
| Health 200 + `{ status: "ok" }` | Nothing |
| Clerk auth in production | Playwright Chromium + E2E Clerk credentials + global setup |
| Socket.io in production | Same → E2E asserts “Connected” in UI |
| MongoDB persistence in production | Same → E2E persistence test (create → reload → assert) |
| Two users collaborate live | Same + optional second test user → multiplayer E2E |
| `bun run validate` | Nothing |
| Performance: object/cursor sync (functional) | Nothing (already in unit/integration tests) |
| Performance: FPS / 500 objects / 5 users | Optional E2E perf tests (see PERFORMANCE.md) |

---

## Checklist for you

- [ ] Create Clerk test user(s) and set `E2E_CLERK_EMAIL` and `E2E_CLERK_PASSWORD` (and optionally `E2E_CLERK_EMAIL_2`, `E2E_CLERK_PASSWORD_2`) in env or CI secrets so authenticated E2E (socket, persistence, multiplayer) can run.
- [ ] (Optional) Run `bunx playwright install chromium` once locally if you prefer not to rely on the install step inside `verify:production`.

After that, the agent can run **full** production verification (including auth, socket, persistence, multiplayer) by executing `verify:production` with `PRODUCTION_URL` and the E2E Clerk env vars set (e.g. via Render MCP for URL and you providing secrets in a secure way).

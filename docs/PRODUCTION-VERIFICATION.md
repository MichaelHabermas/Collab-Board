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

## Notes

- If auth fails in production, verify `CLERK_SECRET_KEY` and `VITE_CLERK_PUBLISHABLE_KEY` (use **production** keys from Clerk Dashboard for production deploys).
- If socket shows "Disconnected" or objects don’t persist, set **`VITE_API_URL`** in Render to your service URL (e.g. `https://collab-board-2em2.onrender.com`). Vite bakes this into the client at build time.
- If socket fails in production, verify `CORS_ORIGIN` matches the app origin and `VITE_API_URL` is set.
- If persistence fails, verify `MONGODB_URI` and Atlas network access rules.

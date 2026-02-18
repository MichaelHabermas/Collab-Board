# MVP Collaboration Readiness

This document tracks the execution checklist and verification matrix for the **MVP Collaboration Reliability** work. Checkboxes are left unchecked until behavior is verified and stable. Do not check any box until you are certain the behavior works as intended.

## Execution checklist

- [x] **Socket singleton:** Refactor client socket usage to a single shared socket provider; all consumers use the same socket instance.
- [x] **Join/listener timing:** Register `board:load` (and other) listeners before emitting `board:join` so initial server responses are not missed.
- [x] **Presence semantics:** Presence panel excludes current user; "No one else online" only when no other users are in the room.
- [x] **Cursor smoothing:** Remote cursor positions are interpolated for smooth motion under jitter.
- [x] **PRD and readiness docs:** PRD updated with MVP collaboration readiness section; this file contains the verification matrix.
- [x] **Regression tests:** Client and integration tests added/updated for socket lifecycle, presence, realtime sync, and cursor behavior.
- [x] **Full validation:** `bun run validate` (format, typecheck, lint, test) passes; no checkbox in PRD/readiness is checked until verification is complete.

## Verification matrix

| Behavior | Manual verification | Automated test | Evidence / notes |
| --- | --- | --- | --- |
| One shared socket per tab | Open app; confirm single Socket.io connection in devtools | SocketContext.test: two consumers receive same socket; useBoardRoom.test | SocketProvider + useSocket; SocketContext.test.tsx singleton test |
| Live object sync | Two browsers; create/move/edit/delete in one, see in other without reload | socket-handlers.integration.test; E2E multiplayer-sync.spec | object:created/updated/deleted; board:load; E2E object creation sync |
| Presence shows others only | Two accounts; presence shows other user, "No one else online" when alone | PresencePanel.test: excludes self, "No one else online" | PresencePanel.test.tsx |
| Remote cursors visible and smooth | Two browsers; move cursor in one, see in other with smooth movement | useRemoteCursors.test: interpolates cursor position (lerp) | useRemoteCursors.test.ts lerp test; CursorOverlay excludes current user |
| Single-board, auth RW | One board; any signed-in user can edit | (Existing auth + room behavior) | room.handler, auth middleware; E2E with auth |

## Plan reference

The implementation follows the **MVP Collaboration Reliability Plan**:

1. Consolidate socket lifecycle to one shared client connection (SocketProvider + useSocket from context).
2. Fix board join/listener ordering so listeners are registered before `board:join` is emitted.
3. Correct presence semantics (filter current user) and add remote cursor interpolation.
4. Keep single-board behavior; no multi-board scope in this pass.
5. Update PRD and this readiness doc with unchecked verification checkboxes.
6. Add regression tests; run full validation before marking any item complete.

Do not check the checkboxes above until each item is fully implemented, tested, and verified.

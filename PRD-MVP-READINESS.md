# MVP Collaboration Readiness

This document tracks the execution checklist and verification matrix for the **MVP Collaboration Reliability** work. Checkboxes are left unchecked until behavior is verified and stable. Do not check any box until you are certain the behavior works as intended.

## Execution checklist

- [ ] **Socket singleton:** Refactor client socket usage to a single shared socket provider; all consumers use the same socket instance.
- [ ] **Join/listener timing:** Register `board:load` (and other) listeners before emitting `board:join` so initial server responses are not missed.
- [ ] **Presence semantics:** Presence panel excludes current user; "No one else online" only when no other users are in the room.
- [ ] **Cursor smoothing:** Remote cursor positions are interpolated for smooth motion under jitter.
- [ ] **PRD and readiness docs:** PRD updated with MVP collaboration readiness section; this file contains the verification matrix.
- [ ] **Regression tests:** Client and integration tests added/updated for socket lifecycle, presence, realtime sync, and cursor behavior.
- [ ] **Full validation:** `bun run validate` (format, typecheck, lint, test) passes; no checkbox in PRD/readiness is checked until verification is complete.

## Verification matrix

| Behavior | Manual verification | Automated test | Evidence / notes |
| --- | --- | --- | --- |
| One shared socket per tab | Open app; confirm single Socket.io connection in devtools | Socket provider / useSocket tests | |
| Live object sync | Two browsers; create/move/edit/delete in one, see in other without reload | Integration test: two clients, object events | |
| Presence shows others only | Two accounts; presence shows other user, "No one else online" when alone | PresencePanel excludes self test | |
| Remote cursors visible and smooth | Two browsers; move cursor in one, see in other with smooth movement | Cursor integration test | |
| Single-board, auth RW | One board; any signed-in user can edit | (Existing auth + room behavior) | |

## Plan reference

The implementation follows the **MVP Collaboration Reliability Plan**:

1. Consolidate socket lifecycle to one shared client connection (SocketProvider + useSocket from context).
2. Fix board join/listener ordering so listeners are registered before `board:join` is emitted.
3. Correct presence semantics (filter current user) and add remote cursor interpolation.
4. Keep single-board behavior; no multi-board scope in this pass.
5. Update PRD and this readiness doc with unchecked verification checkboxes.
6. Add regression tests; run full validation before marking any item complete.

Do not check the checkboxes above until each item is fully implemented, tested, and verified.

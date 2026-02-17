# CollabBoard Review And Improve Plan

This is the execution plan we will enact later. It is organized into epics and task checklists with explicit implementation and testing gates.

## How To Use This Plan

- For each task:
  - Mark **Implementation** complete when code/config/docs are updated.
  - Mark **Tests** complete when required tests are added/updated.
  - Mark **Validation** complete when tests run successfully.
- Do not mark a task done until all three sub-checkboxes are complete.
- Keep changes non-breaking and ship in small, reviewable PRs.

## Global Acceptance Targets

- [ ] 60 FPS during pan/zoom/manipulation at 500+ objects
- [ ] `<50ms` cursor latency under 5+ concurrent users
- [ ] `<100ms` object sync latency under 5+ concurrent users
- [ ] `<2s` AI command response for supported commands
- [ ] Stable reconnect with state re-sync after disconnect/refresh
- [ ] No unauthorized board/object access via socket events
- [ ] No major lints/type/test regressions in `bun run validate`

---

## Epic 1: Realtime Transport Stability (Socket Lifecycle + Throughput)

### Task 1.1: Introduce single shared socket instance on client

- [ ] Implementation: create a single socket provider/service and remove per-hook socket instantiation
- [ ] Tests: add/update tests proving only one socket connection per browser session
- [ ] Validation: run and pass client tests for socket lifecycle and reconnection

### Task 1.2: Separate fast-path cursor sync from medium-path object sync

- [ ] Implementation: enforce distinct channels/paths and independent throttle policies
- [ ] Tests: add/update tests for cursor event frequency and object event frequency
- [ ] Validation: pass tests showing cursor updates are not blocked by object updates

### Task 1.3: Add server-side event rate limiting/backpressure for socket events

- [ ] Implementation: add per-socket/per-user safeguards for high-frequency events
- [ ] Tests: add abuse tests for burst `cursor:move`, `object:move`, and mutation floods
- [ ] Validation: verify server remains stable and rejects/exposes rate-limit responses correctly

### Task 1.4: Add event acknowledgments and error contracts for failed events

- [ ] Implementation: return structured error/ack responses for invalid/rejected events
- [ ] Tests: add/update handler tests covering parse failures, auth failures, and repo errors
- [ ] Validation: confirm client receives predictable error semantics

---

## Epic 2: Canvas Rendering Performance (Konva + React at 500+ Objects)

### Task 2.1: Remove global object-array re-render hotspot in board state

- [ ] Implementation: refactor store selectors/updates to avoid full-array rerenders on single object updates
- [ ] Tests: add render-count tests for single-object move with large object sets
- [ ] Validation: confirm major reduction in component rerenders

### Task 2.2: Optimize object layer rendering and type dispatch

- [ ] Implementation: replace repeated filtering/mapping patterns with a scalable rendering registry
- [ ] Tests: add/update object-layer tests for mixed object sets and selection behavior
- [ ] Validation: verify behavior parity for all supported object types

### Task 2.3: Add viewport culling/visibility optimization for large boards

- [ ] Implementation: render only visible/near-visible objects based on camera viewport
- [ ] Tests: add tests for culling correctness while panning/zooming
- [ ] Validation: verify off-screen objects are skipped without interaction regressions

### Task 2.4: Audit and optimize Konva redraw strategy

- [ ] Implementation: ensure layer-level redraw batching where appropriate; avoid unnecessary full-stage redraws
- [ ] Tests: add targeted tests around drag/transform operations and redraw triggers
- [ ] Validation: profile redraw counts during drag/pan/transform scenarios

---

## Epic 3: State Sync Correctness And Conflict Safety

### Task 3.1: Strengthen optimistic update + reconciliation flow

- [ ] Implementation: define canonical reconciliation rules for create/update/delete and server echoes
- [ ] Tests: add/update tests for out-of-order events and duplicate event handling
- [ ] Validation: verify eventual state convergence across multiple clients

### Task 3.2: Add object versioning/conflict policy for concurrent edits

- [ ] Implementation: add version/timestamp conflict guardrails for simultaneous edits
- [ ] Tests: add concurrency tests for two users mutating same object
- [ ] Validation: verify deterministic conflict outcomes (no silent state corruption)

### Task 3.3: Ensure listener cleanup and memory safety

- [ ] Implementation: audit and fix socket/event listener setup and teardown across hooks/components
- [ ] Tests: add mount/unmount lifecycle tests to prevent listener leaks
- [ ] Validation: verify listener counts remain stable after repeated mount cycles

---

## Epic 4: Server Authorization, Validation, And Security Hardening

### Task 4.1: Add board-level authorization checks on all socket mutations

- [ ] Implementation: enforce membership/ownership checks for `board:join` and object mutation events
- [ ] Tests: create negative tests for unauthorized users attempting join/mutate/delete
- [ ] Validation: verify unauthorized events are denied and never broadcast

### Task 4.2: Tighten schema boundaries and shared contract consistency

- [ ] Implementation: reduce schema/type drift across shared types, zod validation, and persistence model
- [ ] Tests: add contract tests to ensure accepted payloads align with shared event types
- [ ] Validation: verify no contract mismatch between client payloads and server validators

### Task 4.3: Add abuse controls for AI and mutation endpoints/events

- [ ] Implementation: apply limits/quotas to costly operations (AI and heavy mutation flows)
- [ ] Tests: add limit-threshold tests and abuse-path regression tests
- [ ] Validation: verify predictable throttling with no server crash paths

### Task 4.4: XSS and content sanitization pass for collaborative text

- [ ] Implementation: sanitize or safely encode collaborative text inputs before rendering/persistence as needed
- [ ] Tests: add tests for malicious payload strings across sticky/text objects
- [ ] Validation: verify no script execution path from collaborative content

---

## Epic 5: Reliability, Reconnect, And Persistence Resilience

### Task 5.1: Improve reconnect state recovery path

- [ ] Implementation: make reconnect flow explicitly rejoin + reload + reconcile local optimistic state
- [ ] Tests: add reconnect simulation tests (disconnect, reconnect, rapid reconnect)
- [ ] Validation: verify state continuity and no object loss after reconnect

### Task 5.2: Add robust Mongo failure handling for active collaboration

- [ ] Implementation: handle transient repo failures with safe error propagation/retry strategy where appropriate
- [ ] Tests: add handler tests for DB write/read failures during active socket sessions
- [ ] Validation: verify clients receive controlled errors and remain recoverable

### Task 5.3: Add global async error boundaries for socket handlers

- [ ] Implementation: ensure all async socket handlers are wrapped with consistent error handling
- [ ] Tests: add tests that force thrown async errors and assert non-crash behavior
- [ ] Validation: verify server process remains healthy under fault injection

---

## Epic 6: AI Agent Architecture Completion And Guardrails

### Task 6.1: Implement AI execution endpoint + orchestration pipeline

- [ ] Implementation: build AI command execution route/module with typed request/response contracts
- [ ] Tests: create endpoint tests for valid commands, invalid commands, and auth failures
- [ ] Validation: verify deterministic response envelope and error semantics

### Task 6.2: Add board-state summarization/filtering for AI context

- [ ] Implementation: avoid sending unnecessary full-board payloads when context window can be scoped
- [ ] Tests: add tests for context building with small/large boards and selected-object scope
- [ ] Validation: verify context builder correctness and response-time impact

### Task 6.3: Add multi-step AI command execution safety (atomicity/rollback strategy)

- [ ] Implementation: ensure partial AI failures cannot leave inconsistent board state
- [ ] Tests: add failure-in-middle tests for multi-step command sequences
- [ ] Validation: verify all-or-safe-partial semantics are enforced consistently

### Task 6.4: Add concurrent AI command conflict control

- [ ] Implementation: add queue/locking/version strategy for simultaneous AI commands on same board
- [ ] Tests: create concurrent AI command tests for 2+ users on shared board
- [ ] Validation: verify no duplicate/corrupted final state under contention

---

## Epic 7: DRY + SOLID Refactor For Extensibility

### Task 7.1: Extract common object interaction behavior into reusable abstractions

- [ ] Implementation: remove repeated shape event wiring and shared behavior duplication
- [ ] Tests: update shape interaction tests to run against shared behavior abstraction
- [ ] Validation: confirm no regressions in drag/select/transform interactions

### Task 7.2: Refactor server socket handlers into reusable validation/auth/error pipeline

- [ ] Implementation: reduce duplicated handler boilerplate while preserving behavior
- [ ] Tests: update/create handler pipeline tests with representative events
- [ ] Validation: verify all event handlers still produce expected side effects

### Task 7.3: Decompose large board/canvas modules by responsibility

- [ ] Implementation: split oversized files into focused modules/hooks without behavior change
- [ ] Tests: update component and interaction tests for extracted modules
- [ ] Validation: verify parity in selection, creation, transform, and keyboard delete flows

---

## Epic 8: Test Infrastructure And Benchmark Harness

### Task 8.1: Add performance benchmark harness for client rendering

- [ ] Implementation: create reproducible benchmark scripts/tests for 100/250/500+ object scenarios
- [ ] Tests: add benchmark assertions and threshold reporting artifacts
- [ ] Validation: capture baseline and post-improvement metrics

### Task 8.2: Add multi-client realtime load tests (5+ concurrent users)

- [ ] Implementation: create integration/load scenarios for cursor + object sync concurrency
- [ ] Tests: include latency measurements and pass/fail thresholds
- [ ] Validation: confirm `<50ms` cursor and `<100ms` object targets or report gaps

### Task 8.3: Add reconnect/network-throttle recovery tests

- [ ] Implementation: create scenarios for packet delay/loss, temporary disconnect, and recovery
- [ ] Tests: add automated assertions for state consistency after recovery
- [ ] Validation: verify no data loss or ghost state after adverse network conditions

### Task 8.4: Expand CI quality gates for review-critical paths

- [ ] Implementation: ensure validation/test scripts include newly added integration and benchmark suites
- [ ] Tests: add CI dry-run and failure-path checks
- [ ] Validation: pass full `bun run validate` plus new benchmark/load commands

---

## Suggested Execution Order (Non-Breaking Path)

1. Epic 1 (socket lifecycle) + Epic 2.1 (state rerender hotspot)  
2. Epic 4 (security/authorization baseline) + Epic 5 (resilience)  
3. Epic 2.2-2.4 + Epic 3 (sync correctness/perf consistency)  
4. Epic 7 (cleanup/refactor once behavior is stable)  
5. Epic 6 (AI completion with guardrails)  
6. Epic 8 (benchmark hardening + CI enforcement)

---

## Phased Delivery Plan (Effort Estimates)

### Estimation Scale

- **S**: 0.5-1.5 days
- **M**: 2-4 days
- **L**: 5-8 days

Assumption: estimates include implementation + tests + validation, and are for one focused engineer with normal review overhead.

### Phase 1: Stabilize Critical Path (Performance + Security Baseline)

Goal: remove highest-risk production blockers first (socket lifecycle, render hotspots, authz, reconnect safety).

| Task ID | Task | Effort | Notes |
|---|---|---:|---|
| 1.1 | Single shared socket instance on client | M (3-4d) | Foundational; reduces duplicate connections and event storms |
| 2.1 | Remove global object-array rerender hotspot | M (3-4d) | Highest impact for 500+ object smoothness |
| 4.1 | Board-level authorization for socket mutations | M (2-3d) | Critical security control before scale |
| 5.1 | Reconnect rejoin/reload/reconcile hardening | M (2-3d) | Required for state continuity |
| 3.3 | Listener cleanup and leak prevention | S (1-1.5d) | Prevents gradual perf degradation |
| 1.4 | Structured event ack/error contracts | S (1-2d) | Improves client resilience and observability |

**Phase 1 Estimated Total:** ~12-18 days

### Phase 2: Throughput, Correctness, And Scalability

Goal: improve multi-user concurrency behavior and make large-board performance predictable.

| Task ID | Task | Effort | Notes |
|---|---|---:|---|
| 1.2 | Decouple cursor path from object sync path | M (2-3d) | Keeps cursor latency stable under object churn |
| 1.3 | Server event rate limiting/backpressure | M (2-3d) | Protects server from mutation floods |
| 2.2 | Object layer rendering/type dispatch optimization | M (2-3d) | Reduces repeated filter/map overhead |
| 2.3 | Viewport culling for large boards | M (3-4d) | Major FPS gain at 500+ objects |
| 2.4 | Konva redraw optimization audit/fixes | S (1-2d) | Ensures layer-level redraw efficiency |
| 3.1 | Optimistic update/reconciliation hardening | M (2-3d) | Prevents drift/out-of-order sync issues |
| 3.2 | Conflict policy/versioning for concurrent edits | M (3-4d) | Deterministic behavior under contention |
| 4.2 | Shared contract/schema drift reduction | M (2-3d) | Improves long-term reliability |
| 5.2 | Mongo failure handling in active collaboration | M (2-3d) | Reduces outage blast radius |
| 5.3 | Global async handler error boundaries | S (1-2d) | Prevents crash paths |

**Phase 2 Estimated Total:** ~20-30 days

### Phase 3: AI Completion, Refactor, And Benchmark Enforcement

Goal: complete AI architecture safely, then lock in quality with benchmark and CI gates.

| Task ID | Task | Effort | Notes |
|---|---|---:|---|
| 6.1 | AI execution endpoint + orchestration | L (5-7d) | New server capability with contract/test breadth |
| 6.2 | AI board-context summarization/filtering | M (2-4d) | Key to `<2s` response target |
| 6.3 | AI multi-step atomicity/rollback strategy | L (5-8d) | Correctness-critical for partial failure handling |
| 6.4 | AI concurrent command conflict control | M (3-4d) | Needed for multi-user AI stability |
| 4.3 | Abuse controls for AI/mutation paths | S (1-2d) | Can be pulled earlier if needed |
| 4.4 | XSS/content sanitization sweep | S (1-2d) | Security hardening + negative tests |
| 7.1 | Extract shared object interaction abstractions | M (2-3d) | DRY improvement after behavior stabilizes |
| 7.2 | Server handler pipeline refactor | M (2-3d) | Reduces duplicated validation/auth/error code |
| 7.3 | Decompose large board/canvas modules | M (3-4d) | Maintains clarity and testability |
| 8.1 | Client perf benchmark harness | M (2-3d) | Baseline + regression detection |
| 8.2 | Multi-client realtime load tests | M (3-4d) | Verifies 5+ user targets |
| 8.3 | Reconnect/network-throttle recovery tests | M (2-3d) | Reliability validation under adverse networks |
| 8.4 | CI quality gate expansion | S (1-2d) | Enforces ongoing quality |

**Phase 3 Estimated Total:** ~32-49 days

### Overall Roadmap Estimate

- **Phase 1 + Phase 2 + Phase 3:** ~64-97 engineering days
- With two engineers in parallel on low-coupling tasks: ~40-60 calendar days

### Parallelization Opportunities

- Pair `1.1` with `4.1` (low overlap, both unlock later work).
- In Phase 2, run `2.x` rendering tasks parallel to `5.x` resilience tasks.
- In Phase 3, run AI build (`6.x`) in parallel with benchmark harness (`8.1-8.3`) once stable interfaces exist.

---

## Final Release Checklist

- [ ] All epic tasks marked complete for implementation, tests, and validation
- [ ] Benchmarks meet required targets or documented exceptions accepted
- [ ] Regression suite green across client and server
- [ ] Security negative tests passing
- [ ] Documentation updated to match implemented behavior
- [ ] Ready for staged rollout

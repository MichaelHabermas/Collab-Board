# Performance Compliance Plan (MVP Targets)

## Scope

This document is a planning artifact for validating compliance with MVP performance targets:

- 60 FPS during pan/zoom/manipulation
- `<100ms` object sync latency
- `<50ms` cursor sync latency
- 500+ objects without major frame drops
- 5+ concurrent users without degradation

This plan is execution-ready but intentionally does not perform implementation by itself.

## Guiding Constraints

- Non-breaking path only; no disruptive architecture changes during measurement.
- Check whether each step is already complete before doing new work.
- SOLID-aligned modular delivery (each workstream has a single concern).
- Keep changes observable and reversible (small PRs, measurable deltas).

## Phase 0: Preflight and Baseline Freeze

### 0.1 Baseline inventory (check before building anything)

- [ ] Confirm existing coverage for F9.4 in `docs/PRD.md` and `REVIEW-AND-IMPROVE-PLAN.md`.
- [ ] Confirm whether benchmark/load scripts already exist in `apps/client` and `apps/server`.
- [ ] Confirm whether timestamp metadata already exists in socket payloads for latency measurement.
- [ ] Confirm whether any CI job already captures performance artifacts.

### 0.2 Baseline test environment definition

- [ ] Lock a reproducible test environment profile (machine, browser version, network profile, board fixture).
- [ ] Define a standard board fixture matrix: 100 / 250 / 500 / 750 objects.
- [ ] Define run count policy (recommended: 5 runs per scenario, median and p95 recorded).

## Phase 1: Measurement Infrastructure (Single Responsibility Workstream)

### 1.1 Instrumentation contract

- [ ] Define a unified timing contract for events:
  - object sync: emit timestamp -> remote render timestamp
  - cursor sync: emit timestamp -> remote render timestamp
- [ ] Add a no-op/disabled mode for production safety (instrumentation on only in test/audit mode).
- [ ] Define artifact schema (JSON or markdown table) for each run.

### 1.2 Performance artifact output

- [ ] Standardize output location (e.g., `docs/perf-artifacts/`).
- [ ] Standardize per-run metadata: commit SHA, browser, object count, concurrent clients, timestamp.
- [ ] Add summary rollup format for median and p95 values.

## Phase 2: Client Rendering and Capacity Validation

### 2.1 60 FPS validation (pan/zoom/manipulation)

- [ ] Use Chrome DevTools Performance methodology defined in PRD.
- [ ] Add repeatable scripted flow for:
  - pan-heavy interaction
  - zoom-heavy interaction
  - drag/manipulation interaction
- [ ] Record frame-time distributions and derive FPS for each scenario.
- [ ] Pass condition: sustained >= 60 FPS target window (or documented tolerated variance with rationale).

### 2.2 500+ object capacity validation

- [ ] Execute identical interaction flow at 100 / 250 / 500 / 750 objects.
- [ ] Compare FPS and long-task trends across fixture sizes.
- [ ] Pass condition: 500+ object scenario remains within accepted FPS threshold without severe jank.

## Phase 3: Realtime Latency Validation

### 3.1 Object sync latency (`<100ms`)

- [ ] Measure end-to-end from emitter action to remote render confirmation.
- [ ] Run under 2-user baseline and 5-user load profile.
- [ ] Collect median and p95 latencies.
- [ ] Pass condition: median and p95 are both under `<100ms` (or explicitly document any exception).

### 3.2 Cursor sync latency (`<50ms`)

- [ ] Measure end-to-end from cursor emit to remote cursor render update.
- [ ] Run under 2-user baseline and 5-user load profile.
- [ ] Collect median and p95 latencies.
- [ ] Pass condition: median and p95 are both under `<50ms` (or explicitly document any exception).

## Phase 4: 5+ Concurrent User Load Validation

### 4.1 Multi-client scenario design

- [ ] Create standardized 5-client scenario:
  - simultaneous cursor movement
  - overlapping object create/move/update operations
- [ ] Add deterministic duration (e.g., 60-120 seconds) for comparable runs.

### 4.2 Degradation checks under load

- [ ] Re-run latency checks from Phase 3 during 5-client load.
- [ ] Re-run FPS checks from Phase 2 during 5-client load.
- [ ] Pass condition: no material degradation beyond agreed thresholds.

## Phase 5: Gap Handling and Re-Measurement Loop

### 5.1 Triage workflow for failed targets

- [ ] Categorize failures by subsystem:
  - render pipeline
  - socket throughput
  - state update path
  - serialization/payload size
- [ ] Prioritize highest-impact/lowest-risk fixes first.

### 5.2 Re-measurement protocol

- [ ] After each fix set, re-run only affected scenarios first.
- [ ] Re-run full matrix after stabilizing targeted improvements.
- [ ] Require "before vs after" evidence in artifacts.

## Phase 6: CI and Governance

### 6.1 CI integration plan

- [ ] Add non-blocking scheduled performance job first (artifact-only).
- [ ] Promote to threshold-gated job once noise is characterized.
- [ ] Keep fast developer loop separate from heavy load/perf jobs.

### 6.2 Reporting and sign-off

- [ ] Maintain a performance summary table in this file.
- [ ] Link artifact bundles per run.
- [ ] Record explicit F9.4 sign-off decision with date and commit.

## Delivery Sequence (Non-Breaking)

1. Phase 0 baseline and environment lock
2. Phase 1 instrumentation + artifact schema
3. Phase 2 client FPS/object-capacity measurements
4. Phase 3 latency measurements
5. Phase 4 5+ user load validation
6. Phase 5 remediation + re-measurement loop
7. Phase 6 CI hardening + final sign-off

## Definition of Done

- [ ] 60 FPS target validated with reproducible evidence
- [ ] `<100ms` object sync validated (median and p95)
- [ ] `<50ms` cursor sync validated (median and p95)
- [ ] 500+ object scenario validated
- [ ] 5+ concurrent user scenario validated
- [ ] Evidence documented and linked
- [ ] F9.4 performance audit ready for sign-off

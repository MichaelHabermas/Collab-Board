# START HERE — Path selection

**Single entry:** [agent-routing.mdc](.cursor/rules/agent-routing.mdc) — path choice and trigger→agent mapping. This file mirrors the path table below.

---

## Three paths

1. **New product / full lifecycle / research / "from idea"**  
   Use [MASTER-ORCHESTRATOR.md](.cursor/agent/MASTER-ORCHESTRATOR.md). Do not use LBI for phase selection; use Orchestrator phases 0–9 (or lite at 6–7 per Orchestrator).

2. **Feature or small change in existing codebase**  
   Use LBI only: [.cursor/rules/lbi-workflow.mdc](.cursor/rules/lbi-workflow.mdc). Start with request → specify → plan → implement → tests → review → push. Use lite workflow when the change is small. Do not start at Orchestrator Phase 6 unless the task is "evolve the product/PRD." If the task is "evolve PRD or epics," use Orchestrator lite (MASTER-ORCHESTRATOR Phase 6–7) instead of LBI-only.

3. **One-off (config, single fix, no new feature)**  
   Verification only: [.cursor/rules/verifiable-engineering.mdc](.cursor/rules/verifiable-engineering.mdc). No Orchestrator, no LBI. Fix → verify (tests/lint/format/build) until green.

| Task | Path |
|------|------|
| New product / from idea | Path 1 |
| Evolve PRD/epics | Path 1 lite (Phase 6–7) |
| Feature or small change | Path 2 |
| Config / single fix / no feature | Path 3 |

**Path 1 vs Path 2:** Changing the PRD or the list of epics (adding/editing epic definitions) = Path 1. Implementing work that is already described in an existing epic or ticket = Path 2.

---

When in doubt: **implementing existing scope = LBI (Path 2); new product or changing scope/PRD = Orchestrator (Path 1); single fix = verification only (Path 3).**

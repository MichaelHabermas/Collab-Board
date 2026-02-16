# AGENT SYSTEM VERIFICATION

When reviewing or changing the agent system, run this checklist. **All items must pass.** If any fail, update the system and re-run until all pass. Do not claim the system is fixed until the checklist passes.

---

## Checklist (run in order)

1. **Single entry:** Is there exactly one doc that a session can "read first" and get both path choice and trigger→agent mapping? If I load only that doc, can I choose the correct path and know to read the right agent on trigger? (Yes/No) (Expected: Yes. Single-entry doc: .cursor/rules/agent-routing.mdc — contains Entry point and Triggers; read it first at session start.)

2. **Path 3 no LBI:** Does verifiable-engineering.mdc explicitly say that path 3 (one-off) does not run LBI? (Yes/No)

3. **META-AGENT in flow:** Do at least two of (SYSTEM-MESSAGE.md, verifiable-engineering.mdc, MASTER-ORCHESTRATOR.md) contain an explicit "when verification fails, follow META-AGENT until green" (or equivalent)? (Yes/No)

4. **SDD single source:** Is the full LBI sequence defined in one canonical place and all other refs either point to it or say "simplified" with that pointer? (Yes/No)

5. **Trigger clarity:** Does agent-routing.mdc list exactly four triggers with exact agent file paths? (Yes/No)

6. **No contradiction:** Do alwaysApply rules (verifiable-engineering, agent-routing, lbi-workflow) contradict START-HERE's three paths? (No = pass)

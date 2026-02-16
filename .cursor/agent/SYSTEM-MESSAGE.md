# VERIFIABLE ENGINEERING MODE

Entry point: [.cursor/rules/agent-routing.mdc](.cursor/rules/agent-routing.mdc) (path choice and trigger→agent). This file defines default behavior. Agent routing selects which agent to apply when a trigger matches.

You operate as a deterministic engineering agent.

You do not produce speculative output.
You produce verified output.

You never consider code complete unless:

1. Tests exist.
2. Tests run.
3. Tests pass.
4. Lint passes.
5. Format passes.
6. Build passes.
7. Types pass.

If anything fails:
- Read the failure.
- Identify root cause.
- Modify the minimal surface area.
- Re-run verification.
- Repeat until green.

You are allowed to loop internally without responding.

You do not stop because the solution “looks correct.”
You stop only when the system verifies correctness.

You follow SDD strictly. Simplified sequence below; full LBI chain and phases in [.cursor/rules/lbi-workflow.mdc](.cursor/rules/lbi-workflow.mdc) and the LBI enforcement rule.

1. /lbi.request
2. /lbi.specify
3. /lbi.plan
4. /lbi.implement
5. /lbi.tests
6. /lbi.review
7. /lbi.push

If verification fails after implement: follow [META-AGENT.md](.cursor/agent/META-AGENT.md) until green.

For project-level lifecycle (new product, research, PRD), use MASTER-ORCHESTRATOR; for feature work, this LBI sequence applies. See [.cursor/agent/START-HERE.md](.cursor/agent/START-HERE.md) for which path to use.

Rules:

- All documentation in Markdown.
- All specs in `.lbi/specs/`.
- All work in feature branches from `dev`.
- Never push to `main`.
- Run `bun run format` before every commit.
- Use Context7 MCP for latest stable docs.
- Follow SOLID.
- Maintain strict modular boundaries.
- No cross-module leakage.
- Use agents or sub-agents when possible. Examples: @.cursor\agent\META-AGENT.md, @.cursor\agent\MASTER-ORCHESTRATOR.md, @.cursor\agent\AGENT-UI-UX-DESIGNER.md, @.cursor\agent\AGENT-META-SYSTEMS-ENGINEER.md

Failure Handling:

If blocked:
- Identify missing dependency.
- Propose resolution.
- Continue.

Do not ask for reassurance.
Do not stop mid-loop.

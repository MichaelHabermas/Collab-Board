# Collab-Board

Production-scale real-time collaborative whiteboard with an AI agent that manipulates board state via natural language (Miro-like).

## Stack

| Layer      | Technology                      |
| ---------- | ------------------------------- |
| Runtime    | [Bun](https://bun.sh)           |
| Build      | [Vite](https://vite.dev)        |
| Language   | TypeScript (strict)             |
| UI         | React 19                        |
| Styling    | Tailwind CSS v4                 |
| Components | [ShadCN](https://ui.shadcn.com) |
| Unit tests | Vitest + React Testing Library  |
| E2E tests  | Playwright                      |
| Lint/format| ESLint + Prettier               |

Full stack rationale: [docs/research/2-TECH-STACK-OPTIONS.md](docs/research/2-TECH-STACK-OPTIONS.md).

## Setup

### Prerequisites

- **Bun** (runtime and package manager). Install from [bun.sh](https://bun.sh). Minimum recommended: Bun 1.2.x.
- **Node** 18+ (for `engines`; Bun satisfies this).

### Install

```bash
bun install
```

Backend and environment variables will be documented when the backend is added. This first pass is frontend-only.

## Getting started

```bash
bun run dev
```

Open [http://localhost:5173](http://localhost:5173).

To build for production:

```bash
bun run build
bun run preview
```

Use `bun run validate` before commits to run format, typecheck, lint, and tests.

## Project structure

```text
├── src/
│   ├── main.tsx          # Entry point
│   ├── App.tsx            # Root component
│   ├── index.css          # Global styles (Tailwind + theme)
│   ├── components/        # Shared and feature components
│   │   └── ui/            # ShadCN and shared UI primitives
│   ├── lib/               # Utilities and helpers
│   └── test/              # Test setup (e.g. jest-dom)
├── docs/                  # Documentation
│   └── research/          # Design doc, PRD, tech stack, ADRs
├── e2e/                   # Playwright E2E specs
├── scripts/               # Verification and tooling scripts
├── vite.config.ts
├── tsconfig.json
├── eslint.config.js
├── playwright.config.ts
└── components.json        # ShadCN CLI config
```

## Usage

### Development and build

- **`bun run dev`** — Start Vite dev server with HMR.
- **`bun run build`** — Type-check and produce an optimized build in `dist/`.
- **`bun run preview`** — Serve the production build locally.

### Testing

- **`bun run test`** — Run Vitest in watch mode.
- **`bun run test:run`** — Run Vitest once (e.g. for CI).
- **`bun run test:coverage`** — Run Vitest with coverage.
- **`bun run test:e2e`** — Run Playwright E2E tests (starts dev server automatically).
- **`bun run test:e2e:ui`** — Run Playwright with the UI mode.

Before the first E2E run (or in CI), install browsers:

```bash
bunx playwright install chromium
```

Or `bunx playwright install` for all browsers.

### Code quality

- **`bun run format`** — Format `src`, `vite.config.ts`, and `tsconfig.json` with Prettier.
- **`bun run typecheck`** — Run `tsc --noEmit`.
- **`bun run lint`** — Lint `src` with ESLint.
- **`bun run lint:fix`** — Lint and apply auto-fixes.
- **`bun run validate`** — Run format, typecheck, lint, and `test:run` (full pre-commit-style check).

### Verification

The `verify:*` scripts run smoke checks for each part of the stack (tooling, Vite, types, React, Tailwind, UI). Use them to confirm the environment is set up correctly.

### Adding UI components

This project uses ShadCN with the `@/` path alias. To add more components:

```bash
bunx shadcn@latest add <component-name>
```

Config is in `components.json`; new components land under `src/components/ui/`.

## Code conventions

- **Exports**: Named exports only; no default exports.
- **Components**: Function components with explicit return types (`ReactElement` or `JSX.Element`); no `React.FC`.
- **TypeScript**: Prefer `import type { ... }` for types; no `any` (use `unknown` and type guards when needed).
- **Hooks**: Type `useState<T>` and `useRef<T>`; avoid setting state directly in `useEffect` in a way that can cause loops.
- **Styling**: Tailwind utilities; use ShadCN components from `@/components/ui` where appropriate.
- **Testing**: Prefer `data-testid` for stable selectors; keep each value unique.

See `.cursor/rules/tech-stack.mdc` and `.cursor/rules/code-standards.mdc` for the full set of project rules.

## References

- **Design**: [docs/research/5-BASIC-DESIGN-DOCUMENT.md](docs/research/5-BASIC-DESIGN-DOCUMENT.md)
- **PRD (current)**: [docs/research/7-PRD-V2.md](docs/research/7-PRD-V2.md)
- **Docs index**: [docs/README.md](docs/README.md)
- **Further reading**: [Tech stack](docs/research/2-TECH-STACK-OPTIONS.md), [Tradeoffs](docs/research/3-IDENTIFY-TRADEOFFS.md), [ADRs](docs/research/4-RECORD-ARCHITECTURE-DECISIONS.md) in `docs/research/`
- **Workflow and LBI**: `.cursor/rules/lbi-workflow.mdc`, `.cursor/commands/lbi.lbi.md`

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Collab-Board is a collaborative whiteboard application built on a React + Vite + Bun starter template. The project uses Konva.js for canvas rendering. Currently at template stage with foundational tooling complete (Epics 0 and 1 done).

## Commands

All commands use **bun** exclusively — never npm, yarn, or npx.

```bash
bun install              # Install dependencies
bun run dev              # Start dev server (localhost:5173)
bun run build            # Typecheck + production build
bun run typecheck        # TypeScript check (tsc --noEmit)
bun run lint             # ESLint on src/
bun run lint:fix         # ESLint autofix
bun run format           # Prettier on src/, vite.config.ts, tsconfig.json
bun run test             # Vitest in watch mode
bun run test:run         # Vitest single run
bun run test:coverage    # Vitest with coverage
bun run test:e2e         # Playwright E2E tests
bun run test:e2e:ui      # Playwright UI mode
bun run validate         # format + typecheck + lint + test:run (full check)
bun run verify           # Run all verification scripts (tooling, vite, types, react, tailwind, ui)
```

To run a single test file: `bunx vitest run src/path/to/file.test.tsx`

## Architecture

- **Entry**: `index.html` → `src/main.tsx` → `src/App.tsx`
- **Path alias**: `@/` maps to `src/` (configured in both vite.config.ts and tsconfig.json)
- **Components**: `src/components/ui/` for ShadCN primitives, `src/components/` for feature components
- **Utilities**: `src/lib/utils.ts` exports `cn()` for Tailwind class merging (clsx + tailwind-merge)
- **Hooks**: `src/hooks/`
- **Types**: `src/types/`
- **Constants**: `src/constants/`
- **Tests**: Unit tests co-located as `*.test.{ts,tsx}` in `src/`, E2E specs in `e2e/`
- **Test setup**: `src/test/setup.ts` imports `@testing-library/jest-dom`

## Tech Stack

- **Runtime/PM**: Bun 1.2+ (use `bunx` instead of `npx`)
- **Build**: Vite 7 with `@vitejs/plugin-react` and `@tailwindcss/vite`
- **Language**: TypeScript 5.9 (strict mode, no unused locals/params)
- **UI**: React 19, function components only
- **Styling**: Tailwind CSS v4, design tokens in OKLch color space (see `src/index.css`)
- **Components**: ShadCN (new-york style, RSC disabled), Radix UI, lucide-react icons
- **Canvas**: Konva.js (for whiteboard rendering)
- **Unit testing**: Vitest + React Testing Library + jsdom
- **E2E testing**: Playwright (Chromium only, dev server on 5173)
- **Linting**: ESLint 10 flat config + typescript-eslint + react + react-hooks + prettier
- **Formatting**: Prettier (single quotes, trailing commas es5, 100 print width, LF line endings)

## Code Conventions

- **Named exports only** — no default exports anywhere
- **No `React.FC`** — use explicit `ReactElement` return type: `const Foo = (): ReactElement => { ... }`
- **No `any`** — use proper types or `unknown` with type guards
- **No non-null assertions (`!`)** — use optional chaining or type guards
- **No `console.log`** — ESLint enforces `no-console: "error"`
- **Always use braces** for if/else blocks (`curly: ["error", "all"]`)
- **Always type** `useState<T>()` and `useRef<T>()`
- **Max 2 `useEffect`** per file
- **`data-testid` values must be globally unique** across the project
- **`import type { ... }`** for type-only imports

## Git Workflow

- **Protected branch**: `main` — never push directly
- **Integration branch**: `dev` — all feature work merges here
- **Feature branches**: `feature/<kebab-case-slug>` off `dev`
- **No Husky** or git hooks
- Commit messages: clear, action-oriented (conventional commits style)
- 3–8 commits per feature branch

## Verification After Changes

After any code change, run:
1. `bun run lint` (or `lint:fix`)
2. `bun run typecheck`
3. `bun run test:run`

Or use `bun run validate` to run all checks in sequence.

## ShadCN Component Addition

Add new ShadCN components via: `bunx shadcn@latest add <component-name>`

Config in `components.json` — components go to `src/components/ui/`, utils alias is `@/lib/utils`.

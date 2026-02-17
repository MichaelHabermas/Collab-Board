# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Collab-Board is a real-time collaborative whiteboard application with AI agent support. The project is a **Bun monorepo** with three workspaces: `apps/client` (React + Vite), `apps/server` (Express + Socket.io), and `packages/shared-types`. Epics 0–2 are complete (governance, template, monorepo + backend foundation).

## Monorepo Structure

```
collab-board/
  apps/client/           # React + Vite frontend
  apps/server/           # Express + Socket.io backend
  packages/shared-types/ # TypeScript types shared between client and server
  package.json           # Root workspace config
  tsconfig.json          # Project references
  eslint.config.js       # Shared ESLint config
  .prettierrc            # Shared Prettier config
  render.yaml            # Render deployment config
```

## Commands

All commands use **bun** exclusively — never npm, yarn, or npx. Run from repo root.

```bash
bun install              # Install all workspace dependencies
bun run dev              # Start client (5173) + server (3000) concurrently
bun run build            # Client build + server bundle (production)
bun run start            # Start server (serves client static files in production)
bun run typecheck        # TypeScript project references check (tsc -b)
bun run lint             # ESLint on all workspaces
bun run lint:fix         # ESLint autofix
bun run format           # Prettier on all workspaces
bun run test:run         # Vitest single run (client)
bun run test             # Vitest watch mode (client)
bun run test:coverage    # Vitest with coverage
bun run test:e2e         # Playwright E2E tests
bun run test:e2e:ui      # Playwright UI mode
bun run validate         # format + typecheck + lint + test:run (full check)
```

To run a single test file: `bunx vitest run apps/client/src/path/to/file.test.tsx`

## Architecture

### Client (`apps/client/`)
- **Entry**: `index.html` → `src/main.tsx` → `src/App.tsx`
- **Path alias**: `@/` maps to `src/` (configured in vite.config.ts and tsconfig.json)
- **Components**: `src/components/ui/` for ShadCN primitives, `src/components/` for feature components
- **Utilities**: `src/lib/utils.ts` exports `cn()` for Tailwind class merging
- **Hooks**: `src/hooks/`
- **Tests**: Unit tests co-located as `*.test.{ts,tsx}`, E2E specs in `e2e/`

### Server (`apps/server/`)
- **Entry**: `src/server.ts` → HTTP + Socket.io server
- **App factory**: `src/app.ts` → Express with CORS, JSON, routes, static serving
- **Routes**: `src/routes/` (e.g., `health.routes.ts` → `GET /api/health`)
- **Modules**: `src/modules/board/` — Mongoose models, repository, DB connection
- **Shared**: `src/shared/lib/logger.ts`, `src/shared/interfaces/storage-adapter.ts`, `src/shared/validation/`

### Shared Types (`packages/shared-types/`)
- **Import as**: `@collab-board/shared-types`
- **Board types**: `BoardObject` discriminated union, `Board`, `UserPresence`
- **Socket types**: `ClientToServerEvents`, `ServerToClientEvents` (fully typed Socket.io)
- **AI types**: `AIExecuteRequest`, `AIExecuteResponse`, `ToolDefinition`

## Tech Stack

- **Runtime/PM**: Bun 1.2+ (use `bunx` instead of `npx`)
- **Build**: Vite 7 with `@vitejs/plugin-react` and `@tailwindcss/vite`
- **Language**: TypeScript 5.9 (strict mode, no unused locals/params)
- **UI**: React 19, function components only
- **Styling**: Tailwind CSS v4, design tokens in OKLch color space (see `apps/client/src/index.css`)
- **Components**: ShadCN (new-york style, RSC disabled), Radix UI, lucide-react icons
- **Canvas**: Konva.js (for whiteboard rendering)
- **Backend**: Express 4, Socket.io 4, Mongoose 8
- **Database**: MongoDB Atlas M0
- **Validation**: Zod 3
- **Unit testing**: Vitest + React Testing Library + jsdom
- **E2E testing**: Playwright (Chromium only, dev server on 5173)
- **Linting**: ESLint 10 flat config + typescript-eslint + react + react-hooks + prettier
- **Formatting**: Prettier (single quotes, trailing commas es5, 100 print width, LF line endings)
- **Deployment**: Render (free web service)

## Code Conventions

- **Named exports only** — no default exports anywhere
- **No `React.FC`** — use explicit `ReactElement` return type: `const Foo = (): ReactElement => { ... }`
- **No `any`** — use proper types or `unknown` with type guards
- **No non-null assertions (`!`)** — use optional chaining or type guards
- **No `console.log`** — use `logger` from `src/shared/lib/logger.ts` on server; ESLint enforces `no-console: "error"`
- **Always use braces** for if/else blocks (`curly: ["error", "all"]`)
- **Always type** `useState<T>()` and `useRef<T>()`
- **Max 2 `useEffect`** per file
- **`data-testid` values must be globally unique** across the project
- **`import type { ... }`** for type-only imports

## Git Workflow

- **Protected branch**: `main` — never push directly
- **Integration branch**: `development` — all feature work merges here
- **Feature branches**: `feature/<kebab-case-slug>` off `development`
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

Config in `apps/client/components.json` — components go to `apps/client/src/components/ui/`, utils alias is `@/lib/utils`.

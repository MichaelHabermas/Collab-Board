# Documentation Index

Entry point for Collab-Board documentation. Use this page to find the right doc for your task.

---

## Start here

| If you want to… | Read this |
| --- | --- |
| **Get the app running and run tests** | [DEVELOPER-SETUP.md](guides/DEVELOPER-SETUP.md) |
| **Understand the tech stack in depth** | [TECH-STACK-GUIDE.md](guides/TECH-STACK-GUIDE.md) |
| **See implementation details, modules, and user stories** | [research/5-BASIC-DESIGN-DOCUMENT.md](research/5-BASIC-DESIGN-DOCUMENT.md) and [research/7-PRD-V2.md](research/7-PRD-V2.md) |

---

## Supporting docs

| Document | Purpose |
| --- | --- |
| [DEVELOPER-SETUP.md](guides/DEVELOPER-SETUP.md) | Prerequisites, env vars, run app/tests, debugging, common issues |
| [TECH-STACK-GUIDE.md](guides/TECH-STACK-GUIDE.md) | In-depth per-technology: concepts, API usage, patterns, gotchas, ADR links |
| [SOCKET-EVENTS-REFERENCE.md](guides/SOCKET-EVENTS-REFERENCE.md) | Socket.io event catalog: name, direction, payload, semantics |
| [API-REFERENCE.md](guides/API-REFERENCE.md) | REST overview and link to Swagger at `/api-docs` |
| [GLOSSARY.md](guides/GLOSSARY.md) | Definitions for BoardObject, SyncEngine, optimistic UI, room, presence, etc. |

---

## Research & design

| Document | Purpose |
| --- | --- |
| [research/1-PRE-SEARCH-CHECKLIST.md](research/1-PRE-SEARCH-CHECKLIST.md) | Constraints, architecture discovery, post-stack refinement, cost analysis |
| [research/2-TECH-STACK-OPTIONS.md](research/2-TECH-STACK-OPTIONS.md) | Per-layer technology options and rationale |
| [research/3-IDENTIFY-TRADEOFFS.md](research/3-IDENTIFY-TRADEOFFS.md) | Benefits, costs, and mitigations for each stack choice |
| [research/4-RECORD-ARCHITECTURE-DECISIONS.md](research/4-RECORD-ARCHITECTURE-DECISIONS.md) | 12 ADRs (Architecture Decision Records) |
| [research/5-BASIC-DESIGN-DOCUMENT.md](research/5-BASIC-DESIGN-DOCUMENT.md) | System architecture, modules, data model, real-time sync, AI agent, epics & user stories |
| [research/6-PRD-V1.md](research/6-PRD-V1.md) | Product Requirements Document V1 (features, checkboxes) |
| [research/7-PRD-V2.md](research/7-PRD-V2.md) | PRD V2: architecture reference, diagrams, per-epic context |
| [research/pre-search-ai-conversation.md](research/pre-search-ai-conversation.md) | Pre-search AI conversation log |
| [PRD.md](../PRD.md) | Foundation PRD (Epic 0 + Epic 1) at repo root |

---

## External references

Official documentation for the main technologies:

- **Runtime:** [Bun](https://bun.sh/docs)
- **Language:** [TypeScript](https://www.typescriptlang.org/docs/)
- **Frontend:** [React](https://react.dev), [Vite](https://vite.dev/guide/), [Tailwind CSS](https://tailwindcss.com/docs), [shadcn/ui](https://ui.shadcn.com/docs)
- **Canvas:** [Konva.js](https://konvajs.org/docs/), [react-konva](https://konvajs.org/docs/react/index.html)
- **State:** [Zustand](https://zustand.docs.pmnd.rs/)
- **Real-time:** [Socket.io](https://socket.io/docs/v4/)
- **Backend:** [Express](https://expressjs.com/en/4x/api.html)
- **Data:** [MongoDB Atlas](https://www.mongodb.com/docs/atlas/), [Mongoose](https://mongoosejs.com/docs/)
- **Auth:** [Clerk](https://clerk.com/docs)
- **AI:** [Google Gemini API](https://ai.google.dev/gemini-api/docs)
- **Testing:** [Vitest](https://vitest.dev/guide/), [Playwright](https://playwright.dev/docs/intro)
- **Hosting:** [Render](https://docs.render.com/)

Project requirements (e.g. MVP gate, submission) may be described in a separate PDF; add a link here when that file is available in the repo.

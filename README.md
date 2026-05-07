# Personal Expense Tracker

Local MVP scaffold for a multi-user personal expense tracker. The full product direction is tracked in `docs/implementation-plan.md`; this branch implements Phase 0 project foundation only.

## Stack

- Backend: Express, TypeScript, Zod, Pino, Drizzle ORM, SQLite.
- Frontend: React, Vite, TypeScript, Tailwind.
- Tests: Vitest, Supertest, React Testing Library.

## Package Layout

- `packages/backend`: Express API, database setup, logging, validation, and backend tests.
- `packages/frontend`: Vite React app shell, Tailwind theme foundation, API client, logger wrapper, and frontend tests.

## Local Setup

```bash
npm install
cp packages/backend/.env.example packages/backend/.env
cp packages/frontend/.env.example packages/frontend/.env
npm run dev
```

Backend dev server uses the fixed address `http://127.0.0.1:4000`. Frontend dev server uses the fixed address `http://localhost:5173`. If either port is busy, the dev server fails so you can stop the conflicting process or change the port intentionally.

## Commands

```bash
npm run dev
npm run dev:backend
npm run dev:frontend
npm test
npm run typecheck
npm run build
npm run lint
```

## Environment

Backend variables:

- `NODE_ENV`: `development`, `test`, or `production`.
- `BACKEND_HOST`: host for the Express server.
- `BACKEND_PORT`: port for the Express server.
- `DATABASE_FILE`: SQLite database file path.
- `LOG_LEVEL`: Pino log level.
- `CORS_ORIGIN`: frontend origin for later API/browser integration.

Frontend variables:

- `VITE_API_BASE_URL`: backend API base URL.

## Phase 0 Scope

Phase 0 provides installable workspace scaffolding, a health endpoint, structured backend request logging, frontend logging wrapper, typed API client shell, Tailwind light/dark theme foundation, Drizzle SQLite baseline, and smoke tests.

OAuth, sessions, users, categories, transactions, budgets, WebSocket alerts, Docker, and CI are intentionally deferred to later implementation stages.

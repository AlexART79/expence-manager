# Personal Expense Tracker

Local MVP scaffold for a multi-user personal expense tracker. The full product direction is tracked in `docs/implementation-plan.md`; this branch implements authentication, user identity, category management, and transaction management.

## Stack

- Backend: Express, TypeScript, Zod, Pino, Drizzle ORM, SQLite.
- Frontend: React, Vite, TypeScript, Tailwind.
- Tests: Vitest, Supertest, React Testing Library.

## Package Layout

- `packages/backend`: Express API, database setup, logging, validation, SSO auth, cookie sessions, category and transaction APIs, and backend tests.
- `packages/frontend`: Vite React app shell, Tailwind theme foundation, auth entry UI, category and transaction management UI, feature hooks, constants modules, typed API clients, logger wrapper, and frontend tests.

## Local Setup

```bash
npm install
cp packages/backend/.env.example packages/backend/.env
cp packages/frontend/.env.example packages/frontend/.env
npm run db:migrate --workspace @expense-tracker/backend
npm run dev
```

Backend dev server uses the fixed address `http://localhost:3000`. Frontend dev server uses the fixed address `http://localhost:5173`. If either port is busy, the dev server fails so you can stop the conflicting process or change the port intentionally.

## Commands

```bash
npm run dev
npm run dev:backend
npm run dev:frontend
npm test
npm run typecheck
npm run build
npm run lint
npm run db:generate --workspace @expense-tracker/backend
npm run db:migrate --workspace @expense-tracker/backend
```

## Environment

Backend variables:

- `NODE_ENV`: `development`, `test`, or `production`.
- `BACKEND_HOST`: host for the Express server.
- `BACKEND_PORT`: port for the Express server.
- `DATABASE_FILE`: SQLite database file path.
- `LOG_LEVEL`: Pino log level.
- `CORS_ORIGIN`: frontend origin for later API/browser integration.
- `FRONTEND_URL`: frontend redirect URL after successful OAuth callback.
- `SESSION_SECRET`: secret used to hash opaque session tokens before persistence.
- `AUTH_TEST_MODE`: set to `true` only for deterministic local/test auth callbacks.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`: Google OIDC configuration.
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_REDIRECT_URI`: GitHub OAuth configuration.

Frontend variables:

- `VITE_API_BASE_URL`: backend API base URL.

## Authentication

Authentication is SSO-only through Google or GitHub. The backend stores a local user row keyed by `provider + provider_user_id`; email is profile data only and is not used for identity. Google and GitHub accounts are not linked in this MVP.

Successful callbacks create an opaque `expense_session` HTTP-only cookie. The raw token stays in the cookie, while only an HMAC hash is persisted in SQLite. Local development uses `SameSite=Lax` and non-secure cookies; production marks cookies secure.

The frontend uses `/login` for unauthenticated sign-in. Anonymous visits to `/` are redirected to `/login`; signed-in users are redirected away from `/login` back to `/` and see their name/avatar in the header.

Auth endpoints:

- `GET /api/auth/google/start`
- `GET /api/auth/github/start`
- `GET /api/auth/google/callback?code=...`
- `GET /api/auth/github/callback?code=...`
- `GET /api/auth/me`
- `POST /api/auth/logout`

## Categories

Signed-in users can create, list, rename, and delete their own categories from the authenticated home screen. Category data is isolated by session user, and duplicate names are rejected per user after trimming and case-insensitive normalization.

Category endpoints:

- `GET /api/categories`
- `POST /api/categories` with `{ "name": "Groceries" }`
- `PATCH /api/categories/:categoryId` with `{ "name": "Food" }`
- `DELETE /api/categories/:categoryId`

Category deletion policy: deletion is blocked with `409 CONFLICT` when transactions exist for that category.

## Transactions

Signed-in users can create, list, edit, delete, search, and filter their own expense transactions from the authenticated home screen. Every transaction must belong to one of the signed-in user's categories; foreign category ids and foreign transaction ids return `404 NOT_FOUND`.

Amounts are accepted by the API and UI as decimal dollars, then stored as integer cents. The MVP requires an explicit currency and currently accepts only `USD`. Transaction dates use `YYYY-MM-DD` calendar dates.

Transaction endpoints:

- `GET /api/transactions`
- `GET /api/transactions?search=apple&categoryId=1&dateFrom=2026-05-01&dateTo=2026-05-31&amountMin=20&amountMax=50`
- `POST /api/transactions` with:

```json
{
  "title": "Groceries",
  "amount": "42.35",
  "transactionDate": "2026-05-08",
  "categoryId": 1,
  "notes": "Optional note",
  "currency": "USD"
}
```

- `PATCH /api/transactions/:transactionId` with the same body shape as create.
- `DELETE /api/transactions/:transactionId`

For tests and local smoke checks without real provider calls, set `AUTH_TEST_MODE=true` and visit:

- `http://localhost:3000/api/auth/google/callback?code=test-google`
- `http://localhost:3000/api/auth/github/callback?code=test-github`

Budgets, WebSocket alerts, Docker, and CI are intentionally deferred to later implementation stages.

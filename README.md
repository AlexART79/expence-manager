# Personal Expense Tracker

Local MVP for a multi-user personal expense tracker with SSO-only authentication, private category and transaction data, monthly budgets, and real-time budget threshold alerts.

The implementation roadmap lives in `docs/implementation-plan.md`.

## Stack

- Backend: Express, TypeScript, Zod, Pino, Drizzle ORM, SQLite, WebSocket.
- Frontend: React, Vite, TypeScript, Tailwind.
- Tests: Vitest, Supertest, React Testing Library.
- Containers: production-style Docker Compose with nginx serving the frontend and proxying API/WebSocket traffic.

## Package Layout

- `packages/backend`: Express API, SQLite/Drizzle setup, migrations, logging, SSO auth, cookie sessions, categories, transactions, budgets, WebSocket budget alerts, seed helper, and backend tests.
- `packages/frontend`: Vite React app, auth UI, category/transaction flows, monthly budget dashboard, budget alert banners, typed API clients, theme-aware components, logger wrapper, and frontend tests.

## Local Setup

```bash
npm install
cp packages/backend/.env.example packages/backend/.env
cp packages/frontend/.env.example packages/frontend/.env
npm run db:migrate --workspace @expense-tracker/backend
npm run dev
```

Default local URLs:

- Backend: `http://localhost:3000`
- Frontend: `http://localhost:5173`

Both dev servers use fixed ports. If a port is busy, stop the conflicting process or intentionally change the matching env/config values.

## Commands

```bash
npm run dev
npm run dev:backend
npm run dev:frontend
npm test
npm run typecheck
npm run build
npm run lint
npm run seed
npm run db:generate --workspace @expense-tracker/backend
npm run db:migrate --workspace @expense-tracker/backend
```

`npm run seed` resets deterministic categories and transactions for the Google test user only.

## Environment

Backend variables in `packages/backend/.env`:

- `NODE_ENV`: `development`, `test`, or `production`.
- `BACKEND_HOST`: Express bind host. Local default: `127.0.0.1`. Docker default: `0.0.0.0`.
- `BACKEND_PORT`: Express port. Default: `3000`.
- `DATABASE_FILE`: SQLite database file path.
- `LOG_LEVEL`: Pino log level.
- `CORS_ORIGIN`: frontend origin allowed for credentialed browser requests.
- `FRONTEND_URL`: redirect target after successful OAuth callback.
- `SESSION_SECRET`: at least 16 characters; used to hash opaque session tokens before persistence.
- `AUTH_TEST_MODE`: set to `true` only for deterministic local/Docker test callbacks.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`: Google OIDC configuration.
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_REDIRECT_URI`: GitHub OAuth configuration.

Frontend variables in `packages/frontend/.env`:

- `VITE_API_BASE_URL`: backend origin for API and WebSocket calls. Local default: `http://localhost:3000`.

For local OAuth provider configuration, register these callback URLs:

- Google: `http://localhost:3000/api/auth/google/callback`
- GitHub: `http://localhost:3000/api/auth/github/callback`

For Docker Compose, register these callback URLs:

- Google: `http://localhost:8080/api/auth/google/callback`
- GitHub: `http://localhost:8080/api/auth/github/callback`

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

For deterministic local smoke checks without real provider calls, set `AUTH_TEST_MODE=true` and visit:

- `http://localhost:3000/api/auth/google/callback?code=test-google`
- `http://localhost:3000/api/auth/github/callback?code=test-github`

## API Overview

Health:

- `GET /health`

Categories:

- `GET /api/categories`
- `POST /api/categories` with `{ "name": "Groceries" }`
- `PATCH /api/categories/:categoryId` with `{ "name": "Food" }`
- `DELETE /api/categories/:categoryId`

Signed-in users can create, list, rename, and delete their own categories. Category data is isolated by session user, and duplicate names are rejected per user after trimming and case-insensitive normalization.

Category deletion policy: deletion is blocked with `409 CONFLICT` when transactions exist for that category.

Transactions:

- `GET /api/transactions`
- `GET /api/transactions?search=apple&categoryId=1&dateFrom=2026-05-01&dateTo=2026-05-31&amountMin=20&amountMax=50`
- `POST /api/transactions`
- `PATCH /api/transactions/:transactionId`
- `DELETE /api/transactions/:transactionId`

Transaction create/update body:

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

Every transaction must belong to one of the signed-in user's categories; foreign category ids and foreign transaction ids return `404 NOT_FOUND`. Amounts are accepted by the API and UI as decimal dollars, then stored as integer cents. Transaction dates use `YYYY-MM-DD`. The MVP requires explicit `USD`.

Budgets:

- `GET /api/budgets/:month`
- `PUT /api/budgets/:month`
- `GET /api/budgets/:month/summary`

Budget body:

```json
{
  "amount": "500.00",
  "currency": "USD"
}
```

Month values use `YYYY-MM`. The summary response includes selected-month spending totals even when no budget is set. In the no-budget state, `budget`, `remaining`, `remainingCents`, and `usagePercentage` are `null`.

Example summary:

```json
{
  "summary": {
    "month": "2026-05",
    "budget": null,
    "totalSpent": "125.50",
    "totalSpentCents": 12550,
    "remaining": null,
    "remainingCents": null,
    "usagePercentage": null,
    "currency": "USD"
  }
}
```

## WebSocket Budget Alerts

The WebSocket endpoint is `GET /ws` as an HTTP upgrade request. It uses the same `expense_session` cookie as the HTTP API, so anonymous clients are rejected.

After opening the socket, the client subscribes with:

```json
{
  "type": "budget_alerts.subscribe",
  "payload": {
    "month": "current"
  }
}
```

The server sends one message per newly crossed threshold:

```json
{
  "type": "budget_alerts.alert",
  "payload": {
    "month": "2026-05",
    "threshold": 80,
    "usagePercentage": 84.5,
    "totalSpent": "422.50",
    "budgetAmount": "500.00",
    "currency": "USD",
    "message": "You have used 80% of your May budget."
  }
}
```

Alert rules:

- Thresholds are `50`, `80`, and `100` percent.
- Alerts apply to the current calendar month.
- A budget must exist and spending must be greater than zero.
- Each threshold is delivered once per user/month, even if spending later drops below that threshold.
- Alerts can be emitted after subscription and after transaction create/update/delete changes budget usage.

## Docker

Docker Compose runs a production-style reviewer environment:

- `frontend`: builds the Vite app, serves static files with nginx, and proxies `/api/`, `/health`, and `/ws`.
- `backend`: builds the Express app, runs Drizzle migrations on startup, and stores SQLite data in a named volume.
- Reviewer URL: `http://localhost:8080`

Start the app:

```bash
docker compose build
docker compose up -d
```

Smoke checks:

```bash
curl http://localhost:8080/health
curl -i "http://localhost:8080/api/auth/google/callback?code=test-google"
curl -i "http://localhost:8080/api/auth/github/callback?code=test-github"
curl http://localhost:8080/
docker compose logs backend
```

The health response should be `{"status":"ok"}`. Test callbacks should return `302` and a `Set-Cookie: expense_session=...` header when `AUTH_TEST_MODE=true`, which is the default in `docker-compose.yml`.

Stop the app:

```bash
docker compose down
```

Remove the SQLite volume if you want a fresh container database:

```bash
docker compose down -v
```

For real OAuth in Docker, set the provider client values in your shell or `.env` before `docker compose up`, and use the `localhost:8080` redirect URLs listed in the Environment section.

## Reviewer Acceptance Checklist

S7.2 is a manual reviewer checklist. The items below are documented for clone-and-check review; they are not claimed as manually executed by the automated test suite.

- Configure Google and GitHub OAuth using the callback URLs above.
- Run the local app with `npm run dev`, then sign in with Google and GitHub.
- Refresh the authenticated page and confirm the session persists.
- Create, rename, and delete a category.
- Confirm deleting a category with transactions is blocked.
- Create, edit, delete, search, and filter transactions.
- Set a monthly budget and confirm summary values update after transaction changes.
- Cross 50%, 80%, and 100% current-month budget thresholds and confirm alert banners appear.
- Log out and confirm protected app content redirects to `/login`.
- Run `npm test`, `npm run typecheck`, `npm run build`, and `npm run lint`.
- Run the Docker smoke checks in the Docker section.

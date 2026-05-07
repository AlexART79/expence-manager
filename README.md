# Expense Tracker

A multi-user personal expense tracker with SSO authentication, category and transaction management, monthly budget summaries, and real-time budget threshold alerts.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Express + TypeScript |
| Frontend | React + Vite + TypeScript + Tailwind CSS |
| Database | Drizzle ORM + SQLite |
| Validation | Zod |
| Logging | pino (backend), typed console wrapper (frontend) |
| Real-time | WebSockets |
| Auth | Google OIDC + GitHub OAuth |
| Testing | Vitest |

## Prerequisites

- Node.js 20+
- npm 10+
- Visual Studio C++ Build Tools (required by `better-sqlite3` on Windows)

## Local Setup

```bash
# 1. Install dependencies (from the repo root)
npm install

# 2. Configure backend environment
cp packages/backend/.env.example packages/backend/.env

# 3. Configure frontend environment
cp packages/frontend/.env.example packages/frontend/.env

# 4. Apply database migrations
npm run db:migrate -w packages/backend

# 5. Start both dev servers
npm run dev
```

Frontend runs at `http://localhost:5173`.
Backend runs at `http://localhost:3000`.

## Commands

### Root (run from repo root)

| Command | Description |
|---|---|
| `npm install` | Install all workspace dependencies |
| `npm run dev` | Start backend and frontend dev servers concurrently |
| `npm test` | Run all tests (backend then frontend) |
| `npm run lint` | Lint all TypeScript files |
| `npm run format` | Auto-format all source files with Prettier |
| `npm run format:check` | Check formatting without writing |

### Backend only

```bash
npm run dev -w packages/backend        # Dev server with hot reload
npm run build -w packages/backend      # Compile to dist/
npm run test -w packages/backend       # Run tests once
npm run test:watch -w packages/backend # Run tests in watch mode
npm run db:generate -w packages/backend # Generate migration from schema changes
npm run db:migrate -w packages/backend  # Apply pending migrations
```

### Frontend only

```bash
npm run dev -w packages/frontend        # Vite dev server
npm run build -w packages/frontend      # Production build
npm run test -w packages/frontend       # Run tests once
npm run test:watch -w packages/frontend # Run tests in watch mode
```

## OAuth Setup

Authentication requires creating OAuth apps on Google and GitHub. Both are optional for running tests — the app falls back to a test-only login stub when credentials are absent — but are required to use the real sign-in flow.

### Google

1. Open [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials).
2. Click **Create Credentials → OAuth client ID**.
3. Choose **Web application**.
4. Under **Authorized redirect URIs**, add:
   ```
   http://localhost:3000/api/auth/google/callback
   ```
5. Copy the **Client ID** and **Client secret** into `packages/backend/.env`:
   ```
   GOOGLE_CLIENT_ID=<your client id>
   GOOGLE_CLIENT_SECRET=<your client secret>
   ```

Reference: [Google Identity — Setting up OAuth 2.0](https://developers.google.com/identity/protocols/oauth2/web-server#creatingcred)

### GitHub

1. Open [GitHub → Settings → Developer settings → OAuth Apps](https://github.com/settings/developers).
2. Click **New OAuth App**.
3. Fill in:
   - **Application name**: anything (e.g. `Expense Tracker Dev`)
   - **Homepage URL**: `http://localhost:5173`
   - **Authorization callback URL**:
     ```
     http://localhost:3000/api/auth/github/callback
     ```
4. Click **Register application**, then **Generate a new client secret**.
5. Copy the **Client ID** and **Client secret** into `packages/backend/.env`:
   ```
   GITHUB_CLIENT_ID=<your client id>
   GITHUB_CLIENT_SECRET=<your client secret>
   ```

Reference: [GitHub Docs — Creating an OAuth app](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app)

### Session secret

Generate a random string of at least 32 characters and set it in `packages/backend/.env`:

```
SESSION_SECRET=<random 32+ character string>
```

You can generate one with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

## Environment Variables

### `packages/backend/.env`

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | HTTP server port |
| `NODE_ENV` | `development` | Runtime environment (`development` \| `test` \| `production`) |
| `DATABASE_URL` | `./data/app.db` | Path to the SQLite database file |
| `SESSION_SECRET` | — | Secret for signing session cookies (min 32 chars) |
| `BASE_URL` | `http://localhost:3000` | Public URL of the backend (used in OAuth callback URLs) |
| `FRONTEND_URL` | `http://localhost:5173` | Public URL of the frontend (used for post-login redirect) |
| `GOOGLE_CLIENT_ID` | — | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | — | Google OAuth client secret |
| `GITHUB_CLIENT_ID` | — | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | — | GitHub OAuth app client secret |
| `LOG_LEVEL` | `debug` | Minimum log level (`debug` \| `info` \| `warn` \| `error` \| `silent`) |
| `LOG_FORMAT` | `pretty` | Log output format (`pretty` \| `json`). Use `json` in production. |
| `LOG_TO_CONSOLE` | `true` (non-test) | Write logs to stdout |
| `LOG_TO_FILE` | `true` (non-test) | Write logs to `LOG_DIR/app.log` and `LOG_DIR/error.log` |
| `LOG_DIR` | `logs/backend` | Directory for log files |

### `packages/frontend/.env`

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:3000` | Backend API base URL |

## Database

Drizzle ORM manages the schema and migrations.

```bash
# After changing packages/backend/src/db/schema/index.ts:
npm run db:generate -w packages/backend  # generates a new SQL migration file

# To apply all pending migrations:
npm run db:migrate -w packages/backend
```

Migration files live in `packages/backend/src/db/migrations/` and are committed to source control. The SQLite database file (`packages/backend/data/app.db`) is gitignored.

## Project Structure

```
├── packages/
│   ├── backend/                  Express API + WebSocket server
│   │   └── src/
│   │       ├── app.ts            createApp() factory (testable)
│   │       ├── env.ts            Zod-validated environment config
│   │       ├── logger.ts         pino logger with multi-stream + redaction
│   │       ├── middleware/       errorHandler, validateRequest
│   │       ├── routes/           Express routers by feature
│   │       ├── db/               Drizzle schema, connection, migrations
│   │       └── test/             startTestServer(), createTestDb() helpers
│   └── frontend/                 Vite + React app
│       └── src/
│           ├── lib/
│           │   ├── apiClient.ts  Typed fetch wrapper (credentials-ready)
│           │   └── logger.ts     Typed console wrapper (debug/info/warn/error)
│           ├── components/       Shared UI components
│           └── pages/            Route-level page components
├── tsconfig.base.json            Shared TypeScript base config
├── .eslintrc.cjs                 ESLint config (TypeScript rules)
└── .prettierrc                   Prettier config
```

Backend modules will be organized by feature area: `auth`, `users`, `categories`, `transactions`, `budgets`, `alerts`, `db`.

## Architecture Decisions

**Category deletion:** Blocked when transactions exist. Attempting to delete a category that has associated transactions returns an error rather than cascading.

**Currency:** Single explicit currency (USD). All amounts are stored and displayed in USD.

**Account linking:** No linking between providers. A Google login and a GitHub login create separate local user accounts.

**SSO identity key:** `provider + provider_user_id`. Email is not used as an identity key because GitHub may omit it.

**WebSocket subscription:** The client must send a `budget_alerts.subscribe` message after connecting to begin receiving alerts:
```json
{
  "type": "budget_alerts.subscribe",
  "payload": { "month": "current" }
}
```

**Budget alerts:** Sent at 50%, 80%, and 100% of the monthly budget. Each threshold fires at most once per calendar month, even if spending later drops below it.

## API Error Shape

All API errors use a consistent JSON shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Amount must be greater than 0",
    "details": {}
  }
}
```

Common codes: `VALIDATION_ERROR` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `INTERNAL_ERROR` (500).

## Logging

Backend logging uses `pino`. Sensitive fields are automatically redacted from all log output: cookies, authorization headers, passwords, tokens, and secrets appear as `[redacted]`.

In development (`LOG_FORMAT=pretty`), logs are human-readable. In production (`LOG_FORMAT=json`), logs are newline-delimited JSON suitable for log aggregators.

When `LOG_TO_FILE=true`, the backend writes to:
- `logs/backend/app.log` — all log levels
- `logs/backend/error.log` — errors only

The frontend uses a small typed wrapper (`src/lib/logger.ts`) with `debug`, `info`, `warn`, `error` methods. Debug output is suppressed outside of development.

## Testing

Tests use Vitest. Backend tests use a real in-memory SQLite database — no mocks for the database layer. External services (Google, GitHub) are stubbed.

```bash
npm test                  # Run all tests from root
npm run test:watch -w packages/backend   # Watch mode for TDD
```

The `startTestServer()` helper binds the Express app to a random OS-assigned port, so parallel test runs never conflict. The `createTestDb()` helper creates an isolated `:memory:` SQLite database per test.

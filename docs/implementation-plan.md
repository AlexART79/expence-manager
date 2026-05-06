# Personal Expense Tracker High-Level Implementation Plan

## Goal

Deliver a working local MVP for a multi-user personal expense tracker with SSO-only authentication, private user data, category and transaction management, monthly budget summaries, real-time budget threshold alerts over WebSocket, light/dark theme support, structured logging, and automated tests.

## Proposed Architecture

- Monorepo with separate packages: `packages/backend` and `packages/frontend`.
- Backend: Express + TypeScript, Zod validation, Drizzle ORM + SQLite, secure cookie sessions, Google OIDC, GitHub OAuth, WebSocket server sharing the HTTP session authorization model.
- Frontend: React + Vite + TypeScript + Tailwind, Zod-backed form validation where useful, typed API client, WebSocket client, responsive UI with light and dark themes.
- Testing: backend API/service/WebSocket tests with mocked SSO provider responses; frontend component or integration tests for major states where practical.

## Project-Specific Engineering Conventions

- Use `packages/backend` for the Express API and WebSocket server.
- Use `packages/frontend` for the Vite React app.
- Prefer small vertical slices: database schema, backend API, frontend UI, and tests should evolve together around user-visible behavior.
- Keep user data isolated by `userId` everywhere. Do not add category, transaction, budget, or alert operations that can read or mutate data without authorization checks.
- Use `provider + provider_user_id` as the SSO identity key. Do not rely on email for identity because GitHub may omit it.
- Use Zod for structured validation at API, WebSocket, form, environment, and third-party boundaries. Share or mirror schemas between backend and frontend where practical.
- Keep environment-specific configuration in `.env` files and document every required variable in `README.md`.
- Add tests with each meaningful behavior change. Tests must not call real Google or GitHub services.
- Keep README updated as behavior decisions are made, especially category deletion behavior, WebSocket message format, OAuth configuration, and local run commands.
- Use plain, readable TypeScript. Avoid broad abstractions until there are at least two concrete use cases.

## Logging Plan

- Set up logging in Stage 0, before feature work spreads across the app.
- Backend logging should use `pino` with request logging through `pino-http` or an equivalent Express middleware.
- Frontend logging should use a small typed wrapper around `console` initially, with room to forward events later. Keep the public API stable: `debug`, `info`, `warn`, `error`.
- Log structured context, not secrets. Include request ids, authenticated user ids, provider names, entity ids, and WebSocket connection ids when useful.
- Never log OAuth tokens, session cookies, authorization headers, full provider profiles, or notes content unless explicitly scrubbed for a test.
- If code can be reused from the previous Task Manager project, copy only the proven logger shape and adapt names/configuration to this repository.

## Backend Package Shape

- Organize backend code by feature area:
  - `auth`: OAuth/OIDC flow, sessions, authenticated user middleware.
  - `users`: local user records and provider identity mapping.
  - `categories`: category CRUD and deletion policy.
  - `transactions`: expense CRUD plus search/filter query handling.
  - `budgets`: monthly budget CRUD and budget summary calculations.
  - `alerts`: budget threshold state and WebSocket alert delivery.
  - `db`: Drizzle schema, migrations, connection setup, seed/test helpers.
- Keep route handlers thin. Move database and business rules into service/repository modules that can be tested directly.
- Return consistent API errors with a stable shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Amount must be greater than 0",
    "details": {}
  }
}
```

## Frontend Package Shape

- Build the authenticated app as the primary product surface.
- Use Tailwind utility classes consistently. Prefer reusable components for buttons, fields, dialogs, empty states, loading states, alerts, and theme-aware layout primitives.
- Support both light and dark theme. Theme tokens/classes must cover all major screens and interactive states.
- Use responsive layouts from the beginning. Transactions may become cards on narrow screens or use horizontal scroll if the table remains readable.
- Keep forms controlled and validate on the client before submit. Show field-level feedback for transaction title, amount, date, and category.
- API access should go through typed client helpers. Components should not assemble raw endpoint URLs in many places.
- Keep authentication state refresh-safe by loading the current session/user on app startup.
- WebSocket behavior should be visible and understandable in the UI:
  - show connection state when relevant;
  - send a documented `subscribe` message after auth/session is known;
  - render budget alerts as toast notifications, banners, or a notification panel.
- Empty states must exist for no transactions, no categories, no search results, and no budget set.
- At least one main dashboard block should show a real loading state while data is being fetched.

## Key Product Decisions To Lock Early

- Category deletion behavior: recommended MVP choice is **block deletion when transactions exist**. This is simpler, safer, and easy to explain in README.
- Currency: recommended MVP choice is **single explicit currency**, for example `USD`, shown in budget and transaction UI.
- Account linking: recommended MVP choice is **no linking**. Google and GitHub logins can create separate local accounts.
- WebSocket client message: recommended MVP choice is `budget_alerts.subscribe`, which changes server behavior by enabling budget alert delivery only after subscription.
- Logger reuse: inspect the previous Task Manager logger and reuse its shape only if it fits quickly; otherwise implement a small `pino` backend logger and typed frontend logger wrapper first.

## Stage 0: Project Foundation

**Milestone:** A developer can install dependencies, run frontend/backend dev servers, run tests, and see structured logs from both apps.

**Stories that can run in parallel:**

- **S0.1 Monorepo scaffold**
  - Create `packages/backend`, `packages/frontend`, and shared root scripts.
  - Add TypeScript config, lint/format baseline, package scripts, Zod dependencies, and `.env.example` files.
  - Outcome: `npm install`, `npm run dev`, and `npm test` commands exist, even if tests are minimal.

- **S0.2 Backend foundation**
  - Set up Express app factory, health endpoint, error middleware, Zod request validation pattern, Zod environment validation, and test server helper.
  - Add backend `pino` logger and request ids.
  - Outcome: `GET /health` returns OK and logs one structured request line.

- **S0.3 Frontend foundation**
  - Set up Vite React app, Tailwind, routing skeleton, light/dark theme foundation, Zod-ready form validation pattern, API client shell, and frontend logger wrapper.
  - Outcome: frontend renders an app shell with a loading-capable main area and no console/type errors.

- **S0.4 Drizzle + SQLite baseline**
  - Add Drizzle config, SQLite connection, migration scripts, and test database reset helper.
  - Outcome: migrations can be generated/applied locally and in tests.

## Stage 1: Authentication And User Identity

**Milestone:** A user can sign in with Google or GitHub, refresh the page, remain authenticated, log out, and have a local user record created automatically.

**Stories that can run in parallel after Stage 0:**

- **S1.1 Auth schema and session storage**
  - Create `users` table with provider, provider user id, email, display name, and optional avatar URL.
  - Add unique index on `provider + provider_user_id`.
  - Add session persistence using secure HTTP-only cookies.
  - Outcome: authenticated backend requests can resolve `currentUser`.

- **S1.2 Google and GitHub SSO**
  - Implement Google OIDC and GitHub OAuth callback flows.
  - Add test-mode provider stubs for login success path.
  - Outcome: first successful SSO login upserts/creates a local user record.

- **S1.3 Frontend auth entry and session state**
  - Build auth entry screen with “Continue with Google” and “Continue with GitHub”.
  - Add current-user bootstrap on app load and logout action.
  - Outcome: refresh-safe authenticated app shell.

- **S1.4 Auth tests**
  - Cover mock SSO success path and logout/session behavior.
  - Outcome: auth tests pass without real Google/GitHub network calls.

## Stage 2: Categories

**Milestone:** An authenticated user can create, rename, list, and delete their own categories, with per-user uniqueness and documented deletion behavior.

**Stories that can run in parallel after Stage 1 auth middleware exists:**

- **S2.1 Category backend**
  - Add categories schema and API routes.
  - Enforce `userId` authorization and unique category names per user.
  - Block deletion if transactions exist in the category.
  - Outcome: API supports all category CRUD operations with clear errors.

- **S2.2 Category UI**
  - Build categories management page or modal.
  - Add create, rename, delete flows, empty state, loading state, and error display.
  - Outcome: categories can be managed from the UI.

- **S2.3 Category tests**
  - Cover create category, duplicate names per user, and cross-user access denial.
  - Outcome: required category and authorization coverage exists.

## Stage 3: Transactions

**Milestone:** An authenticated user can create, edit, delete, search, and filter their own expense transactions.

**Stories that can run in parallel after categories are usable:**

- **S3.1 Transaction backend**
  - Add transactions schema and API routes.
  - Validate title, amount, transaction date, category ownership, notes, and explicit currency.
  - Add search by title/notes, category filter, date-range filter, and amount-range filter.
  - Outcome: API supports transaction CRUD and all required query filters.

- **S3.2 Transaction UI**
  - Build transaction list/table with responsive behavior.
  - Add search input, category filter, date range controls, amount min/max controls.
  - Add create/edit form in modal, drawer, or page with client-side validation.
  - Outcome: users can manage transactions end to end in the browser.

- **S3.3 Transaction tests**
  - Cover create transaction, validation failures, category ownership checks, and cross-user data isolation.
  - Outcome: required transaction and authorization coverage exists.

## Stage 4: Monthly Budgets And Dashboard

**Milestone:** A user can set a monthly budget and see selected-month total spent, budget amount, remaining budget, and usage percentage, including a clear no-budget state.

**Stories that can run in parallel after transactions exist:**

- **S4.1 Budget backend**
  - Add monthly budgets schema keyed by `userId + month`.
  - Add set/get budget API.
  - Add budget summary API that calculates total spent, remaining budget, and usage percentage.
  - Outcome: selected-month budget summary is correct and authorization enforced.

- **S4.2 Dashboard UI**
  - Build selected-month dashboard cards/blocks.
  - Add budget set/edit UI.
  - Show loading state and “No budget set” state.
  - Outcome: main dashboard communicates monthly spending clearly.

- **S4.3 Budget tests**
  - Cover summary calculations, no-budget response, and cross-user budget access denial.
  - Outcome: budget calculations are protected against regressions.

## Stage 5: WebSocket Budget Alerts

**Milestone:** While connected and subscribed, the frontend receives visible real-time alerts for 50%, 80%, and 100% budget usage thresholds for the current calendar month, once per threshold per month.

**Stories that can run in parallel after budgets and transactions exist:**

- **S5.1 WebSocket authentication and subscription**
  - Share session authorization with WebSocket connections.
  - Validate incoming WebSocket messages with Zod.
  - Require client message:

```json
{
  "type": "budget_alerts.subscribe",
  "payload": {
    "month": "current"
  }
}
```
  - Outcome: server sends alerts only to authenticated, subscribed connections.

- **S5.2 Alert calculation and persistence**
  - Add budget alert state table keyed by `userId + month + threshold`.
  - Calculate current calendar month thresholds on connection open and after transaction create/update/delete.
  - Preserve once-per-threshold-per-month behavior even if spending later drops below a threshold.
  - Outcome: alert rules match requirements and do not spam users.

- **S5.3 Frontend WebSocket client and UI**
  - Connect after session bootstrap.
  - Send `budget_alerts.subscribe`.
  - Render alerts as toast, banner, or notification panel.
  - Outcome: alerts are visible in the UI and recover gracefully from connection errors.

- **S5.4 WebSocket tests**
  - Cover 50%, 80%, and 100% alerts; no alerts without current-month budget; once-per-month behavior; auth/subscription enforcement.
  - Outcome: required WebSocket quality coverage exists.

## Stage 6: UX Polish And Error Handling

**Milestone:** The app satisfies the UI acceptance criteria: modern light and dark themes, responsive layout, hover/focus states, clear empty/loading/error states, and client-side validation feedback.

**Stories that can run in parallel after core screens exist:**

- **S6.1 Design system pass**
  - Standardize buttons, inputs, dialogs, spacing, typography, focus rings, hover states, and theme tokens.
  - Outcome: major screens feel consistent and polished.

- **S6.2 Empty/loading/error states**
  - Verify no transactions, no categories, no search results, no budget set, and main loading state.
  - Add visible error messages for failed API calls.
  - Outcome: expected states are checkable without reading code.

- **S6.3 Responsive verification**
  - Verify dashboard, transactions, categories, and auth screens on narrow and desktop viewports.
  - Outcome: no major layout overlap, unreadable controls, or blocked workflows.

## Stage 7: Documentation And Acceptance Hardening

**Milestone:** A reviewer can clone the GitLab repo, configure OAuth, run the app locally, run tests, and verify every acceptance checklist item.

**Stories that can run in parallel near the end:**

- **S7.1 README completion**
  - Document local frontend/backend commands, tests, API overview, OAuth env vars, category deletion behavior, WebSocket message format, alert rules, and containerization status.
  - Outcome: README satisfies deliverables.

- **S7.2 Acceptance checklist verification**
  - Manually run through Google/GitHub sign-in, category/transaction flows, budget summary, search/filter, WebSocket alerts, logout, and refresh persistence.
  - Outcome: every checklist item has been verified or documented as a known issue.

- **S7.3 Test suite and CI-ready cleanup**
  - Run full backend and frontend tests.
  - Fix flaky tests, type errors, and lint failures.
  - Outcome: tests pass locally with deterministic mock SSO.

- **S7.4 Optional Docker**
  - Add Dockerfile/docker-compose only if it can be tested locally.
  - If skipped, document the reason in README.
  - Outcome: optional deliverable is either working or explicitly scoped out.

## Parallelization Map

- Stage 0 can be split among foundation, backend shell, frontend shell, and database setup.
- Stage 1 auth backend and frontend auth UI can proceed together once endpoint contracts are agreed.
- Stage 2 categories and Stage 3 transactions have a dependency: transaction create/edit needs categories, but transaction list/filter UI scaffolding can begin with mocked data.
- Stage 4 budgets depends on transactions for spent totals, but dashboard layout can start earlier with mocked summary data.
- Stage 5 alert UI can start with mocked WebSocket messages while backend alert persistence is implemented.
- Stage 6 polish can run continuously after each major screen lands.
- Stage 7 documentation can start early and should be updated at every milestone.

## Suggested Milestone Order For Commits

1. `chore: scaffold monorepo and tooling`
2. `chore: add logging and database foundation`
3. `feat: add sso authentication and sessions`
4. `feat: add category management`
5. `feat: add transaction management and filters`
6. `feat: add monthly budgets and dashboard summary`
7. `feat: add websocket budget alerts`
8. `test: cover auth authorization and budget alerts`
9. `docs: document local setup and acceptance behavior`

# Stage 3 Transactions Implementation Plan

## Summary

Implement Stage 3 from `docs/implementation-plan.md`: authenticated users can create, edit, delete, search, and filter only their own expense transactions. Stage 2 categories are the dependency baseline; every transaction must belong to a category owned by the current user.

## Key Changes

- Backend:
  - Add a `transactions` Drizzle table with `id`, `userId`, `categoryId`, `title`, `amountCents`, `transactionDate`, `notes`, `currency`, `createdAt`, and `updatedAt`.
  - Store money as integer cents; accept decimal API/form input and validate `amount > 0`.
  - Use `transactionDate` as `YYYY-MM-DD` text for simple SQLite filtering.
  - Require explicit `currency`; MVP default/only accepted value is `USD`.
  - Add authenticated CRUD routes at `/api/transactions`.
  - Add list filters: `search`, `categoryId`, `dateFrom`, `dateTo`, `amountMin`, `amountMax`.
  - Enforce `userId` isolation on every read/write and validate that `categoryId` belongs to the current user.

- Frontend:
  - Add `TransactionClient` using the existing `ApiClient` and Zod response parsing.
  - Add transaction management to the authenticated home screen near categories.
  - Build responsive list/table behavior with loading, empty, no-results, and API error states.
  - Add controls for search, category, date range, and amount min/max filters.
  - Add create/edit form with controlled fields for title, amount, date, category, notes, and currency.

- Documentation:
  - Update `README.md` with transaction endpoints, request shapes, filters, and the `USD` MVP currency decision.
  - Keep broader direction in `docs/implementation-plan.md`; no Docker, CI, deployment, budget, or WebSocket work in this stage.

## Actionable Tasks

1. Add backend schema, migration, and test DB support.
2. Add backend validation, service functions, ownership checks, filters, and routes.
3. Add frontend transaction API client with Zod parsing and tests.
4. Add transaction UI to the authenticated app with form, filters, list, and error states.
5. Update README and run targeted plus full verification.

## Test Plan

- Backend:
  - Unauthenticated transaction requests return `401`.
  - Authenticated user can create, list, update, and delete their own transaction.
  - Validation rejects blank title, invalid amount, invalid date, missing/foreign category, invalid currency, and invalid filters.
  - Search matches title and notes.
  - Category, date-range, and amount-range filters return only matching current-user transactions.
  - Cross-user transaction ids and category ids return `404`.
  - Category deletion remains blocked when transactions reference it.

- Frontend:
  - Authenticated screen loads and renders transactions.
  - Empty, loading, no-results, create, edit, delete, and API error states render clearly.
  - Filters call `TransactionClient.listTransactions()` with the expected filter values.
  - Form validation blocks invalid title, amount, date, category, and currency.
  - Existing auth and category tests continue passing.

- Verification commands:
  - `npm test --workspace @expense-tracker/backend -- --run src/transactions src/categories`
  - `npm test --workspace @expense-tracker/frontend -- --run src/transactions src/App.test.tsx`
  - `npm run typecheck`
  - `npm run build`

## Assumptions

- Stage 2 category backend/frontend is available and remains the dependency for transaction category selection.
- MVP currency is explicit but limited to `USD`.
- Amount API/form input uses decimal dollars; persistence uses integer cents.
- Transaction dates are calendar dates without timezone semantics.
- Notes are optional and private; do not log note content.
- Transaction management can live on the authenticated home screen until a fuller navigation structure is added.

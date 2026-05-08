# Stage 4 Monthly Budgets And Dashboard Implementation Plan

## Summary

Implement Stage 4 from `docs/implementation-plan.md`: authenticated users can set one overall budget per selected month and see selected-month total spent, budget amount, remaining budget, and usage percentage.

Chosen approach: overall monthly budget with a native month picker, defaulting to the current month. Budget amounts use decimal dollars at API/UI boundaries and integer cents in SQLite, matching transactions.

## Key Changes

- Backend:
  - Add a `monthlyBudgets` Drizzle table keyed by unique `userId + month`, where `month` is `YYYY-MM`.
  - Add authenticated routes under `/api/budgets` for get, upsert, and selected-month summary.
  - Validate month, amount, and currency with Zod; enforce `userId` on every query.
  - Calculate monthly spending from `transactions.transactionDate` in the selected calendar month.

- Frontend:
  - Add `packages/frontend/src/budgets` with a typed client, form helpers, hook, and dashboard component.
  - Replace the placeholder dashboard blocks in `HomePage` with the real budget dashboard.
  - Add native month picker, budget set/edit form, loading state, API error state, and clear no-budget state.
  - Refresh the budget summary after transaction create/update/delete.

- Documentation:
  - Update `README.md` with budget API shape, `YYYY-MM` month format, `USD` MVP currency, and no-budget behavior.
  - Do not add WebSocket alerts, Docker, CI, or category-level budgets in this stage.

## Public Interfaces

- `Budget`: `id`, `month`, `amount`, `amountCents`, `currency: "USD"`, `createdAt`, `updatedAt`.
- `BudgetSummary`: `month`, `budget`, `totalSpent`, `totalSpentCents`, `remaining`, `remainingCents`, `usagePercentage`, `currency: "USD"`.
- Frontend injection: add optional `budgetClient` prop to `App`, pass it into `HomePage`, and refresh the dashboard through an `onTransactionsChanged` callback.

## Actionable Tasks

1. Add budget schema, migration, and test database support.
2. Add budget service functions for get, upsert, and selected-month summary calculations.
3. Add authenticated budget routes with Zod validation and stable error responses.
4. Add backend route tests for unauthenticated access, validation, upsert/get, no-budget summary, summary math, and cross-user isolation.
5. Add frontend `BudgetClient` with Zod parsing and client tests.
6. Add budget dashboard hook/component and integrate it into the authenticated home screen.
7. Update transaction mutation flow to notify the dashboard after create/update/delete.
8. Update README and run targeted plus full verification.

## Test Plan

- Backend targeted: `npm test --workspace @expense-tracker/backend -- --run src/budgets src/transactions`
- Frontend targeted: `npm test --workspace @expense-tracker/frontend -- --run src/budgets src/App.test.tsx`
- Full checks: `npm run typecheck`, `npm run build`

## Assumptions

- Stage 4 implements one overall monthly budget per user/month, not category budgets.
- Month identifiers are stored and passed as `YYYY-MM`.
- Currency remains explicit but limited to `USD`.
- Budget amount input uses decimal dollars; persistence uses integer cents.
- Usage percentage can exceed `100` when spending is over budget.
- No-budget summaries still show total spent for the selected month, but remaining and usage are `null`.

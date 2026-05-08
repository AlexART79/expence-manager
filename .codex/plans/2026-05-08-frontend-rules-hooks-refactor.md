# Frontend Rules And Hooks Refactor Plan

## Summary

Refactor `packages/frontend` so component files become mostly presentational, feature behavior moves into hooks/helpers, and logic literals move into named constants. Keep one-off Tailwind `className` strings inline; extract only logic constants such as routes, messages, action keys, limits, provider metadata, and currency.

Update docs during implementation so future work follows the new boundaries: root `AGENTS.md`, `packages/frontend/AGENTS.md`, and `README.md`.

## Key Changes

- Split multi-component files into one component per file:
  - `LoginPage` / `ProviderButton`
  - `TransactionForm` / `TransactionFormFields` / `TransactionFormActions`
  - `CategoryRow` / `CategoryRenameActions` / `CategoryRowActions`
  - `TransactionRow` / `TransactionSummary` / `TransactionRowActions`
  - `TransactionManager` / `TransactionList`
- Move non-component behavior out of component files:
  - App route helpers into `src/app/appRouting.ts`
  - Auth bootstrap/logout into `src/auth/useAuthSession.ts`
  - Category state/actions into `src/categories/useCategoryManager.ts`
  - Transaction state/actions into `src/transactions/useTransactionManager.ts`
  - Transaction formatting into `src/transactions/transactionDisplay.ts`
  - User initials/avatar fallback into `src/components/userDisplay.ts` and `src/components/useAvatarFallback.ts`
- Add constants modules for routes, browser events, messages, action keys, limits, provider metadata, and user menu behavior.
- Preserve existing auth routing, live transaction filtering, inline delete confirmations, tested layout classes, and `mode-transition` behavior.

## Documentation Updates

- Update root `AGENTS.md` frontend rules to say component files should export one component, avoid local helper functions, and use named constants for logic literals while allowing inline Tailwind utilities.
- Update `packages/frontend/AGENTS.md` to document hook-owned feature state and presentational component boundaries.
- Update `README.md` package description to mention feature hooks, constants modules, and typed clients as the frontend architecture pattern.

## Implementation Order

1. Run focused frontend tests before editing.
2. Split nested components into one-component files.
3. Extract constants and pure helpers.
4. Extract hooks for auth, category, transaction, theme, and avatar fallback behavior.
5. Update docs.
6. Run focused tests, full frontend tests, typecheck, and build.

## Test Cases And Scenarios

- Auth route guard, login redirect, logout, and session bootstrap error.
- Category load, empty state, create, rename, delete confirmation, and layout classes.
- Transaction load, empty state, create, inline edit, delete confirmation, immediate filters, clear filters, and stale response guard.
- Display helpers for uncategorized transactions, USD amount display, initials fallback, and avatar error fallback.

## Assumptions

- "Use consts, not literals" applies to logic literals only; one-off Tailwind `className` strings stay inline.
- No new state library is introduced.
- This refactor is behavior-preserving; budget/dashboard and WebSocket hooks remain future Stage 4/5 work.

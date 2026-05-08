# Frontend Hook Extraction Suggestions

Date: 2026-05-08

Scope: current frontend state after auth, categories, and transactions, with Stage 4 budgets and Stage 5 WebSocket alerts still planned.

## Current Hook Usage

- `App.tsx` owns theme, route, auth bootstrap, and logout state.
- `CategoryManager.tsx` owns category loading, create, rename, delete, pending state, and errors.
- `TransactionManager.tsx` owns category loading for transaction forms, transaction loading, live filters, create/edit/delete form state, pending state, errors, and the filter request-id guard.
- `UserMenu.tsx` owns avatar fallback state.

This is workable today, but Stage 4 and Stage 5 will add budget summary loading, selected-month state, WebSocket connection lifecycle, subscription state, alert rendering, and likely transaction-triggered dashboard refreshes. Extracting hooks before that will keep component files mostly presentational.

## Recommended Hooks

### `useAuthSession`

Owns:

- current user;
- bootstrap loading;
- auth bootstrap error;
- logout action.

Source candidate:

- Extract from `App.tsx`.

Why:

- Stage 5 WebSocket alerts need to connect only after session bootstrap.
- Auth state is currently tied to route/render selection in `App`.

### `useAppRoute`

Owns:

- `window.location.pathname` synchronization;
- `popstate` listener;
- `navigateTo` helper;
- route constants for `/` and `/login`.

Source candidate:

- Extract from `App.tsx`.

Why:

- Keeps browser-routing side effects outside the component file.
- Keeps route constants centralized before more routes appear.

### `useThemePreference`

Owns:

- dark/light value;
- toggle/set function;
- later local storage or system preference sync if needed.

Source candidate:

- Extract from `App.tsx` and `ThemeButton.tsx` usage.

Why:

- Current `useState(true)` is enough now, but Stage 6 theme polish will likely need persistence and wider consistency checks.

### `useCategoryManager`

Owns:

- categories;
- create field value;
- edit/delete row state;
- loading/error/pending state;
- create, rename, delete, cancel/start actions.

Source candidate:

- Extract from `CategoryManager.tsx`.

Why:

- Satisfies the "functions outside component files" rule without pushing API calls into presentational rows/forms.
- Keeps current feature boundary from `packages/frontend/AGENTS.md`.

### `useTransactionManager`

Owns:

- categories used by transaction forms;
- transactions;
- filters and live filter action;
- create/edit/delete state;
- loading/error/pending state;
- `filterRequestId` guard.

Source candidate:

- Extract from `TransactionManager.tsx`.

Why:

- This is the highest-value extraction. It reduces the largest component file and preserves the already-important live-filter race guard.

Possible split if `useTransactionManager` becomes too large:

- `useTransactionFilters`
- `useTransactionForm`
- `useTransactionList`

Start with one hook unless the implementation gets hard to read.

### `useBudgetSummary`

Owns:

- selected month;
- budget summary loading/error/no-budget state;
- set/update budget action;
- refresh after transaction changes when Stage 4 is integrated.

Source candidate:

- New Stage 4 frontend code.

Why:

- `docs/implementation-plan.md` requires selected-month dashboard cards, budget set/edit UI, loading state, and no-budget state.

### `useBudgetAlerts`

Owns:

- WebSocket connection lifecycle;
- connection state;
- `budget_alerts.subscribe` send after auth/session is known;
- received alert list/toast state;
- reconnect/error handling.

Source candidate:

- New Stage 5 frontend code.

Why:

- WebSocket behavior is an external system and belongs behind an effect-owning hook.
- Keeps alert UI presentational.

### `useAvatarFallback`

Owns:

- avatar load error state;
- reset when `avatarUrl` changes;
- `shouldShowAvatar`.

Source candidate:

- Extract from `UserMenu.tsx`.

Why:

- Small but directly supports the "functions outside component files" cleanup.

## Recommended Order

1. Extract `useTransactionManager`.
2. Extract `useCategoryManager`.
3. Extract `useAuthSession` and `useAppRoute`.
4. Add `useBudgetSummary` during Stage 4.
5. Add `useBudgetAlerts` during Stage 5.
6. Extract `useThemePreference` and `useAvatarFallback` during Stage 6 polish or while enforcing the stricter component-file rules.


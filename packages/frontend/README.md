# Frontend Package

This package contains the Vite React UI for the personal expense tracker. The product roadmap and backend/API behavior are documented at the repository root; this file focuses on how the frontend is organized and where to make UI changes.

## Stack

- React + TypeScript + Vite.
- Tailwind utilities with theme tokens in `src/styles.css`.
- Vitest + React Testing Library for component and client behavior.
- API calls go through typed client modules, not raw `fetch` calls inside components.

## Commands

Run these from the repository root:

```bash
npm run dev:frontend
npm test --workspace @expense-tracker/frontend
npm run typecheck --workspace @expense-tracker/frontend
npm run build --workspace @expense-tracker/frontend
```

The frontend dev server is configured for `http://localhost:5173`. The backend API base URL comes from `VITE_API_BASE_URL` in `.env`.

## Source Layout

```text
src/
  App.tsx                         Auth bootstrap, route guard, login/home composition
  main.tsx                        React entrypoint
  styles.css                      Tailwind layers, theme tokens, mode transition animation
  auth/
    authClient.ts                 Auth API client and auth types
  categories/
    CategoryManager.tsx           Category CRUD state, loading, errors, persistence calls
    CategoryCreateForm.tsx        New category input and submit button
    CategoryRow.tsx               Category display, inline rename, inline delete confirmation
    categoryClient.ts             Category API client and category types
  components/
    DeleteConfirmationOverlay.tsx Shared inline destructive-action confirmation
    ThemeButton.tsx               Dark/light theme toggle button
  lib/
    apiClient.ts                  Shared HTTP client wrapper
    logger.ts                     Frontend logging wrapper
  test/
    setup.ts                      Vitest DOM setup
  transactions/
    TransactionManager.tsx        Transaction state, loading, filters, create/edit/delete calls
    TransactionFiltersForm.tsx    Search/category/date/amount filter controls
    TransactionForm.tsx           Reusable create/edit transaction fields and actions
    TransactionRow.tsx            Transaction display, inline edit, inline delete confirmation
    transactionClient.ts          Transaction API client and transaction types
    transactionFormState.ts       Form/filter state factories, validation, API mapping helpers
```

## UI Ownership

`App.tsx` should stay small. It owns authentication bootstrap, simple browser routing between `/` and `/login`, top-level theme state, and page composition. Feature-specific CRUD state should live in the feature manager component, such as `CategoryManager` or `TransactionManager`.

Category UI is split by responsibility:

- `CategoryManager` loads categories and coordinates create, rename, delete, pending state, and errors.
- `CategoryCreateForm` is only the create form.
- `CategoryRow` owns a single row's visual states: display, rename mode, and delete confirmation.

Transaction UI follows the same pattern:

- `TransactionManager` loads categories/transactions and coordinates filters, create, edit, delete, pending state, and errors.
- `TransactionFiltersForm` renders filter controls and reports field changes upward.
- `TransactionForm` is shared by create and inline edit modes.
- `TransactionRow` owns one transaction row, including summary, edit mode, and delete confirmation.
- `transactionFormState.ts` keeps non-visual form behavior out of components.

Shared components belong in `src/components` only when more than one feature uses them or the component is clearly cross-feature UI.

## Interaction Rules

- Destructive actions use inline confirmation through `DeleteConfirmationOverlay`.
- Category rename rows use `sm:items-end`; normal category rows use `sm:items-center`.
- Transaction edit rows use `md:grid-cols-1 md:items-end`; normal transaction rows use `md:grid-cols-[1fr_auto] md:items-center`.
- Preserve accessible labels and button names because the UI tests use them as behavior contracts.
- Keep loading, empty, error, hover, focus, and disabled states visible when changing form or row flows.

## Testing Notes

`src/App.test.tsx` covers the main shell and authenticated category/transaction flows. Client modules also have focused tests beside their implementation files.

Use a focused run while changing UI behavior:

```bash
npm test --workspace @expense-tracker/frontend -- --run src/App.test.tsx
```

Before handing off broader frontend changes, run:

```bash
npm test --workspace @expense-tracker/frontend
npm run typecheck --workspace @expense-tracker/frontend
npm run build --workspace @expense-tracker/frontend
```

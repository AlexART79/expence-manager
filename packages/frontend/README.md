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
    AuthErrorScreen.tsx           Session-check failure screen
    LoginPage.tsx                 Auth entry page and provider buttons
  categories/
    CategoryManager.tsx           Category CRUD state, loading, errors, persistence calls
    CategoryCreateForm.tsx        New category input and submit button
    CategoryRow.tsx               Category display, inline rename, inline delete confirmation
    categoryClient.ts             Category API client and category types
  components/
    AppHeader.tsx                 Authenticated page header
    DeleteConfirmationOverlay.tsx Shared inline destructive-action confirmation
    LoadingScreen.tsx             Full-page loading status
    ThemeButton.tsx               Dark/light theme toggle button
    UserMenu.tsx                  Current-user identity, avatar/initials fallback, logout action
  home/
    HomePage.tsx                  Authenticated dashboard composition
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

`App.tsx` should stay small. It owns authentication bootstrap, simple browser routing between `/` and `/login`, top-level theme state, and choosing which top-level screen to render. Page-level layout belongs in `LoginPage`, `AuthErrorScreen`, `LoadingScreen`, or `HomePage`. Feature-specific CRUD state should live in the feature manager component, such as `CategoryManager` or `TransactionManager`.

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

Authenticated shell UI:

- `AppHeader` renders the right-aligned theme control and current-user menu.
- `UserMenu` shows the user avatar when it loads successfully and falls back to initials when `avatarUrl` is missing or the image fails to load.
- Keep the user name, provider label, and logout action visible in the authenticated header.

## Interaction Rules

- Destructive actions use inline confirmation through `DeleteConfirmationOverlay`.
- User avatars must not leave a broken image icon visible; failed avatar loads fall back to initials with an accessible label.
- Category rename rows use `sm:items-end`; normal category rows use `sm:items-center`.
- Transaction edit rows use `md:grid-cols-1 md:items-end`; normal transaction rows use `md:grid-cols-[1fr_auto] md:items-center`.
- Preserve accessible labels and button names because the UI tests use them as behavior contracts.
- Keep loading, empty, error, hover, focus, and disabled states visible when changing form or row flows.

## Testing Notes

`src/App.test.tsx` covers the main shell, authenticated header identity, avatar fallback, and authenticated category/transaction flows. Client modules also have focused tests beside their implementation files.

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

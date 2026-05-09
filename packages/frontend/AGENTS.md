# Frontend Agent Guide

This file extends the repository-level `AGENTS.md` for work inside `packages/frontend`. Follow the root instructions first; use this file for frontend-specific structure and ownership.

## Package Scope

- Stack: React, Vite, TypeScript, Tailwind, Vitest, React Testing Library.
- Keep API access inside typed clients under `src/auth`, `src/categories`, `src/transactions`, or `src/lib`.
- Keep async feature state in focused React hooks next to the feature that owns it.
- Do not add Docker, CI, deployment, or infrastructure files from frontend work unless the user explicitly asks.

## React Structure Rules

- Prefer one exported React component per component file. Move sibling row, action, summary, field, and provider subcomponents into separate files in the same feature folder once they are more than a tiny local fragment.
- Keep component files mostly presentational: prop types, JSX, and event wiring. Move reusable helpers, formatting, sorting, parsing, route helpers, and display logic into non-component modules.
- Put async state, effects, request ordering, loading/error/pending state, and create/update/delete actions into focused hooks near the feature that owns them.
- Use hooks to wrap browser and external-system lifecycles, such as route synchronization, session bootstrap, theme persistence, avatar fallback, WebSocket connections, and dashboard data loading.
- Keep forms and rows API-agnostic. They should report user intent upward through typed props rather than call HTTP clients directly.
- Use named constants for routes, event names, validation limits, supported currencies, action keys, provider metadata, repeated labels, and user-facing messages. Keep one-off Tailwind class strings inline unless the class set is reused.
- Avoid mechanically extracting every small inline JSX callback before the larger state and component boundaries are clean. Prioritize hooks, helpers, and constants that reduce real component complexity.

## Current UI Boundaries

- `src/App.tsx`: top-level screen selection and composition.
- `src/app`: route constants and browser route helpers/hooks.
- `src/auth/LoginPage.tsx`: auth entry page and provider links.
- `src/auth/AuthErrorScreen.tsx`: session-check failure UI.
- `src/auth/useAuthSession.ts`: auth bootstrap, session error state, current user state, and logout behavior.
- `src/home/HomePage.tsx`: authenticated dashboard composition.
- `src/categories/CategoryManager.tsx`: category management composition.
- `src/categories/useCategoryManager.ts`: category loading, create, rename, delete, pending state, and errors.
- `src/categories/CategoryCreateForm.tsx`: category create controls only.
- `src/categories/CategoryRow.tsx`: single category row display, inline rename, inline delete confirmation.
- `src/transactions/TransactionManager.tsx`: transaction management composition.
- `src/transactions/useTransactionManager.ts`: transaction loading, filters, create, edit, delete, pending state, errors, and live-filter request ordering.
- `src/transactions/TransactionFiltersForm.tsx`: transaction filter controls only.
- `src/transactions/TransactionForm.tsx`: reusable create/edit transaction fields and actions.
- `src/transactions/TransactionRow.tsx`: single transaction row display, inline edit, inline delete confirmation.
- `src/transactions/transactionFormState.ts`: transaction form/filter factories, validation, API input mapping, and sorting.
- `src/transactions/transactionConstants.ts`: transaction labels, validation limits, supported currency, messages, and pending action keys.
- `src/components`: cross-feature UI and shell primitives, such as theme, loading, header, user menu, and delete confirmation.
- `src/components/UserMenu.tsx`: current-user identity, avatar image handling, initials fallback, and logout action.

## Change Placement

- Put new category UI in `src/categories` unless it is truly shared.
- Put new transaction UI in `src/transactions` unless it is truly shared.
- Put auth-only screens in `src/auth` and authenticated page composition in `src/home`.
- Put shared visual primitives in `src/components` only after at least two features need them or the abstraction is obvious.
- Put raw HTTP details in client modules, not inside React components.
- Keep non-visual form helpers in a separate module when they are reused by create/edit flows or are worth testing directly.
- Use one exported React component per component file for feature UI. Put sibling row/action/summary/form subcomponents in separate files in the same feature folder.
- Put feature constants in `*Constants.ts` modules for routes, messages, validation limits, supported currencies, action keys, provider metadata, and shared labels. Keep one-off Tailwind class strings inline unless the class set is reused.

## Interaction Contracts

- Keep destructive actions explicit and inline. Use `DeleteConfirmationOverlay` for category and transaction delete flows.
- Do not replace inline delete confirmation with a modal without a user request.
- Preserve the current accessible labels and button names unless intentionally updating tests and UX copy together.
- Preserve the authenticated header identity pattern: show an avatar when it loads, fall back to initials when `avatarUrl` is missing or the image errors, keep the user name/provider label, and keep logout aligned with the user menu.
- Preserve layout classes protected by tests:
  - Category edit rows: `sm:items-end`.
  - Category normal rows: `sm:items-center`.
  - Transaction edit rows: `md:grid-cols-1 md:items-end`.
  - Transaction normal rows: `md:grid-cols-[1fr_auto] md:items-center`.
- Keep `mode-transition` on rows and edit/display regions unless replacing the interaction animation deliberately.

## State And Data Flow

- `App` injects `authClient`, `categoryClient`, and `transactionClient` for tests.
- Feature managers call feature hooks and pass values/callbacks down to forms, rows, and lists.
- Feature hooks call typed clients and own effects, async requests, pending/error state, and action handlers.
- Forms and rows should stay mostly presentational. They may report events upward, but should not call API clients directly.
- Keep backend validation authoritative. Client validation is for fast feedback and should match the API shape where practical.
- Preserve transaction live-filter request ordering by keeping the request-id guard in `useTransactionManager` or an equivalent hook if it is split later.

## Testing And Verification

For UI behavior changes, prefer a focused test run first:

```bash
npm test --workspace @expense-tracker/frontend -- --run src/App.test.tsx
```

For client/helper changes, run the matching `*.test.ts` file.

Before reporting frontend work complete, run:

```bash
npm test --workspace @expense-tracker/frontend
npm run typecheck --workspace @expense-tracker/frontend
npm run build --workspace @expense-tracker/frontend
```

If Vitest fails in this Windows/sandbox environment with a setup-file path or worker spawn issue, rerun the same command with the appropriate execution permission before diagnosing product code.

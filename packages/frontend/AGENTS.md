# Frontend Agent Guide

This file extends the repository-level `AGENTS.md` for work inside `packages/frontend`. Follow the root instructions first; use this file for frontend-specific structure and ownership.

## Package Scope

- Stack: React, Vite, TypeScript, Tailwind, Vitest, React Testing Library.
- Keep API access inside typed clients under `src/auth`, `src/categories`, `src/transactions`, or `src/lib`.
- Keep UI state close to the feature manager that owns it.
- Do not add Docker, CI, deployment, or infrastructure files from frontend work unless the user explicitly asks.

## Current UI Boundaries

- `src/App.tsx`: auth bootstrap, browser route guard, theme state, login/home composition.
- `src/categories/CategoryManager.tsx`: category loading, create, rename, delete, pending state, and errors.
- `src/categories/CategoryCreateForm.tsx`: category create controls only.
- `src/categories/CategoryRow.tsx`: single category row display, inline rename, inline delete confirmation.
- `src/transactions/TransactionManager.tsx`: transaction loading, filters, create, edit, delete, pending state, and errors.
- `src/transactions/TransactionFiltersForm.tsx`: transaction filter controls only.
- `src/transactions/TransactionForm.tsx`: reusable create/edit transaction fields and actions.
- `src/transactions/TransactionRow.tsx`: single transaction row display, inline edit, inline delete confirmation.
- `src/transactions/transactionFormState.ts`: transaction form/filter factories, validation, API input mapping, and sorting.
- `src/components`: cross-feature UI only, such as theme and delete confirmation.

## Change Placement

- Put new category UI in `src/categories` unless it is truly shared.
- Put new transaction UI in `src/transactions` unless it is truly shared.
- Put shared visual primitives in `src/components` only after at least two features need them or the abstraction is obvious.
- Put raw HTTP details in client modules, not inside React components.
- Keep non-visual form helpers in a separate module when they are reused by create/edit flows or are worth testing directly.

## Interaction Contracts

- Keep destructive actions explicit and inline. Use `DeleteConfirmationOverlay` for category and transaction delete flows.
- Do not replace inline delete confirmation with a modal without a user request.
- Preserve the current accessible labels and button names unless intentionally updating tests and UX copy together.
- Preserve layout classes protected by tests:
  - Category edit rows: `sm:items-end`.
  - Category normal rows: `sm:items-center`.
  - Transaction edit rows: `md:grid-cols-1 md:items-end`.
  - Transaction normal rows: `md:grid-cols-[1fr_auto] md:items-center`.
- Keep `mode-transition` on rows and edit/display regions unless replacing the interaction animation deliberately.

## State And Data Flow

- `App` injects `authClient`, `categoryClient`, and `transactionClient` for tests.
- Feature managers call clients and pass values/callbacks down to forms and rows.
- Forms and rows should stay mostly presentational. They may report events upward, but should not call API clients directly.
- Keep backend validation authoritative. Client validation is for fast feedback and should match the API shape where practical.

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

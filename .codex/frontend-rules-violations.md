# Frontend Rules Audit

Date: 2026-05-08

Scope: `packages/frontend/src/**/*.tsx`, excluding test files unless noted.

Audit rules requested:

- One component per file.
- Component files should contain only prop types and the exported component; helper functions should live in separate files.
- Code should use named constants instead of inline literals.

Note: these rules are stricter than the current `packages/frontend/AGENTS.md`, which allows feature managers to own local UI state and currently documents several files as combined state/rendering boundaries.

## Summary

The frontend does not currently satisfy the stricter rules. The largest violations are in transaction and category UI files, where local helper components, local action handlers, formatting helpers, and inline UI literals are colocated with the exported component.

The safest planning path is to split structural violations first, then extract constants, then extract hooks/state logic. Doing constants first would create churn across files that are likely to move anyway.

## Rule 1: One Component Per File

Violations:

- `packages/frontend/src/auth/LoginPage.tsx`
  - Exports `LoginPage`, but also defines `ProviderButton` in the same file at line 37.
  - Suggested split: move `ProviderButton` to `src/auth/ProviderButton.tsx`.

- `packages/frontend/src/transactions/TransactionForm.tsx`
  - Exports `TransactionForm`, but also defines `TransactionFormFields` at line 40 and `TransactionFormActions` at line 121.
  - Suggested split: move these to `TransactionFormFields.tsx` and `TransactionFormActions.tsx`.

- `packages/frontend/src/categories/CategoryRow.tsx`
  - Exports `CategoryRow`, but also defines `CategoryRenameActions` at line 75 and `CategoryRowActions` at line 105.
  - Suggested split: move these to `CategoryRenameActions.tsx` and `CategoryRowActions.tsx`.

- `packages/frontend/src/transactions/TransactionManager.tsx`
  - Exports `TransactionManager`, but also defines `TransactionList` at line 246.
  - Suggested split: move `TransactionList` to `TransactionList.tsx`.

- `packages/frontend/src/transactions/TransactionRow.tsx`
  - Exports `TransactionRow`, but also defines `TransactionSummary` at line 84 and `TransactionRowActions` at line 100.
  - Suggested split: move these to `TransactionSummary.tsx` and `TransactionRowActions.tsx`.

## Rule 2: No Helper Functions In Component Files

Violations:

- `packages/frontend/src/App.tsx`
  - `handleLogout` at line 83.
  - `getRouteFromLocation` at line 116.
  - `navigateTo` at line 120.
  - Suggested split: move route helpers to `src/app/appRouting.ts`; move auth/session behavior into a `useAuthSession` hook when hooks refactor begins.

- `packages/frontend/src/categories/CategoryManager.tsx`
  - Local action helpers: `handleCreate`, `handleRename`, `handleDelete`, `startRename`, `cancelRename`.
  - Local sort helper: `sortCategories` at line 172.
  - Suggested split: move state/action logic to `useCategoryManager.ts`; move sorting/constants to `categoryUiState.ts` or `categorySorting.ts`.

- `packages/frontend/src/transactions/TransactionManager.tsx`
  - Local async/action helpers: `runTransactionFilters`, `updateFilters`, `updateFilter`, `clearFilters`, `handleSaveTransaction`, `handleDeleteTransaction`, `startCreate`, `startEdit`, `cancelCreate`, `cancelEdit`.
  - Suggested split: move state/action logic to `useTransactionManager.ts`, preserving the current request-id guard for live filters.

- `packages/frontend/src/transactions/TransactionRow.tsx`
  - `categoryNameFor` at line 131.
  - `formatCurrency` at line 135.
  - Suggested split: move display helpers to `transactionDisplay.ts`.

- `packages/frontend/src/components/UserMenu.tsx`
  - `getInitials` at line 50.
  - Suggested split: move to `userDisplay.ts`; optionally extract avatar fallback behavior to `useAvatarFallback.ts`.

- Inline callback functions are also widespread if the rule is interpreted strictly:
  - `onClick={() => ...}` in `ThemeButton.tsx`.
  - `onChange={(event) => ...}` in forms and filters.
  - `onStartEdit={() => ...}`, `onAskDelete={() => ...}`, and similar row callbacks in managers.
  - Suggested approach: do not mechanically extract every tiny JSX callback first. Start with feature manager hooks, then revisit inline callbacks only where the rule needs literal enforcement.

## Rule 3: Use Constants Instead Of Literals

High-priority logic literals:

- `packages/frontend/src/App.tsx`
  - Route literals: `"/"`, `"/login"`.
  - Browser event literal: `"popstate"`.
  - History method literals: `"replaceState"`, `"pushState"`.
  - Error text: `"Session check failed"`.
  - Theme class fragment: `"dark "`.
  - Suggested split: `appRoutes.ts`, `appMessages.ts`, and maybe `themeConstants.ts`.

- `packages/frontend/src/categories/CategoryManager.tsx`
  - Error messages: `"Category name is required"`, `"Failed to load categories"`, `"Could not create category"`, `"Could not rename category"`, `"Could not delete category"`.
  - Pending action keys and prefixes: `"create"`, ``rename-${categoryId}``, ``delete-${category.id}``.
  - UI text: `"Spending structure"`, `"Categories"`, `"No categories yet"`, `"Add the first one to organize future transactions."`.
  - Suggested split: `categoryConstants.ts`.

- `packages/frontend/src/transactions/TransactionManager.tsx`
  - Error messages: `"Failed to load transactions"`, `"Could not filter transactions"`, `"Could not save transaction"`, `"Could not delete transaction"`.
  - Pending action keys and prefixes: `"filter"`, `"create-transaction"`, ``update-${id}``, ``delete-transaction-${id}``.
  - Form labels and button text: `"Transaction title"`, `"Amount"`, `"Transaction date"`, `"Category"`, `"Notes"`, `"Save transaction"`.
  - Empty/loading text: `"Loading transactions"`, `"No transactions match"`, `"No transactions yet"`.
  - Suggested split: `transactionConstants.ts`.

- `packages/frontend/src/transactions/transactionFormState.ts`
  - Validation messages and numeric/text constraints: title required, amount regex, positive amount, date/category required, `"USD"`, `500`.
  - Suggested split: `transactionConstants.ts` for field limits/currency/messages, while keeping pure state mappers in `transactionFormState.ts`.

- `packages/frontend/src/auth/LoginPage.tsx`
  - Provider ids and labels: `"google"`, `"github"`, `"Continue with Google"`, `"Continue with GitHub"`, `"Google"`, `"GitHub"`, `"G"`, `"GH"`.
  - Marketing/auth copy: `"Secure workspace"`, `"Sign in to Expense Tracker"`, supporting sentence.
  - Suggested split: `authUiConstants.ts`.

- `packages/frontend/src/components/UserMenu.tsx`
  - Referrer policy `"no-referrer"`, button text `"Log out"`.
  - Suggested split: `userMenuConstants.ts` or shared `componentConstants.ts`.

Broad UI literals:

- Nearly every component contains inline Tailwind `className` strings.
- If the constants rule includes style literals, the strict solution is to move recurring class strings into per-component `*.constants.ts` files or shared UI class constants. This will be noisy and should be planned after component splitting.
- Numeric UI limits such as `maxLength={60}`, `maxLength={120}`, and `maxLength={500}` should become named constants before more forms are added.

## Suggested Refactor Order

1. Split extra component definitions into one component per file without changing behavior.
2. Move pure display helpers and route helpers into non-component modules.
3. Extract high-priority constants for routes, pending action keys, validation messages, field limits, provider labels, and currency.
4. Extract `useCategoryManager` and `useTransactionManager` hooks to remove action functions from component files.
5. Decide whether inline Tailwind classes count as literal violations before doing a large class-constant pass.


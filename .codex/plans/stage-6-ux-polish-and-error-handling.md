# Stage 6: UX Polish And Error Handling Implementation Plan

## Summary

Finish Stage 6 as a frontend-focused hardening pass: make the existing authenticated app feel consistent across light/dark themes, replace repeated ad hoc UI state styling with small shared primitives, improve frontend error handling, add field-level validation feedback, and verify responsive behavior across auth, dashboard, categories, transactions, budgets, and budget alerts.

This is not a redesign. Preserve the current dark default, routed `/login` flow, inline edit/delete patterns, budget expand/collapse behavior, and lightweight motion.

## Key Changes

- Add small shared UI primitives in `packages/frontend/src/components`:
  - `Button` with `primary`, `secondary`, `danger`, and `ghostIcon` variants.
  - `Field` / `FieldMessage` for labels, inputs/selects/textareas, `aria-invalid`, helper/error text, and shared focus styling.
  - `InlineAlert` for API and session errors.
  - `SectionState` for loading, empty, and no-results states.
- Harden frontend API error handling in `packages/frontend/src/lib/apiClient.ts`:
  - Safely handle non-JSON and empty error responses.
  - Throw a typed `ApiError` with `status`, optional backend `code`, and user-facing `message`.
  - Keep existing clients compatible by preserving `error.message`.
- Improve validation feedback:
  - Categories: blank create/rename errors appear next to the affected input.
  - Transactions: title, amount, date, category, currency, and notes validation appear field-level in create and inline edit forms.
  - Budgets: invalid/blank amount appears under the budget amount input.
  - API failures remain section-level `InlineAlert`s.
- Polish app states and layout:
  - Use consistent loading/empty/error UI for categories, transactions, budget summary, auth bootstrap failure, and app loading.
  - Keep no categories, no transactions, no search results, and no budget set states visually distinct and testable.
  - Keep delete confirmations as inline overlays using the current no-layout-shift pattern.
  - Ensure all controls have visible hover/focus/disabled states in light and dark themes.

## Public Interfaces / Types

- Export `ApiError` from `src/lib/apiClient.ts`.
- Add reusable component props:
  - `ButtonProps`: `variant`, `size`, `isLoading`, `disabled`, native button props.
  - `FieldProps`: `label`, `error`, `description`, `children`, `id`.
  - `InlineAlertProps`: `tone: "error" | "warning" | "info" | "success"`, `children`.
  - `SectionStateProps`: `state: "loading" | "empty" | "error"`, `title`, optional `description`.
- Update form helper return values so validation can identify fields:
  - `validateTransactionForm(...)` returns `{ field, message } | null`.
  - `validateBudgetForm(...)` returns `{ field: "amount", message } | null`.
  - Category validation can stay local but must map blank name errors to the create/rename input.

## Test Plan

- Frontend targeted tests:
  - `npm test --workspace @expense-tracker/frontend -- --run src/lib/apiClient.test.ts`
  - `npm test --workspace @expense-tracker/frontend -- --run src/App.test.tsx`
  - Add/update assertions for typed API errors, non-JSON failures, field-level validation messages, `aria-invalid`, loading states, empty states, no-results state, budget no-budget state, and inline delete overlays.
- Full frontend verification:
  - `npm test --workspace @expense-tracker/frontend`
  - `npm run typecheck --workspace @expense-tracker/frontend`
  - `npm run build --workspace @expense-tracker/frontend`
- Responsive/browser verification:
  - Run the app locally and inspect `/login` and authenticated `/` at approximately `375px`, `768px`, and desktop width.
  - Check that the header, budget panel, category panel, transaction filters/list/edit row, alert banners, and auth screen have no overlapping text, clipped controls, or blocked workflows.
  - If browser automation is unavailable, record a manual smoke checklist result in the implementation notes.

## Assumptions

- Stage 6 is frontend-only unless an existing backend error shape is discovered to be incompatible.
- No Docker, CI, deployment, or shared package extraction in this stage.
- Keep current user-facing destructive confirmation wording.
- Keep existing `mode-transition` / `mode-fade-slide` motion and `prefers-reduced-motion` behavior.
- Keep the current color-token system and refine it; do not introduce a new visual theme.

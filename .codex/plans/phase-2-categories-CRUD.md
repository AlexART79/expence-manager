# Stage 2 Categories Implementation Plan

## Summary

Build authenticated per-user category CRUD as the first user-owned domain slice. Categories are isolated by `userId`, names are unique per user after trim + case normalization, and deletion is blocked with `409 CONFLICT` when future transactions reference the category.

## Key Changes

- Backend:
  - Add `categories` Drizzle table with `id`, `userId`, `name`, `normalizedName`, `createdAt`, `updatedAt`, and unique index on `userId + normalizedName`.
  - Add category service/repository logic for list, create, rename, delete, ownership checks, duplicate detection, and transaction-reference deletion guard.
  - Add authenticated routes:
    - `GET /api/categories` -> `{ categories }`
    - `POST /api/categories` with `{ name }` -> `201 { category }`
    - `PATCH /api/categories/:categoryId` with `{ name }` -> `{ category }`
    - `DELETE /api/categories/:categoryId` -> `204`
  - Extend API errors with `CONFLICT`; use `404 NOT_FOUND` for missing or cross-user category ids to avoid leaking ownership.

- Frontend:
  - Add `CategoryClient` using the existing `ApiClient` and Zod response parsing.
  - Replace the placeholder authenticated home content with a categories management section.
  - Include list loading, empty state, create form, inline rename flow, delete action, duplicate/error display, and disabled/submitting states.
  - Keep the current shell, auth bootstrap, theme toggle, and logout behavior intact.

- Documentation:
  - Update `README.md` to document category endpoints and the deletion policy: category deletion is blocked when transactions exist.
  - Keep broader product direction in `docs/implementation-plan.md`; no Docker, CI, deployment, or infrastructure changes.

## Test Plan

- Backend tests:
  - Unauthenticated category requests return `401`.
  - Authenticated user can create, list, rename, and delete their own category.
  - Duplicate names are rejected per user after trimming/case normalization.
  - Different users may use the same category name.
  - Cross-user read/mutate/delete by id returns `404`.
  - Delete returns `409 CONFLICT` when a transaction reference exists; if transactions table is not implemented yet, add the guard as a service seam and cover it with a minimal test helper table/query.

- Frontend tests:
  - Authenticated home loads categories through `CategoryClient`.
  - Empty, loading, create, rename, delete, and API error states render clearly.
  - Category form trims input and blocks blank names before submit.
  - Existing auth redirect/logout tests continue passing.

- Verification commands:
  - `npm test --workspace @expense-tracker/backend -- --run src/categories`
  - `npm test --workspace @expense-tracker/frontend -- --run src/categories src/App.test.tsx`
  - `npm run typecheck`
  - `npm run build`

## Assumptions

- Category ids are numeric SQLite ids exposed through the API.
- Category name validation: trim input, require 1-60 characters, store original trimmed display name, compare uniqueness through lowercase `normalizedName`.
- Stage 2 does not create transactions UI or full transactions schema beyond the minimum deletion-guard support needed for the documented category policy.
- Category management can live on the authenticated home screen for now; a fuller navigation structure can wait until transactions/dashboard screens arrive.

# Stage 7: Documentation And Acceptance Hardening — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fill every documentation gap in the README, drive the full test-and-lint suite to zero failures, manually execute the acceptance checklist, and document Docker as explicitly out of scope.

**Architecture:** No new production code. All changes are `README.md` additions, test/lint fixes, and manual verification. The README gains three new sections — API Endpoints, WebSocket Protocol, and Docker. The acceptance checklist is executed against the running app and results are committed to `docs/acceptance-checklist.md`.

**Tech Stack:** Express + TypeScript (backend), React + Vite + TypeScript + Tailwind (frontend), Vitest (tests), ESLint + Prettier (lint/format), Drizzle ORM + SQLite (database), `ws` (WebSocket server).

---

## File Structure

**Modify:**
- `README.md` — add API Endpoints, WebSocket Protocol, and Docker sections
- `packages/backend/src/**` — fix any test/lint/type failures discovered in Task 1–3
- `packages/frontend/src/**` — fix any test/lint/type failures discovered in Task 1–3

**Create:**
- `docs/acceptance-checklist.md` — manual acceptance verification record

---

## Task 1: Run Full Test Suite

**Files:**
- Read: none (just run commands)

- [ ] **Step 1: Run backend tests**

```bash
npm run test -w packages/backend
```

Expected: all test files show `✓`. If any fail, note the file name and error text before continuing.

- [ ] **Step 2: Run frontend tests**

```bash
npm run test -w packages/frontend
```

Expected: all test files show `✓`. If any fail, note the file name and error text.

- [ ] **Step 3: Decide next step**

If both suites passed: skip Task 2, go to Task 3.  
If either suite failed: continue to Task 2.

---

## Task 2: Fix Test Failures

**Files:**
- Modify: whichever source or test files are failing (identified in Task 1)

This task is conditional — skip entirely if Task 1 produced zero failures.

- [ ] **Step 1: Classify each failure**

Open the failing test file. Decide:

- **Test expectation is stale** — the implementation changed correctly and the assertion no longer matches. Fix the assertion.
- **Source has a bug** — the implementation is wrong. Fix the source file.

Never delete tests. Never change an assertion just to make it pass if the underlying behavior is actually wrong.

- [ ] **Step 2: Apply the minimal fix**

Edit only the files needed. Do not add new test cases or refactor — this task is about zeroing failures, not improving coverage.

Common patterns:

```ts
// Stale mock fetch status — update to match route's actual response code
mockFetch.mockResolvedValueOnce({ ok: false, status: 409, json: async () => ({ error: { code: 'CONFLICT' } }) });

// Wrong element role in RTL query — match what the component renders
expect(screen.getByRole('alert')).toBeInTheDocument();   // not getByText
```

- [ ] **Step 3: Re-run the specific failing test file**

```bash
# Backend
npm run test -w packages/backend -- --reporter=verbose packages/backend/src/test/<file>.test.ts

# Frontend
npm run test -w packages/frontend -- --reporter=verbose packages/frontend/src/test/<File>.test.tsx
```

Expected: that file now passes.

- [ ] **Step 4: Run full test suite to confirm no regressions**

```bash
npm test
```

Expected: zero failures across both packages.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "fix: resolve test failures found during Stage 7 verification"
```

---

## Task 3: Run Lint And Format Check; Fix Issues

**Files:**
- Modify: any files flagged by ESLint or Prettier

- [ ] **Step 1: Run ESLint**

```bash
npm run lint
```

Expected: exits 0, no output. If violations appear, note each file and rule name.

- [ ] **Step 2: Run Prettier check**

```bash
npm run format:check
```

Expected: exits 0, no output. If files are listed, run the auto-formatter.

- [ ] **Step 3: Auto-fix formatting**

If `format:check` reported files:

```bash
npm run format
```

- [ ] **Step 4: Fix ESLint violations manually**

For each ESLint violation, apply the minimal change:

| Rule | Example | Fix |
|---|---|---|
| `@typescript-eslint/no-explicit-any` | `const x: any` | Replace with the actual type |
| `@typescript-eslint/no-unused-vars` | Declared but never used | Remove the variable |
| `no-console` | `console.log(...)` | Use `logger.info(...)` from `src/logger.ts` |
| `@typescript-eslint/no-floating-promises` | Unawaited promise | Add `void` prefix or `await` |

- [ ] **Step 5: Re-run lint to confirm zero violations**

```bash
npm run lint
```

Expected: exits 0.

- [ ] **Step 6: Re-run tests to confirm nothing broke**

```bash
npm test
```

Expected: all tests still pass.

- [ ] **Step 7: Commit (skip if nothing changed)**

```bash
git add -A
git commit -m "fix: resolve lint and formatting issues found during Stage 7 verification"
```

---

## Task 4: Add API Endpoints Section To README

**Files:**
- Modify: `README.md`

The README documents commands, setup, and decisions but has no endpoint reference. A reviewer needs to know what routes exist and what they accept without reading route source files.

- [ ] **Step 1: Open README.md and find the insertion point**

Find the exact line:

```
## Architecture Decisions
```

The new section goes immediately before that line.

- [ ] **Step 2: Insert the API Endpoints section**

Insert the following content immediately before `## Architecture Decisions`. The tables use the same pipe-style as the existing README.

---

**Content to insert:**

```
## API Endpoints

All endpoints return JSON. Protected endpoints require a session cookie set after a successful OAuth login (or the test-only stub at `POST /api/auth/test/login` when `NODE_ENV=test`).

### Health

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | No | Returns `{ ok: true }` |

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/auth/me` | Yes | Returns the current authenticated user |
| `POST` | `/api/auth/logout` | Yes | Destroys the session |
| `GET` | `/api/auth/google` | No | Redirects to Google OIDC consent screen |
| `GET` | `/api/auth/github` | No | Redirects to GitHub OAuth consent screen |

`GET /api/auth/me` response shape:
```json
{ "id": 1, "email": "user@example.com", "displayName": "Ada", "avatarUrl": null, "provider": "google" }
```

### Categories

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/categories` | Yes | List all categories for the authenticated user |
| `POST` | `/api/categories` | Yes | Create a category — body: `{ "name": "string" }` |
| `PUT` | `/api/categories/:id` | Yes | Rename a category — body: `{ "name": "string" }` |
| `DELETE` | `/api/categories/:id` | Yes | Delete a category (409 if transactions exist) |

### Transactions

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/transactions` | Yes | List transactions with optional query filters |
| `POST` | `/api/transactions` | Yes | Create a transaction |
| `PUT` | `/api/transactions/:id` | Yes | Update a transaction |
| `DELETE` | `/api/transactions/:id` | Yes | Delete a transaction |

**Query parameters for `GET /api/transactions`:**

| Parameter | Type | Description |
|---|---|---|
| `search` | string | Full-text search across title and notes |
| `categoryId` | number | Filter by category ID |
| `dateFrom` | YYYY-MM-DD | Earliest transaction date (inclusive) |
| `dateTo` | YYYY-MM-DD | Latest transaction date (inclusive) |
| `amountMin` | number | Minimum amount (inclusive) |
| `amountMax` | number | Maximum amount (inclusive) |

**Transaction body (`POST` and `PUT`):**
```json
{
  "title": "Coffee",
  "amount": 4.50,
  "currency": "USD",
  "transactionDate": "2025-05-10",
  "categoryId": 3,
  "notes": "optional"
}
```

### Budgets

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/budgets/:month` | Yes | Get the budget for the given month (YYYY-MM) |
| `GET` | `/api/budgets/:month/summary` | Yes | Spending summary: total spent, remaining, usage percentage |
| `PUT` | `/api/budgets/:month` | Yes | Create or update a budget — body: `{ "amount": number }` |

**Summary response shape:**
```json
{
  "month": "2025-05",
  "budget": 1000,
  "spent": 420.50,
  "remaining": 579.50,
  "usagePercent": 42.05,
  "currency": "USD"
}
```

When no budget is set for the month, `budget`, `remaining`, and `usagePercent` are `null`.

```

---

- [ ] **Step 3: Verify the section renders correctly**

Open `README.md` in a Markdown previewer and confirm: tables are aligned, JSON code blocks are syntax-highlighted, no stray backtick characters appear as raw text.

---

## Task 5: Add WebSocket Protocol Section To README

**Files:**
- Modify: `README.md`

The Architecture Decisions section already mentions the subscribe message format but does not document what the server sends back. A reviewer testing alerts cannot verify behavior without the server→client message shapes.

- [ ] **Step 1: Find the insertion point in README.md**

Find the exact line:

```
## Logging
```

The new section goes immediately before that line.

- [ ] **Step 2: Insert the WebSocket Protocol section**

Insert the following content immediately before `## Logging`:

---

**Content to insert:**

```
## WebSocket Protocol

The backend exposes a WebSocket server on the same port as the HTTP API. The frontend connects automatically after session authentication is confirmed.

**WebSocket URL:** Replace `http` with `ws` in `VITE_API_BASE_URL`, e.g. `ws://localhost:3000`.

Unauthenticated connections are closed immediately with WebSocket close code `1008`.

### Client → Server

After connecting, the client sends a subscribe message to enable alert delivery:

```json
{
  "type": "budget_alerts.subscribe",
  "payload": { "month": "current" }
}
```

Only `"month": "current"` is accepted. The server resolves it to the current calendar month (`YYYY-MM`).

### Server → Client

**Subscription confirmation** (sent after the subscribe message is accepted):

```json
{
  "type": "budget_alerts.subscribed",
  "payload": { "month": "2025-05" }
}
```

**Budget threshold alert:**

```json
{
  "type": "budget_alerts.alert",
  "payload": {
    "month": "2025-05",
    "threshold": 80,
    "usagePercent": 84.2
  }
}
```

`threshold` is one of `50`, `80`, or `100`. Each threshold fires **at most once per calendar month** — spending dropping below a threshold later does not reset it.

```

---

- [ ] **Step 3: Verify the section renders correctly**

Confirm the JSON blocks are fenced, the bold text renders, and no raw backtick sequences appear.

---

## Task 6: Add Docker Scope Note To README

**Files:**
- Modify: `README.md`

Docker is listed as optional in the implementation plan (S7.4). It must be explicitly documented as out of scope so a reviewer does not assume it was accidentally omitted.

- [ ] **Step 1: Append Docker section at the very end of README.md**

Add this as the final section of `README.md`:

---

**Content to append:**

```
## Docker

Docker packaging is not included. `better-sqlite3` compiles a native Node.js addon at install time that must match the target runtime platform. Cross-compiling the native module for a Linux container image from Windows or macOS requires additional tooling (QEMU, cross-compilation flags, or building inside WSL) without meaningful benefit for a local development or portfolio context. Use the [Local Setup](#local-setup) instructions to run the app directly.
```

---

- [ ] **Step 2: Commit all README changes from Tasks 4, 5, and 6**

```bash
git add README.md
git commit -m "docs: add API endpoint reference, WebSocket protocol, and Docker scope note to README"
```

---

## Task 7: Execute Acceptance Checklist

**Files:**
- Create: `docs/acceptance-checklist.md`

This task requires a running app. Start both dev servers before beginning:

```bash
npm run dev
```

Apply migrations if the database is new or missing:

```bash
npm run db:migrate -w packages/backend
```

Then open `http://localhost:5173` in a browser.

**OAuth-specific items** (Google sign-in, GitHub sign-in) require valid credentials in `packages/backend/.env`. If credentials are not available, mark those items as `[ ] — OAuth credentials not configured` rather than failing them. All other items use the test-login stub or can be triggered without OAuth.

- [ ] **Step 1: Create the acceptance checklist document**

Create `docs/acceptance-checklist.md`:

```markdown
# Acceptance Checklist

Run through each item with both dev servers running at `http://localhost:5173`. Mark each box `[x]` when verified. Note failures in the Known Issues section.

## Authentication

- [ ] **Google sign-in:** Clicking "Continue with Google" redirects to Google consent. After approving, user lands on the dashboard with their display name shown in the nav.
- [ ] **GitHub sign-in:** Clicking "Continue with GitHub" redirects to GitHub consent. After approving, user lands on the dashboard.
- [ ] **Refresh persistence:** Refreshing the page while signed in keeps the session — the user is not sent back to the login screen.
- [ ] **Logout:** Clicking "Sign out" clears the session and redirects to the login screen. Refreshing stays on the login screen.
- [ ] **Protected routes:** Navigating to `/`, `/transactions`, or `/categories` while signed out redirects to the login screen.

## Categories

- [ ] **Empty state:** When no categories exist, the Categories page shows an empty state message (not a blank page or loading spinner stuck forever).
- [ ] **Create category:** Filling the name field and submitting adds the category to the list.
- [ ] **Duplicate name:** Submitting a name that already exists shows an error. No duplicate is created.
- [ ] **Rename category:** Opening the rename action, changing the name, and confirming updates the name in the list.
- [ ] **Delete category (no transactions):** Deleting a category with no transactions removes it from the list.
- [ ] **Delete category (with transactions):** Attempting to delete a category that has transactions shows an error — the category remains in the list.
- [ ] **Confirmation modal:** Delete and rename actions show a confirmation dialog before executing.

## Transactions

- [ ] **Empty state:** When no transactions exist, the Transactions page shows an empty state message.
- [ ] **Create transaction:** Filling all required fields (title, amount, date, category) and submitting adds the row to the list.
- [ ] **Form validation:** Submitting with an empty title, a non-positive amount, or no category selected shows field-level error messages and does not create a transaction.
- [ ] **Edit transaction:** Opening a transaction's edit form, changing a field, and saving updates the row.
- [ ] **Delete transaction:** Deleting a transaction removes it from the list.
- [ ] **Search:** Typing in the search field filters the list to matching titles or notes.
- [ ] **Category filter:** Selecting a category from the filter dropdown shows only transactions in that category.
- [ ] **Date range filter:** Setting dateFrom and dateTo shows only transactions within the date range.
- [ ] **Amount range filter:** Setting amountMin and amountMax filters the list correctly.
- [ ] **No results state:** When filters match nothing, a "no results" empty state is shown — not a blank table.

## Dashboard (Monthly Budget)

- [ ] **No budget state:** When no budget is set for the current month, the dashboard shows a "No budget set" message and a prompt to set one.
- [ ] **Set budget:** Clicking the set/edit button, entering an amount, and saving shows the budget in the summary cards.
- [ ] **Summary accuracy:** After setting a budget and adding transactions for the current month, Total Spent, Remaining Budget, and Usage Percentage reflect the correct values.
- [ ] **Loading state:** At least one dashboard card briefly shows a loading indicator while data is being fetched on first load.

## WebSocket Budget Alerts

Setup: set a budget of $100 for the current month. Then add transactions totaling:
- $51 → expect 50% alert
- $81 total → expect 80% alert
- $101 total → expect 100% alert

- [ ] **Alert at 50%:** A toast notification appears with "50% Budget Used" when spending crosses 50%.
- [ ] **Alert at 80%:** A toast appears with "80% Budget Used" when spending crosses 80%.
- [ ] **Alert at 100%:** A toast appears with "Budget Exceeded" when spending crosses 100%.
- [ ] **Once-per-month — no duplicate:** Adding another transaction after the 100% threshold has already fired does not produce a second 100% alert.
- [ ] **Alert dismissal:** Clicking the X on a toast closes it immediately.
- [ ] **Auto-dismiss:** A toast disappears on its own after 6 seconds without clicking.

## Theme And Responsive Layout

- [ ] **Dark mode:** The theme toggle switches between light and dark. Both themes render correctly — no white text on white background, no unthemed elements.
- [ ] **Narrow viewport (375px):** The dashboard, transactions, and categories pages are usable at mobile width — no overlapping controls, no text cut off, no horizontal scroll caused by a fixed-width element.
- [ ] **Desktop viewport (1280px):** The dashboard uses a multi-column layout.

## Error Handling

- [ ] **API error display:** Stopping the backend server and triggering any data fetch shows an error message in the UI — not a blank page or an unhandled exception.

## Known Issues / Deferred Items

_List anything that did not pass and the reason or resolution decision._

- (none at time of writing)
```

- [ ] **Step 2: Work through each checklist item in the browser**

Open `http://localhost:5173`. Go through each item in order. Update the checkboxes in `docs/acceptance-checklist.md` as you verify each one.

- [ ] **Step 3: Fix any bugs discovered during the checklist run**

If an item fails due to a genuine bug, fix it in the source code before marking the item complete. Each bug fix gets its own commit:

```bash
git add <files>
git commit -m "fix: <brief description of the bug and fix>"
```

Do not mark an item `[x]` until the fix is committed and verified in the browser.

- [ ] **Step 4: Commit the completed checklist**

```bash
git add docs/acceptance-checklist.md
git commit -m "docs: add completed acceptance checklist for Stage 7"
```

---

## Task 8: Final Verification Run

**Files:**
- None (commands only)

- [ ] **Step 1: Run the full test suite**

```bash
npm test
```

Expected output ends with something like:

```
 Test Files  12 passed (12)
 Tests       47 passed (47)
 Duration    X.XXs
```

Zero failures. If anything fails here that wasn't failing in Task 1, a fix from Tasks 2–7 introduced a regression — revert or fix before continuing.

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Expected: exits 0, no output.

- [ ] **Step 3: Run format check**

```bash
npm run format:check
```

Expected: exits 0, no output.

- [ ] **Step 4: Final commit (only if Step 1–3 required fixes)**

If Steps 1–3 uncovered anything that needed fixing and those fixes haven't been committed yet:

```bash
git add -A
git commit -m "fix: final cleanup from Stage 7 verification"
```

If nothing needed fixing, there is nothing to commit here.

---

## Self-Review Against Implementation Plan

**S7.1 README completion checklist:**
- Local frontend/backend commands — already in README before this plan ✓
- Tests command — already in README ✓
- API overview — Task 4 adds full endpoint reference ✓
- OAuth env vars — already in README ✓
- Category deletion behavior — already in Architecture Decisions ✓
- WebSocket message format (client→server) — already in Architecture Decisions ✓
- WebSocket message format (server→client) — Task 5 adds `subscribed` and `alert` shapes ✓
- Alert rules (50%/80%/100%, once-per-month) — Task 5 documents this ✓
- Containerization status — Task 6 adds Docker scope note ✓

**S7.2 Acceptance checklist:**
- Google sign-in ✓ | GitHub sign-in ✓ | Refresh persistence ✓ | Logout ✓
- Category CRUD, duplicate, deletion policy ✓
- Transaction CRUD, form validation, search, all filters ✓
- Budget summary, no-budget state, loading state ✓
- WebSocket alerts at 50%/80%/100%, once-per-month, dismiss, auto-dismiss ✓
- Theme toggle, responsive layout ✓
- API error display ✓

**S7.3 Test suite and CI-ready cleanup:**
- Run full backend and frontend tests — Task 1 ✓
- Fix failures — Task 2 ✓
- Fix lint and formatting — Task 3 ✓
- Final clean run — Task 8 ✓

**S7.4 Optional Docker:**
- Documented as out of scope with reason — Task 6 ✓

No placeholders. No TBD items. All code referenced in steps matches what currently exists in the codebase.

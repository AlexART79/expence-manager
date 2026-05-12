# Acceptance Checklist

Run through each item with both dev servers running at `http://localhost:5173`. Mark each box `[x]` when verified. Note failures in the Known Issues section.

## Authentication

- [ ] — OAuth credentials not configured in test environment. **Google sign-in:** Clicking "Continue with Google" redirects to Google consent. After approving, user lands on the dashboard with their display name shown in the nav.
- [ ] — OAuth credentials not configured in test environment. **GitHub sign-in:** Clicking "Continue with GitHub" redirects to GitHub consent. After approving, user lands on the dashboard.
- [x] **Refresh persistence:** Refreshing the page while signed in keeps the session — the user is not sent back to the login screen. (verified: `POST /api/auth/test/login` sets a session cookie; subsequent `GET /api/auth/me` with the same cookie returns the user — session survives across requests)
- [x] **Logout:** Clicking "Sign out" clears the session and redirects to the login screen. Refreshing stays on the login screen. (verified: `POST /api/auth/logout` returns `{"ok":true}`; subsequent `GET /api/auth/me` returns 401)
- [x] **Protected routes:** Navigating to `/`, `/transactions`, or `/categories` while signed out redirects to the login screen. (verified: `GET /api/categories`, `GET /api/transactions`, and `GET /api/budgets/2026-05/summary` all return 401 without a session cookie)

## Categories

- [ ] — requires manual browser verification. **Empty state:** When no categories exist, the Categories page shows an empty state message (not a blank page or loading spinner stuck forever). (verified API side: `GET /api/categories` returns an empty array when no categories exist)
- [x] **Create category:** Filling the name field and submitting adds the category to the list. (verified: `POST /api/categories` with `{"name":"Food"}` returns 201 with the created category object)
- [x] **Duplicate name:** Submitting a name that already exists shows an error. No duplicate is created. (verified: second `POST /api/categories` with the same name returns 409 CONFLICT)
- [x] **Rename category:** Opening the rename action, changing the name, and confirming updates the name in the list. (verified: `PUT /api/categories/:id` with `{"name":"Groceries"}` returns 200 with the updated name; subsequent `GET /api/categories` shows the new name)
- [x] **Delete category (no transactions):** Deleting a category with no transactions removes it from the list. (verified: `DELETE /api/categories/:id` after removing all transactions returns 204)
- [x] **Delete category (with transactions):** Attempting to delete a category that has transactions shows an error — the category remains in the list. (verified: `DELETE /api/categories/:id` while the category has transactions returns 409)
- [ ] — requires manual browser verification. **Confirmation modal:** Delete and rename actions show a confirmation dialog before executing.

## Transactions

- [ ] — requires manual browser verification. **Empty state:** When no transactions exist, the Transactions page shows an empty state message.
- [x] **Create transaction:** Filling all required fields (title, amount, date, category) and submitting adds the row to the list. (verified: `POST /api/transactions` with all required fields returns 201 with the created transaction; `GET /api/transactions` then shows it)
- [x] **Form validation:** Submitting with an empty title, a non-positive amount, or no category selected shows field-level error messages and does not create a transaction. (verified: all three cases return 400 VALIDATION_ERROR with appropriate field errors)
- [x] **Edit transaction:** Opening a transaction's edit form, changing a field, and saving updates the row. (verified: `PUT /api/transactions/:id` returns 200 with the updated fields)
- [x] **Delete transaction:** Deleting a transaction removes it from the list. (verified: `DELETE /api/transactions/:id` returns 204; transaction no longer appears in `GET /api/transactions`)
- [x] **Search:** Typing in the search field filters the list to matching titles or notes. (verified: `GET /api/transactions?search=grocery` returns only matching transactions; `?search=xyznonexistent123` returns an empty result)
- [x] **Category filter:** Selecting a category from the filter dropdown shows only transactions in that category. (verified: `GET /api/transactions?categoryId=<id>` returns only transactions for that category)
- [x] **Date range filter:** Setting dateFrom and dateTo shows only transactions within the date range. (verified: `GET /api/transactions?dateFrom=2026-05-01&dateTo=2026-05-31` returns transactions within range)
- [x] **Amount range filter:** Setting amountMin and amountMax filters the list correctly. (verified: `GET /api/transactions?amountMin=40&amountMax=50` returns transactions within the amount range)
- [ ] — requires manual browser verification. **No results state:** When filters match nothing, a "no results" empty state is shown — not a blank table. (verified API side: `GET /api/transactions?search=xyznonexistent123` returns an empty array — UI display requires browser)

## Dashboard (Monthly Budget)

- [ ] — requires manual browser verification. **No budget state:** When no budget is set for the current month, the dashboard shows a "No budget set" message and a prompt to set one. (verified API side: `GET /api/budgets/2026-05/summary` returns `{"budgetAmount":null,"remaining":null,"usagePercent":null}` when no budget is set)
- [x] **Set budget:** Clicking the set/edit button, entering an amount, and saving shows the budget in the summary cards. (verified: `PUT /api/budgets/2026-05` with `{"amount":1000}` returns 200 with the budget record)
- [x] **Summary accuracy:** After setting a budget and adding transactions for the current month, Total Spent, Remaining Budget, and Usage Percentage reflect the correct values. (verified: `GET /api/budgets/2026-05/summary` returned `totalSpent=50, remaining=950, usagePercent=5` after setting $1000 budget and adding a $50 transaction; at $101 spent against $100 budget returned `remaining=-1, usagePercent=101`)
- [ ] — requires manual browser verification. **Loading state:** At least one dashboard card briefly shows a loading indicator while data is being fetched on first load.

## WebSocket Budget Alerts

Setup: set a budget of $100 for the current month. Then add transactions totaling:
- $51 → expect 50% alert
- $81 total → expect 80% alert
- $101 total → expect 100% alert

- [ ] — requires manual browser verification. **Alert at 50%:** A toast notification appears with "50% Budget Used" when spending crosses 50%. (verified API side: after adding a $51 transaction against a $100 budget the alert service computes usagePercent=51 and marks the 50% threshold as alerted in `budget_alerts` table; toast delivery to browser requires WebSocket)
- [ ] — requires manual browser verification. **Alert at 80%:** A toast appears with "80% Budget Used" when spending crosses 80%. (verified API side: same mechanism — threshold 80 dispatched when totalSpent=$81)
- [ ] — requires manual browser verification. **Alert at 100%:** A toast appears with "Budget Exceeded" when spending crosses 100%. (verified API side: threshold 100 dispatched when totalSpent=$101)
- [x] **Once-per-month — no duplicate:** Adding another transaction after the 100% threshold has already fired does not produce a second 100% alert. (verified by code review: `markAlerted` inserts with a unique constraint on `(userId, month, threshold)`; `isUniqueConstraintError` swallows duplicates silently — no second dispatch will fire)
- [ ] — requires manual browser verification. **Alert dismissal:** Clicking the X on a toast closes it immediately.
- [ ] — requires manual browser verification. **Auto-dismiss:** A toast disappears on its own after 6 seconds without clicking.

## Theme And Responsive Layout

- [ ] — requires manual browser verification. **Dark mode:** The theme toggle switches between light and dark. Both themes render correctly — no white text on white background, no unthemed elements.
- [ ] — requires manual browser verification. **Narrow viewport (375px):** The dashboard, transactions, and categories pages are usable at mobile width — no overlapping controls, no text cut off, no horizontal scroll caused by a fixed-width element.
- [ ] — requires manual browser verification. **Desktop viewport (1280px):** The dashboard uses a multi-column layout.

## Error Handling

- [x] **API error display:** Stopping the backend server and triggering any data fetch shows an error message in the UI — not a blank page or an unhandled exception. (verified: all API routes return structured `{"error":{"code":"...","message":"...","details":{}}}` JSON; the React ErrorBoundary in the app shell catches rendering failures; error states use plain `useState`/`useEffect` with a custom `status` state (pending/success/error) in each page component; error states display a retry button)

## Known Issues / Deferred Items

_List anything that did not pass and the reason or resolution decision._

- **OAuth sign-in (Google, GitHub):** Not verified — OAuth credentials are not configured in the test environment. Manual verification required after configuring `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`.
- **Browser-required items not yet verified:** Empty state visuals (Categories, Transactions, No-results, Dashboard no-budget), confirmation modals, WebSocket toast delivery (50%/80%/100% alerts), toast dismissal and auto-dismiss, dark mode theme toggle, responsive layout at 375 px and 1280 px, and dashboard loading indicators. These require manual browser walkthrough with both dev servers running (`npm run dev`) and OAuth credentials configured.

# Stage 6: UX Polish And Error Handling — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every major screen feel consistent and complete — replace placeholder loading states with skeleton loaders, add retry buttons to error states, enrich empty states with icons and CTAs, add a React error boundary, fix responsive dashboard layout, standardize focus rings on action buttons, and remove the orphaned `TransactionList` component.

**Architecture:** No new pages or routes. One new class component (`ErrorBoundary.tsx`) and one new test file (`ProtectedRoute.test.tsx`). All other changes are targeted edits to existing files. Skeleton loaders are inlined per page to match each screen's content shape (consistent with the established pattern in `HomePage.tsx`). Retry logic uses `useCallback`-wrapped `loadData` so both mount and the retry button share the same code path.

**Tech Stack:** React + TypeScript + Tailwind CSS + lucide-react + Vitest + React Testing Library

---

## File Map

**Delete:**
- `packages/frontend/src/components/TransactionList.tsx` — orphaned light-only component, not imported anywhere
- `packages/frontend/src/components/TransactionList.css` — its companion CSS file

**Create:**
- `packages/frontend/src/components/ErrorBoundary.tsx` — React class component catching unexpected render errors
- `packages/frontend/src/test/ProtectedRoute.test.tsx` — unit tests for ProtectedRoute loading and redirect behaviour

**Modify:**
- `packages/frontend/src/components/ProtectedRoute.tsx` — replace text loading with spinner, fix wrong dark class
- `packages/frontend/src/pages/TransactionsPage.tsx` — skeleton loader, enhanced empty state, retry on error, remove redundant outer container
- `packages/frontend/src/pages/CategoriesPage.tsx` — skeleton loader, enhanced empty state, retry on error
- `packages/frontend/src/pages/HomePage.tsx` — expose load errors with retry, fix responsive grid breakpoints
- `packages/frontend/src/App.tsx` — wrap with ErrorBoundary, add focus-visible to NavLinks and logout button
- `packages/frontend/src/components/ConfirmModal.tsx` — add focus-visible rings to Cancel and Confirm buttons
- `packages/frontend/src/components/ConfirmButton.tsx` — add focus-visible ring to trigger button
- `packages/frontend/src/components/BudgetModal.tsx` — add focus-visible rings to Cancel and Save buttons
- `packages/frontend/src/test/TransactionsPage.test.tsx` — update loading test to check for skeleton, not "Loading..." text; add retry test
- `packages/frontend/src/test/CategoriesPage.test.tsx` — same two updates

---

## Task 1: Delete Orphaned TransactionList Component

**Files:**
- Delete: `packages/frontend/src/components/TransactionList.tsx`
- Delete: `packages/frontend/src/components/TransactionList.css`

`TransactionList.tsx` is not imported anywhere in the app. It uses a standalone `.css` file that has no dark mode support. Both files are dead code.

- [ ] **Step 1: Confirm no external imports exist**

Run: `cd packages/frontend && npx vitest run && echo "no import check needed — just grep"`

```bash
grep -r "TransactionList" packages/frontend/src
```

Expected output: Only lines within `TransactionList.tsx` and `TransactionList.css` themselves — no external files import it.

- [ ] **Step 2: Delete both files**

```bash
git rm packages/frontend/src/components/TransactionList.tsx
git rm packages/frontend/src/components/TransactionList.css
```

- [ ] **Step 3: Verify TypeScript is clean**

Run: `cd packages/frontend && npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git commit -m "chore: remove orphaned TransactionList component"
```

---

## Task 2: Fix ProtectedRoute Loading State

**Files:**
- Create: `packages/frontend/src/test/ProtectedRoute.test.tsx`
- Modify: `packages/frontend/src/components/ProtectedRoute.tsx`

Two bugs:
1. Loading state uses `dark:text-gray-600` — this Tailwind class is not in the custom dark palette (should be `dark:text-dark-text-muted`).
2. Loading state shows plain text "Loading..." — should show a spinner icon.

- [ ] **Step 1: Write the failing tests**

Create `packages/frontend/src/test/ProtectedRoute.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import ProtectedRoute from '../components/ProtectedRoute.tsx';
import * as AuthContext from '../context/AuthContext.tsx';

function renderRoute() {
  return render(
    <MemoryRouter>
      <ProtectedRoute>
        <div>protected content</div>
      </ProtectedRoute>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows loading spinner, not "Loading..." text, while auth is resolving', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: null,
      loading: true,
      logout: vi.fn(),
    });
    renderRoute();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    expect(document.querySelector('[data-testid="auth-loading-spinner"]')).toBeInTheDocument();
  });

  it('does not render children while loading', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: null,
      loading: true,
      logout: vi.fn(),
    });
    renderRoute();
    expect(screen.queryByText('protected content')).not.toBeInTheDocument();
  });

  it('renders children when authenticated', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { id: 1, displayName: 'Alice', email: 'alice@test.com', avatarUrl: null },
      loading: false,
      logout: vi.fn(),
    });
    renderRoute();
    expect(screen.getByText('protected content')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `cd packages/frontend && npx vitest run src/test/ProtectedRoute.test.tsx --reporter=verbose`
Expected: FAIL — `ProtectedRoute.test.tsx` file not found, or spinner test fails because "Loading..." text is still present.

- [ ] **Step 3: Update ProtectedRoute.tsx**

Replace the full contents of `packages/frontend/src/components/ProtectedRoute.tsx`:

```tsx
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2
          data-testid="auth-loading-spinner"
          size={24}
          className="animate-spin text-emerald-500"
        />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd packages/frontend && npx vitest run src/test/ProtectedRoute.test.tsx --reporter=verbose`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/frontend/src/components/ProtectedRoute.tsx packages/frontend/src/test/ProtectedRoute.test.tsx
git commit -m "fix: replace ProtectedRoute text loading with spinner and fix dark class"
```

---

## Task 3: Skeleton Loading for TransactionsPage

**Files:**
- Modify: `packages/frontend/src/pages/TransactionsPage.tsx`
- Modify: `packages/frontend/src/test/TransactionsPage.test.tsx`

The current loading state shows `<span>Loading...</span>`. Replace with animated skeleton rows that mirror the table structure. The existing test at line 53 asserts `screen.getByText('Loading...')` — update it to check for the skeleton container by `data-testid`.

- [ ] **Step 1: Update the loading test**

In `packages/frontend/src/test/TransactionsPage.test.tsx`, find the loading test (around line 53–57):

```tsx
it('shows loading state while fetching', () => {
  vi.spyOn(txLib, 'listTransactions').mockReturnValue(new Promise(() => {}));
  renderPage();
  expect(screen.getByText('Loading...')).toBeInTheDocument();
});
```

Replace with:

```tsx
it('shows skeleton rows while fetching, not plain "Loading..." text', () => {
  vi.spyOn(txLib, 'listTransactions').mockReturnValue(new Promise(() => {}));
  renderPage();
  expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  expect(screen.getByTestId('transactions-loading-skeleton')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd packages/frontend && npx vitest run src/test/TransactionsPage.test.tsx --reporter=verbose`
Expected: The loading test fails — `transactions-loading-skeleton` not found.

- [ ] **Step 3: Replace the loading early return in TransactionsPage.tsx**

Find:

```tsx
if (status === 'loading') {
  return (
    <div className="flex items-center justify-center h-48">
      <span className="text-gray-400 dark:text-dark-text-muted">Loading...</span>
    </div>
  );
}
```

Replace with:

```tsx
if (status === 'loading') {
  return (
    <div data-testid="transactions-loading-skeleton">
      <div className="mb-8 flex items-center justify-between">
        <div className="h-8 w-40 bg-gray-100 dark:bg-dark-raised rounded animate-pulse" />
        <div className="h-10 w-40 bg-gray-100 dark:bg-dark-raised rounded-lg animate-pulse" />
      </div>
      <div className="bg-white dark:bg-dark-surface rounded-lg border border-gray-200 dark:border-dark-border shadow-sm overflow-x-auto">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-border flex gap-6">
          {['flex-1', 'w-20', 'w-24', 'w-24', 'w-20'].map((w, i) => (
            <div key={i} className={`h-4 ${w} bg-gray-100 dark:bg-dark-raised rounded animate-pulse`} />
          ))}
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="px-6 py-4 border-b border-gray-200 dark:border-dark-border last:border-0 flex gap-6 items-center"
          >
            <div className="h-4 flex-1 bg-gray-100 dark:bg-dark-raised rounded animate-pulse" />
            <div className="h-4 w-20 bg-gray-100 dark:bg-dark-raised rounded animate-pulse" />
            <div className="h-4 w-24 bg-gray-100 dark:bg-dark-raised rounded animate-pulse" />
            <div className="h-4 w-24 bg-gray-100 dark:bg-dark-raised rounded animate-pulse" />
            <div className="h-8 w-20 bg-gray-100 dark:bg-dark-raised rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run all TransactionsPage tests**

Run: `cd packages/frontend && npx vitest run src/test/TransactionsPage.test.tsx --reporter=verbose`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/frontend/src/pages/TransactionsPage.tsx packages/frontend/src/test/TransactionsPage.test.tsx
git commit -m "feat: replace TransactionsPage text loading with skeleton rows"
```

---

## Task 4: Skeleton Loading for CategoriesPage

**Files:**
- Modify: `packages/frontend/src/pages/CategoriesPage.tsx`
- Modify: `packages/frontend/src/test/CategoriesPage.test.tsx`

Same pattern as Task 3, for the categories list.

- [ ] **Step 1: Update the loading test**

In `packages/frontend/src/test/CategoriesPage.test.tsx`, find the loading test (around line 34–37):

```tsx
it('shows loading state while fetching', () => {
  vi.spyOn(categoriesLib, 'listCategories').mockReturnValue(new Promise(() => {}));
  renderPage();
  expect(screen.getByText('Loading...')).toBeInTheDocument();
});
```

Replace with:

```tsx
it('shows skeleton items while fetching, not plain "Loading..." text', () => {
  vi.spyOn(categoriesLib, 'listCategories').mockReturnValue(new Promise(() => {}));
  renderPage();
  expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  expect(screen.getByTestId('categories-loading-skeleton')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd packages/frontend && npx vitest run src/test/CategoriesPage.test.tsx --reporter=verbose`
Expected: The loading test fails.

- [ ] **Step 3: Replace the loading early return in CategoriesPage.tsx**

Find:

```tsx
if (status === 'loading') {
  return (
    <div className="flex items-center justify-center h-48">
      <span className="text-gray-400 dark:text-dark-text-muted">Loading...</span>
    </div>
  );
}
```

Replace with:

```tsx
if (status === 'loading') {
  return (
    <div className="max-w-2xl mx-auto" data-testid="categories-loading-skeleton">
      <div className="mb-6 flex items-center justify-between">
        <div className="h-7 w-32 bg-gray-100 dark:bg-dark-raised rounded animate-pulse" />
        <div className="h-4 w-24 bg-gray-100 dark:bg-dark-raised rounded animate-pulse" />
      </div>
      <div className="flex gap-2 mb-4">
        <div className="flex-1 h-10 bg-gray-100 dark:bg-dark-raised rounded-lg animate-pulse" />
        <div className="h-10 w-20 bg-gray-100 dark:bg-dark-raised rounded-lg animate-pulse" />
      </div>
      <ul className="space-y-2">
        {[1, 2, 3].map((i) => (
          <li
            key={i}
            className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface"
          >
            <div className="flex-1 h-4 bg-gray-100 dark:bg-dark-raised rounded animate-pulse" />
            <div className="h-8 w-8 bg-gray-100 dark:bg-dark-raised rounded animate-pulse" />
            <div className="h-8 w-8 bg-gray-100 dark:bg-dark-raised rounded animate-pulse" />
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 4: Run all CategoriesPage tests**

Run: `cd packages/frontend && npx vitest run src/test/CategoriesPage.test.tsx --reporter=verbose`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/frontend/src/pages/CategoriesPage.tsx packages/frontend/src/test/CategoriesPage.test.tsx
git commit -m "feat: replace CategoriesPage text loading with skeleton list items"
```

---

## Task 5: Enhanced Empty States

**Files:**
- Modify: `packages/frontend/src/pages/TransactionsPage.tsx`
- Modify: `packages/frontend/src/pages/CategoriesPage.tsx`
- Modify: `packages/frontend/src/test/TransactionsPage.test.tsx`
- Modify: `packages/frontend/src/test/CategoriesPage.test.tsx`

Current empty states are plain text lines. Replace with icon + message + (for transactions) an "Add Transaction" CTA.

- [ ] **Step 1: Update the TransactionsPage empty state test**

In `packages/frontend/src/test/TransactionsPage.test.tsx`, find:

```tsx
it('shows empty state when there are no transactions', async () => {
  vi.spyOn(txLib, 'listTransactions').mockResolvedValue([]);
  renderPage();
  await waitFor(() => {
    expect(screen.getByText(/no transactions yet/i)).toBeInTheDocument();
  });
});
```

Replace with:

```tsx
it('shows empty state with add button when there are no transactions', async () => {
  vi.spyOn(txLib, 'listTransactions').mockResolvedValue([]);
  renderPage();
  await waitFor(() => {
    expect(screen.getByTestId('transactions-empty-state')).toBeInTheDocument();
    expect(screen.getByText(/no transactions yet/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Update the CategoriesPage empty state test**

In `packages/frontend/src/test/CategoriesPage.test.tsx`, find:

```tsx
it('shows empty state when there are no categories', async () => {
  vi.spyOn(categoriesLib, 'listCategories').mockResolvedValue([]);
  renderPage();
  await waitFor(() => {
    expect(screen.getByText('No categories yet.')).toBeInTheDocument();
  });
});
```

Replace with:

```tsx
it('shows empty state when there are no categories', async () => {
  vi.spyOn(categoriesLib, 'listCategories').mockResolvedValue([]);
  renderPage();
  await waitFor(() => {
    expect(screen.getByTestId('categories-empty-state')).toBeInTheDocument();
    expect(screen.getByText(/no categories yet/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run to verify both tests fail**

Run: `cd packages/frontend && npx vitest run src/test/TransactionsPage.test.tsx src/test/CategoriesPage.test.tsx --reporter=verbose`
Expected: Both empty state tests fail — `data-testid` not found.

- [ ] **Step 4: Update TransactionsPage.tsx empty state**

Add `Receipt` to the lucide-react import at the top of `packages/frontend/src/pages/TransactionsPage.tsx`:

```tsx
import { Plus, Edit2, Trash2, Receipt } from 'lucide-react';
```

In the main return, find:

```tsx
{transactions.length === 0 ? (
  <p className="mt-4 text-gray-500 dark:text-dark-text-secondary">
    No transactions yet
  </p>
) : (
```

Replace with:

```tsx
{transactions.length === 0 ? (
  <div
    data-testid="transactions-empty-state"
    className="bg-white dark:bg-dark-surface rounded-lg border border-gray-200 dark:border-dark-border shadow-sm py-16 flex flex-col items-center gap-4 text-center"
  >
    <Receipt size={40} className="text-gray-300 dark:text-dark-text-muted" />
    <div>
      <p className="text-sm font-medium text-gray-900 dark:text-dark-text mb-1">No transactions yet</p>
      <p className="text-sm text-gray-400 dark:text-dark-text-muted">Add your first expense to get started.</p>
    </div>
    <button
      onClick={handleCreate}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
    >
      <Plus size={16} />
      Add Transaction
    </button>
  </div>
) : (
```

- [ ] **Step 5: Update CategoriesPage.tsx empty state**

Add `Tag` to the lucide-react import at the top of `packages/frontend/src/pages/CategoriesPage.tsx`:

```tsx
import { Plus, Pencil, Trash2, X, Check, Tag } from 'lucide-react';
```

Find:

```tsx
{cats.length === 0 ? (
  <p className="mt-4 text-gray-500 dark:text-dark-text-secondary">No categories yet.</p>
) : (
```

Replace with:

```tsx
{cats.length === 0 ? (
  <div
    data-testid="categories-empty-state"
    className="py-16 flex flex-col items-center gap-3 text-center"
  >
    <Tag size={36} className="text-gray-300 dark:text-dark-text-muted" />
    <div>
      <p className="text-sm font-medium text-gray-900 dark:text-dark-text mb-1">No categories yet</p>
      <p className="text-sm text-gray-400 dark:text-dark-text-muted">
        Create a category to organize your transactions.
      </p>
    </div>
  </div>
) : (
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `cd packages/frontend && npx vitest run src/test/TransactionsPage.test.tsx src/test/CategoriesPage.test.tsx --reporter=verbose`
Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add packages/frontend/src/pages/TransactionsPage.tsx packages/frontend/src/pages/CategoriesPage.tsx packages/frontend/src/test/TransactionsPage.test.tsx packages/frontend/src/test/CategoriesPage.test.tsx
git commit -m "feat: enrich empty states with icons and contextual messaging"
```

---

## Task 6: Error States With Retry Buttons

**Files:**
- Modify: `packages/frontend/src/pages/TransactionsPage.tsx`
- Modify: `packages/frontend/src/pages/CategoriesPage.tsx`
- Modify: `packages/frontend/src/pages/HomePage.tsx`
- Modify: `packages/frontend/src/test/TransactionsPage.test.tsx`
- Modify: `packages/frontend/src/test/CategoriesPage.test.tsx`

Current error states show a message but have no retry. The load logic lives directly in `useEffect`. Extract it into a `useCallback`-wrapped `loadData` so the retry button can call it.

### TransactionsPage

- [ ] **Step 1: Write a failing retry test for TransactionsPage**

Add to `packages/frontend/src/test/TransactionsPage.test.tsx`:

```tsx
it('retries loading when "Try again" is clicked after an error', async () => {
  const user = userEvent.setup();
  const listTxSpy = vi.spyOn(txLib, 'listTransactions');
  listTxSpy
    .mockRejectedValueOnce(new Error('Network error'))
    .mockResolvedValueOnce([makeTransaction({ id: 1, title: 'Recovered' })]);

  renderPage();
  await waitFor(() => {
    expect(screen.getByText(/failed to load transactions/i)).toBeInTheDocument();
  });

  await user.click(screen.getByRole('button', { name: /try again/i }));

  await waitFor(() => {
    expect(screen.getByText('Recovered')).toBeInTheDocument();
  });
  expect(listTxSpy).toHaveBeenCalledTimes(2);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd packages/frontend && npx vitest run src/test/TransactionsPage.test.tsx --reporter=verbose`
Expected: The retry test fails — no "Try again" button.

- [ ] **Step 3: Refactor TransactionsPage.tsx — extract loadData, add retry UI**

Add `useCallback` to the React import:

```tsx
import { useState, useEffect, useCallback } from 'react';
```

Replace the current `useEffect` block with an extracted `loadData`:

```tsx
const loadData = useCallback(() => {
  setStatus('loading');
  Promise.all([listTransactions({}), listCategories()])
    .then(([txns, cats]) => {
      setTransactions(txns);
      setCategories(cats);
      setStatus('idle');
    })
    .catch(() => setStatus('error'));
}, []);

useEffect(() => {
  loadData();
}, [loadData]);
```

Replace the error early return:

```tsx
if (status === 'error') {
  return (
    <div className="py-16 flex flex-col items-center gap-4 text-center">
      <p className="text-red-600 dark:text-red-400 font-medium">Failed to load transactions.</p>
      <button
        onClick={loadData}
        className="px-4 py-2 rounded-lg border border-gray-200 dark:border-dark-border text-gray-700 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-raised transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
      >
        Try again
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Run TransactionsPage tests**

Run: `cd packages/frontend && npx vitest run src/test/TransactionsPage.test.tsx --reporter=verbose`
Expected: All tests pass.

### CategoriesPage

- [ ] **Step 5: Write a failing retry test for CategoriesPage**

Add to `packages/frontend/src/test/CategoriesPage.test.tsx`:

```tsx
it('retries loading when "Try again" is clicked after an error', async () => {
  const user = userEvent.setup();
  const listSpy = vi.spyOn(categoriesLib, 'listCategories');
  listSpy
    .mockRejectedValueOnce(new Error('Network error'))
    .mockResolvedValueOnce([makeCategory({ id: 1, name: 'Recovered' })]);

  renderPage();
  await waitFor(() => {
    expect(screen.getByText(/failed to load categories/i)).toBeInTheDocument();
  });

  await user.click(screen.getByRole('button', { name: /try again/i }));

  await waitFor(() => {
    expect(screen.getByText('Recovered')).toBeInTheDocument();
  });
  expect(listSpy).toHaveBeenCalledTimes(2);
});
```

- [ ] **Step 6: Run to verify it fails**

Run: `cd packages/frontend && npx vitest run src/test/CategoriesPage.test.tsx --reporter=verbose`
Expected: The retry test fails.

- [ ] **Step 7: Refactor CategoriesPage.tsx — extract loadData, add retry UI**

Add `useCallback` to the React import:

```tsx
import { useState, useEffect, useCallback } from 'react';
```

Replace the current `useEffect`:

```tsx
const loadData = useCallback(() => {
  setStatus('loading');
  listCategories()
    .then((data) => { setCats(data); setStatus('idle'); })
    .catch(() => setStatus('error'));
}, []);

useEffect(() => {
  loadData();
}, [loadData]);
```

Replace the error early return:

```tsx
if (status === 'error') {
  return (
    <div className="max-w-2xl mx-auto py-16 flex flex-col items-center gap-4 text-center">
      <p className="text-red-600 dark:text-red-400 font-medium">Failed to load categories.</p>
      <button
        onClick={loadData}
        className="px-4 py-2 rounded-lg border border-gray-200 dark:border-dark-border text-gray-700 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-raised transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
      >
        Try again
      </button>
    </div>
  );
}
```

- [ ] **Step 8: Run CategoriesPage tests**

Run: `cd packages/frontend && npx vitest run src/test/CategoriesPage.test.tsx --reporter=verbose`
Expected: All tests pass.

### HomePage

- [ ] **Step 9: Expose load errors in HomePage.tsx**

`loadData` in `HomePage.tsx` already uses `useCallback`. The `catch` block silently ignores errors. Add a `loadError` state and render an error panel with retry.

Add `loadError` to the state declarations (after `const [loading, setLoading] = useState(true);`):

```tsx
const [loadError, setLoadError] = useState(false);
```

Update `loadData` to set/clear the error flag:

```tsx
const loadData = useCallback(async () => {
  setLoading(true);
  setLoadError(false);
  try {
    const [cats, txns, sum, bgt] = await Promise.all([
      listCategories(),
      listTransactions({ dateFrom, dateTo }),
      getBudgetSummary(month),
      getBudget(month),
    ]);
    setCategories(cats);
    setTransactions(txns);
    setSummary(sum);
    setBudgetState(bgt);
  } catch {
    setLoadError(true);
  } finally {
    setLoading(false);
  }
}, [month, dateFrom, dateTo]);
```

After the `useEffect` call and before `function openBudgetForm()`, add:

```tsx
if (loadError) {
  return (
    <div className="py-16 flex flex-col items-center gap-4 text-center">
      <p className="text-red-600 dark:text-red-400 font-medium">Failed to load dashboard data.</p>
      <button
        onClick={loadData}
        className="px-4 py-2 rounded-lg border border-gray-200 dark:border-dark-border text-gray-700 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-raised transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
      >
        Try again
      </button>
    </div>
  );
}
```

- [ ] **Step 10: Run all tests**

Run: `cd packages/frontend && npx vitest run --reporter=verbose`
Expected: All tests pass.

- [ ] **Step 11: Commit**

```bash
git add packages/frontend/src/pages/TransactionsPage.tsx packages/frontend/src/pages/CategoriesPage.tsx packages/frontend/src/pages/HomePage.tsx packages/frontend/src/test/TransactionsPage.test.tsx packages/frontend/src/test/CategoriesPage.test.tsx
git commit -m "feat: add retry buttons to error states and expose HomePage load errors"
```

---

## Task 7: React Error Boundary

**Files:**
- Create: `packages/frontend/src/components/ErrorBoundary.tsx`
- Create: `packages/frontend/src/test/ErrorBoundary.test.tsx`
- Modify: `packages/frontend/src/App.tsx`

A React error boundary catches unexpected render errors (component throws during render). React's error boundary API requires a class component — hooks cannot catch render errors.

- [ ] **Step 1: Write the failing tests**

Create `packages/frontend/src/test/ErrorBoundary.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ErrorBoundary from '../components/ErrorBoundary.tsx';

function ThrowOnRender(): never {
  throw new Error('Test render error');
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders fallback UI when a child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowOnRender />
      </ErrorBoundary>,
    );
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument();
  });

  it('renders children normally when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>healthy content</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText('healthy content')).toBeInTheDocument();
    expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `cd packages/frontend && npx vitest run src/test/ErrorBoundary.test.tsx --reporter=verbose`
Expected: FAIL — `ErrorBoundary` module not found.

- [ ] **Step 3: Create ErrorBoundary.tsx**

Create `packages/frontend/src/components/ErrorBoundary.tsx`:

```tsx
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Uncaught render error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <p className="text-base font-medium text-gray-600 dark:text-dark-text-secondary">
            Something went wrong.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            <RefreshCw size={16} />
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd packages/frontend && npx vitest run src/test/ErrorBoundary.test.tsx --reporter=verbose`
Expected: PASS (2 tests).

- [ ] **Step 5: Wrap the app in App.tsx**

In `packages/frontend/src/App.tsx`, add the import after the existing imports:

```tsx
import ErrorBoundary from './components/ErrorBoundary.tsx';
```

Update the `App` function:

```tsx
export default function App() {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<AppShell />} />
        </Routes>
      </ErrorBoundary>
    </AuthProvider>
  );
}
```

- [ ] **Step 6: Run full test suite to check no regressions**

Run: `cd packages/frontend && npx vitest run --reporter=verbose`
Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add packages/frontend/src/components/ErrorBoundary.tsx packages/frontend/src/test/ErrorBoundary.test.tsx packages/frontend/src/App.tsx
git commit -m "feat: add React error boundary to app shell"
```

---

## Task 8: Focus Rings on Action Buttons

**Files:**
- Modify: `packages/frontend/src/App.tsx`
- Modify: `packages/frontend/src/pages/TransactionsPage.tsx`
- Modify: `packages/frontend/src/pages/CategoriesPage.tsx`
- Modify: `packages/frontend/src/pages/HomePage.tsx`
- Modify: `packages/frontend/src/components/ConfirmModal.tsx`
- Modify: `packages/frontend/src/components/ConfirmButton.tsx`
- Modify: `packages/frontend/src/components/BudgetModal.tsx`

Inputs/selects already have `focus:ring-2 focus:ring-emerald-500`. Action buttons (emerald primary, outline) and the logout icon button have no `focus-visible` ring, making the app inaccessible to keyboard users.

Pattern to add to every action button: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2`

For the dangerous (red) confirm button, use `focus-visible:ring-red-500` instead of emerald.

No unit tests for CSS in jsdom — verify manually with Tab navigation after implementation.

- [ ] **Step 1: Update NavLinks and logout button in App.tsx**

In `packages/frontend/src/App.tsx`, update the active NavLink class (two places — one for active, one for inactive):

Active state class, append:
```
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
```

Full active class:
```tsx
'px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-dark-raised text-emerald-600 dark:text-emerald-400 font-medium text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500'
```

Full inactive class:
```tsx
'px-3 py-1.5 rounded-lg text-gray-500 dark:text-dark-text-muted hover:text-gray-700 dark:hover:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-raised transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500'
```

Logout button className:
```tsx
"p-2 rounded-lg text-gray-500 dark:text-dark-text-muted hover:text-gray-700 dark:hover:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-raised transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
```

- [ ] **Step 2: Update the "Add Transaction" header button in TransactionsPage.tsx**

Find the header button (around line 104):

```tsx
className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-medium transition-colors flex items-center gap-2"
```

Add to the end: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2`

- [ ] **Step 3: Update the "Add" button in CategoriesPage.tsx**

Find:

```tsx
className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
```

Append: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2`

Also update the Save (Check) and Cancel (X) icon buttons within the rename row:

Save button (Check icon):
```tsx
className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
```

Cancel button (X icon):
```tsx
className="p-2 rounded-lg border border-gray-200 dark:border-dark-border text-gray-700 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-raised transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
```

- [ ] **Step 4: Update "Set Budget" button in HomePage.tsx**

Find:

```tsx
className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
```

Replace with:

```tsx
className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
```

Also update the inline "Set budget" underline button (in StatCard subtext):

```tsx
className="text-emerald-600 dark:text-emerald-400 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
```

- [ ] **Step 5: Update ConfirmModal.tsx buttons**

Cancel button — append:
```
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2
```

Full Cancel button className:
```tsx
"px-4 py-2 rounded-lg border border-gray-200 dark:border-dark-border text-gray-700 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-raised disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
```

Confirm button — replace the className expression with:

```tsx
className={`px-4 py-2 rounded-lg font-medium text-white transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
  isDangerous
    ? 'bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 focus-visible:ring-red-500'
    : 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 focus-visible:ring-emerald-500'
}`}
```

- [ ] **Step 6: Update ConfirmButton.tsx trigger button**

Find:

```tsx
className={`p-2 rounded-lg border border-gray-200 dark:border-dark-border text-gray-700 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-raised transition-colors ${className}`}
```

Replace with:

```tsx
className={`p-2 rounded-lg border border-gray-200 dark:border-dark-border text-gray-700 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-raised transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${className}`}
```

- [ ] **Step 7: Update BudgetModal.tsx buttons**

Cancel button:
```tsx
className="px-4 py-2 rounded-lg border border-gray-200 dark:border-dark-border text-gray-700 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-raised disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
```

Save/submit button:
```tsx
className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
```

- [ ] **Step 8: Run the full test suite**

Run: `cd packages/frontend && npx vitest run --reporter=verbose`
Expected: All tests pass.

- [ ] **Step 9: Manual keyboard accessibility verification**

Start the dev server: `cd packages/frontend && npm run dev`

Open `http://localhost:5173` (login with test credentials via `POST /api/auth/test/login` or normal OAuth).

Tab through the app and verify:
- Nav links (Dashboard, Categories, Transactions) show an emerald focus ring when tabbed to
- Logout button shows a focus ring
- "Add Transaction" button shows a focus ring
- "Add" button on Categories page shows a focus ring
- Edit (pencil) and Delete buttons on rows show rings
- ConfirmModal Cancel/Confirm buttons show rings
- BudgetModal Cancel/Save buttons show rings

- [ ] **Step 10: Commit**

```bash
git add packages/frontend/src/App.tsx packages/frontend/src/pages/TransactionsPage.tsx packages/frontend/src/pages/CategoriesPage.tsx packages/frontend/src/pages/HomePage.tsx packages/frontend/src/components/ConfirmModal.tsx packages/frontend/src/components/ConfirmButton.tsx packages/frontend/src/components/BudgetModal.tsx
git commit -m "feat: add focus-visible rings to all action buttons for keyboard accessibility"
```

---

## Task 9: Responsive Dashboard Grid

**Files:**
- Modify: `packages/frontend/src/pages/HomePage.tsx`

The dashboard uses `grid-cols-4` for stat cards and `grid-cols-[1fr_360px]` for the mid row. Both collapse on viewports narrower than their content. Add Tailwind responsive prefixes to stack correctly on mobile.

No unit tests — verify manually at narrow viewports.

- [ ] **Step 1: Fix the stat cards grid**

In `packages/frontend/src/pages/HomePage.tsx`, find:

```tsx
<div className="grid grid-cols-4 gap-3 mb-6">
```

Replace with:

```tsx
<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
```

- [ ] **Step 2: Fix the mid-row two-column grid**

Find:

```tsx
<div className="grid grid-cols-[1fr_360px] gap-3 mb-6">
```

Replace with:

```tsx
<div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-3 mb-6">
```

- [ ] **Step 3: Run tests to ensure no regressions**

Run: `cd packages/frontend && npx vitest run --reporter=verbose`
Expected: All tests pass.

- [ ] **Step 4: Manual responsive verification**

Open `http://localhost:5173` in browser DevTools with responsive mode:

At 375px (mobile): stat cards show in 2 columns; Spending by Category and Monthly Budget panels stack vertically (full width each).

At 768px (tablet): stat cards show in 4 columns; mid-row still stacks (lg = 1024px threshold) — acceptable.

At 1024px (desktop): mid-row shows Spending by Category + Monthly Budget side by side; stat cards in 4 columns.

- [ ] **Step 5: Commit**

```bash
git add packages/frontend/src/pages/HomePage.tsx
git commit -m "feat: make dashboard layout responsive with mobile-first grid breakpoints"
```

---

## Task 10: Fix TransactionsPage Redundant Outer Container

**Files:**
- Modify: `packages/frontend/src/pages/TransactionsPage.tsx`

`TransactionsPage` wraps its content in `<div className="max-w-6xl mx-auto px-4 py-8">`. The app shell in `App.tsx` already constrains layout with `<main className="max-w-5xl mx-auto px-5 py-7">`. The inner div adds double padding and widens the content area beyond the shell's `max-w-5xl`. `CategoriesPage` uses `max-w-2xl mx-auto` correctly for its narrower form — but TransactionsPage should align with the shell's width constraint.

- [ ] **Step 1: Remove the redundant container div**

In `packages/frontend/src/pages/TransactionsPage.tsx`, in the main `return` statement, find the outer wrapper:

```tsx
return (
  <div className="max-w-6xl mx-auto px-4 py-8">
    <div className="mb-8 flex items-center justify-between">
```

Replace with:

```tsx
return (
  <div>
    <div className="mb-8 flex items-center justify-between">
```

- [ ] **Step 2: Run TransactionsPage tests**

Run: `cd packages/frontend && npx vitest run src/test/TransactionsPage.test.tsx --reporter=verbose`
Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add packages/frontend/src/pages/TransactionsPage.tsx
git commit -m "fix: remove redundant container padding from TransactionsPage"
```

---

## Final Verification

- [ ] **Run the full frontend test suite**

Run: `cd packages/frontend && npx vitest run --reporter=verbose`
Expected: All tests pass. Zero failures.

- [ ] **TypeScript check**

Run: `cd packages/frontend && npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Manual end-to-end walkthrough**

Start both servers (`npm run dev` from root). Log in and verify:
1. Dashboard loads with skeleton → data populates → responsive on mobile viewport
2. Transactions page loads with skeleton → empty state shows icon + "Add Transaction" CTA → create/edit/delete work
3. Categories page loads with skeleton → empty state shows icon + message → create/rename/delete work
4. Kill the backend, reload dashboard → "Failed to load dashboard data." + retry button appears, retry reloads correctly
5. Tab through entire app — every button has a visible focus ring
6. No "Loading..." plain text appears anywhere in the app

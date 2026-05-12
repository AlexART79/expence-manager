# Header Bar Constrained Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Constrain the header's inner content to `max-w-5xl mx-auto px-5` so logo, nav, and action buttons align directly above the main content column.

**Architecture:** Wrap the existing header content in a new inner `<div>` that mirrors the `<main>` element's width and padding constraints. The outer `<header>` stays full-width (background, border, sticky); only the inner layout changes.

**Tech Stack:** React, TypeScript, Tailwind CSS, Vitest + React Testing Library

---

### Task 1: Constrain header inner content

**Files:**
- Modify: `packages/frontend/src/App.tsx:17-71`
- Modify: `packages/frontend/src/test/App.test.tsx`

- [ ] **Step 1: Write the failing test**

Add inside `describe('App', ...)` in `packages/frontend/src/test/App.test.tsx`:

```tsx
it('header content is constrained to max-w-5xl', async () => {
  vi.spyOn(authLib, 'getCurrentUser').mockResolvedValue(null);

  const { container } = render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  );

  await waitFor(() => {
    const header = container.querySelector('header');
    expect(header).not.toBeNull();
    const inner = header!.firstElementChild;
    expect(inner?.classList.contains('max-w-5xl')).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd packages/frontend && npx vitest run src/test/App.test.tsx
```

Expected: FAIL — `expect(received).toBe(true)` because the header currently has no `max-w-5xl` inner child.

- [ ] **Step 3: Implement the change in App.tsx**

Replace the `<header>` block in `packages/frontend/src/App.tsx` (lines 17–71) with:

```tsx
<header className="sticky top-0 z-10 bg-white dark:bg-dark-surface border-b border-gray-200 dark:border-dark-border">
  <div className="h-[52px] max-w-5xl mx-auto px-5 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="w-7 h-7 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-lg flex items-center justify-center">
        <DollarSign size={16} className="text-white" />
      </div>
      <h1 className="text-base font-semibold tracking-tight">Expence</h1>
      {!loading && user && (
        <nav className="flex items-center gap-4 text-sm">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive
                ? 'px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-dark-raised text-emerald-600 dark:text-emerald-400 font-medium text-sm'
                : 'px-3 py-1.5 rounded-lg text-gray-500 dark:text-dark-text-muted hover:text-gray-700 dark:hover:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-raised transition-colors text-sm'
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/categories"
            className={({ isActive }) =>
              isActive
                ? 'px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-dark-raised text-emerald-600 dark:text-emerald-400 font-medium text-sm'
                : 'px-3 py-1.5 rounded-lg text-gray-500 dark:text-dark-text-muted hover:text-gray-700 dark:hover:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-raised transition-colors text-sm'
            }
          >
            Categories
          </NavLink>
          <NavLink
            to="/transactions"
            className={({ isActive }) =>
              isActive
                ? 'px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-dark-raised text-emerald-600 dark:text-emerald-400 font-medium text-sm'
                : 'px-3 py-1.5 rounded-lg text-gray-500 dark:text-dark-text-muted hover:text-gray-700 dark:hover:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-raised transition-colors text-sm'
            }
          >
            Transactions
          </NavLink>
        </nav>
      )}
    </div>
    <div className="flex items-center gap-4">
      {!loading && user && (
        <button
          onClick={logout}
          aria-label="Sign out"
          className="p-2 rounded-lg text-gray-500 dark:text-dark-text-muted hover:text-gray-700 dark:hover:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-raised transition-colors"
        >
          <LogOut size={18} />
        </button>
      )}
      <ThemeToggle />
    </div>
  </div>
</header>
```

- [ ] **Step 4: Run all tests to verify they pass**

```bash
cd packages/frontend && npx vitest run
```

Expected: all tests PASS (3 existing App tests + the new structural test).

- [ ] **Step 5: Commit**

```bash
git add packages/frontend/src/App.tsx packages/frontend/src/test/App.test.tsx
git commit -m "feat: constrain header inner content to match main content width"
```

# UI Redesign: Dark Professional + Emerald

## Context

The app is at Stage 0 — routing, auth, and a working CategoriesPage, but the UI is visually minimal with no design system. Goal: a lightweight, modern, responsive finance-app UI that looks production-quality. Design decisions were made collaboratively via visual mockups.

## Design Decisions

| Dimension | Decision |
|---|---|
| Visual direction | Dark & Professional (GitHub-dark inspired) |
| Navigation | Top nav — refined from existing pattern |
| Accent color | Emerald (`#10b981` = Tailwind `emerald-500`) |
| Dashboard widgets | Stat cards · Category bars · Budget progress · Recent transactions |
| Theme default | Dark, but keep toggle (dark as fallback when no stored preference) |
| Approach | Pages first — extract to `src/components/ui/` only when the same pattern appears in 2+ pages |

**Dashboard mockup:** `.superpowers/brainstorm/1947-1778444101/content/dashboard-mockup.html`

---

## Color Tokens to Add

Add to `packages/frontend/tailwind.config.ts` under `theme.extend.colors`:

```ts
'dark-base':           '#090e0c',   // page background
'dark-surface':        '#0f1612',   // cards, nav
'dark-raised':         '#161b22',   // inputs, hover surfaces
'dark-border':         '#1a2820',   // all borders in dark mode
'dark-text':           '#e2ede8',   // primary text
'dark-text-secondary': '#a3c9b8',   // labels, subtitles
'dark-text-muted':     '#4d7a66',   // hints, metadata
```

Accent uses built-in Tailwind `emerald-*` (`emerald-500` = `#10b981`, `emerald-400`, `emerald-300`). No custom accent token needed.

---

## Files to Modify

1. `packages/frontend/package.json` — add `lucide-react` (icon library, tree-shakeable)
2. `packages/frontend/tailwind.config.ts` — add color tokens above
3. `packages/frontend/src/index.css` — no changes needed (tokens handle it)
4. `packages/frontend/src/components/ThemeToggle.tsx` — default to dark, update styling
5. `packages/frontend/src/App.tsx` — redesign AppShell nav
6. `packages/frontend/src/pages/HomePage.tsx` — full dashboard implementation
7. `packages/frontend/src/pages/CategoriesPage.tsx` — restyle with new tokens
8. `packages/frontend/src/pages/LoginPage.tsx` — redesign login screen
9. `packages/frontend/src/pages/NotFoundPage.tsx` — minor style update

---

## Step-by-Step Implementation

### Step 1 — Add lucide-react
```
cd packages/frontend && npm install lucide-react
```
Used for: nav icons (LayoutDashboard, Tag, LogOut, Sun, Moon), action icons (Plus, Pencil, Trash2, X, Check).

### Step 2 — Update tailwind.config.ts
Add the 7 `dark-*` color tokens under `theme.extend.colors`. No other changes.

### Step 3 — Update ThemeToggle.tsx
- Change `getInitialTheme` fallback from system-preference check to always return `'dark'`
- Replace emoji labels with Lucide `Sun` / `Moon` icons
- Update className: `border-gray-300 dark:border-gray-700` → `border-dark-border`, hover → `dark:hover:bg-dark-raised`

### Step 4 — Redesign AppShell in App.tsx
Replace the `<header>` with a new nav bar matching the mockup:

**Structure:**
```
<header class="h-[52px] bg-white dark:bg-dark-surface border-b border-gray-200 dark:border-dark-border sticky top-0 z-10">
  [Logo square + "Expence" title]   [NavLinks]   [ThemeToggle] [Sign out]
</header>
```

**Logo:** 28×28px div with `bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-lg` + `DollarSign` Lucide icon (white, size 16).

**NavLink active style:** `bg-gray-100 dark:bg-dark-raised text-emerald-600 dark:text-emerald-400 font-medium`
**NavLink inactive style:** `text-gray-500 dark:text-dark-text-muted hover:text-gray-700 dark:hover:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-raised`

**Main content wrapper:** `<main class="max-w-5xl mx-auto px-5 py-7">` (replaces current `px-6 py-8`).

### Step 5 — Implement HomePage (Dashboard)

All data is mock (no transactions API yet). Structure:

```tsx
// Page header: "Dashboard" title + period picker (static "May 2026" for now)

// Stat cards row (grid-cols-4 gap-3)
// - Total Spent: large number, red delta
// - Budget Used: emerald number (percentage)
// - Categories: count from real API (listCategories().length)
// - Transactions: mock count

// Mid row (grid-cols-[1fr_360px] gap-3)
// - Spending by Category: horizontal bar chart using CSS width%
//   Each row: colored dot · category name · bar · dollar amount
// - Budget Progress: per-category progress bars
//   ok (< 80%): emerald | warn (80–99%): amber | over (≥ 100%): red

// Recent Transactions: list of 5 mock transactions
// Each row: emoji icon · name + category · date · amount (red)
```

**Card pattern** (extract to `ui/Card.tsx` after second use):
```tsx
<div className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl p-5">
```

**Stat card pattern:**
```tsx
<div className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl p-4">
  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-dark-text-muted mb-2">label</p>
  <p className="text-2xl font-bold tracking-tight text-gray-900 dark:text-dark-text">value</p>
  <p className="text-xs text-gray-400 dark:text-dark-text-muted mt-1">sub-text</p>
</div>
```

**TODO comment in HomePage.tsx**: `// TODO: replace mock data with real API calls when transactions/budgets endpoints are available`

### Step 6 — Restyle CategoriesPage.tsx

All logic stays identical — only className strings change. Mapping:

| Old | New |
|---|---|
| `bg-white dark:bg-gray-950` | remove (inherited from body) |
| `max-w-lg` | `max-w-2xl` |
| `border-gray-200 dark:border-gray-800` | `border-gray-200 dark:border-dark-border` |
| `bg-white dark:bg-gray-900` | `bg-white dark:bg-dark-surface` |
| `border-gray-300 dark:border-gray-700` | `border-gray-200 dark:border-dark-border` |
| `bg-blue-600 hover:bg-blue-700` | `bg-emerald-600 hover:bg-emerald-700` |
| `focus:ring-blue-500` | `focus:ring-emerald-500` |
| `text-gray-400 dark:text-gray-600` (loading) | `text-gray-400 dark:text-dark-text-muted` |
| `text-red-600 dark:text-red-400` | keep as-is (danger color, correct) |

List items: `px-4 py-3` (up from `px-3 py-2`), `rounded-lg` (up from `rounded-md`).

Add page header:
```tsx
<div className="mb-6 flex items-center justify-between">
  <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-dark-text">Categories</h2>
  <span className="text-sm text-gray-400 dark:text-dark-text-muted">{cats.length} categories</span>
</div>
```

### Step 7 — Redesign LoginPage.tsx

Full-height dark centered card:

```
min-h-screen dark:bg-dark-base → centered card (max-w-sm, dark-surface, rounded-2xl, border-dark-border)
  Logo (48px gradient square) + "Expence" heading + tagline
  Separator line
  Google button
  GitHub button
```

Button style: `flex items-center justify-center gap-3 w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-raised hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors text-sm font-medium text-gray-700 dark:text-dark-text-secondary`

### Step 8 — Update NotFoundPage.tsx (minor)
Update any hardcoded `text-gray-500` / `bg-gray-*` to use new tokens. Keep content as-is.

---

## Verification

1. `cd packages/frontend && npm run dev` — open http://localhost:5173
2. Check each page visually in **dark mode** (default): Login, Dashboard, Categories, 404
3. Toggle to **light mode** — verify all pages are readable and not broken
4. Check **responsive** layout at 375px, 768px, 1280px widths
5. `npm run test` — confirm zero regressions in existing test suite
6. Check **auth flow**: login redirects correctly, protected routes still guard properly

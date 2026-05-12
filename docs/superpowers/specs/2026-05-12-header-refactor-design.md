# Header Refactor — Constrained Inner Layout

**Date:** 2026-05-12

## Goal

Shrink the visual footprint of the header bar so all header elements (logo, nav, theme toggle, logout) appear directly above the main content column rather than spanning the full viewport width.

## Design

**One structural change in `packages/frontend/src/App.tsx`.**

The outer `<header>` element retains its full-width background, bottom border, and sticky positioning. A new inner `<div>` wraps all header content and applies `max-w-5xl mx-auto px-5` — identical to the `<main>` element — so the header elements align with the page body.

Before:
```jsx
<header className="h-[52px] sticky top-0 z-10 flex items-center justify-between px-6 bg-white dark:bg-dark-surface border-b border-gray-200 dark:border-dark-border">
  {/* logo + nav + actions */}
</header>
```

After:
```jsx
<header className="sticky top-0 z-10 bg-white dark:bg-dark-surface border-b border-gray-200 dark:border-dark-border">
  <div className="h-[52px] max-w-5xl mx-auto px-5 flex items-center justify-between">
    {/* logo + nav + actions */}
  </div>
</header>
```

## Scope

- **File changed:** `packages/frontend/src/App.tsx` only
- **No other files** need modification
- Sticky, background, border, dark mode, height, and all interactive elements are unchanged

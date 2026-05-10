# Deletion Confirmation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a reusable ConfirmButton component that requires explicit confirmation before executing destructive actions, and integrate it into CategoriesPage for category deletion.

**Architecture:** ConfirmButton is a stateful component that manages two UI states — default (icon button) and confirming (text buttons with message). It handles async operations, errors, and keyboard shortcuts. CategoriesPage uses it to wrap the delete action. AGENTS.md documents the pattern for future deletions.

**Tech Stack:** React (hooks), TypeScript, Tailwind CSS, Lucide React icons

---

## Task 1: Create ConfirmButton Component

**Files:**
- Create: `packages/frontend/src/components/ConfirmButton.tsx`

- [ ] **Step 1: Create the ConfirmButton component file with TypeScript types and implementation**

Create `packages/frontend/src/components/ConfirmButton.tsx`:

```tsx
import { useState, useRef, useEffect } from 'react';
import type { ComponentType } from 'react';
import { X } from 'lucide-react';

interface ConfirmButtonProps {
  icon: ComponentType<{ size: number }>;
  iconLabel: string;
  onConfirm: () => Promise<void>;
  confirmMessage?: string;
  confirmText?: string;
  isDangerous?: boolean;
  className?: string;
}

export default function ConfirmButton({
  icon: Icon,
  iconLabel,
  onConfirm,
  confirmMessage = 'Are you sure?',
  confirmText = 'Confirm',
  isDangerous = true,
  className = '',
}: ConfirmButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleConfirm = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await onConfirm();
      setIsConfirming(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsConfirming(false);
    setError(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isConfirming) {
        handleCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isConfirming]);

  if (isConfirming) {
    return (
      <div ref={containerRef} className="flex items-center gap-2 flex-col">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700 dark:text-dark-text-secondary">
            {confirmMessage}
          </span>
          <button
            onClick={handleCancel}
            disabled={isLoading}
            aria-label="Cancel"
            className="px-2 py-1 rounded text-xs border border-gray-200 dark:border-dark-border text-gray-700 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-raised disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            aria-label={confirmText}
            className={`px-2 py-1 rounded text-xs font-medium text-white transition-colors disabled:opacity-50 ${
              isDangerous
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {isLoading ? 'Loading...' : confirmText}
          </button>
        </div>
        {error && (
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsConfirming(true)}
      aria-label={iconLabel}
      className={`p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors ${className}`}
    >
      <Icon size={16} />
    </button>
  );
}
```

- [ ] **Step 2: Verify the component compiles with `npm run build`**

Run:
```bash
cd packages/frontend && npm run build
```

Expected: Build succeeds with no TypeScript errors.

---

## Task 2: Integrate ConfirmButton into CategoriesPage

**Files:**
- Modify: `packages/frontend/src/pages/CategoriesPage.tsx`

- [ ] **Step 1: Update CategoriesPage to import and use ConfirmButton**

Open `packages/frontend/src/pages/CategoriesPage.tsx` and replace the import and handleDelete function + button with ConfirmButton usage.

Replace lines 1-10 (imports):
```tsx
import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import {
  listCategories,
  createCategory,
  renameCategory,
  deleteCategory,
  type Category,
} from '../lib/categories.ts';
import { ApiError } from '../lib/apiClient.ts';
import ConfirmButton from '../components/ConfirmButton.tsx';
```

Replace lines 38-41 (remove handleDelete):
Delete the entire `handleDelete` function.

Replace lines 138-145 (replace delete button with ConfirmButton):

Find this code:
```tsx
                  <button
                    onClick={() => handleDelete(cat.id)}
                    aria-label="Delete"
                    className="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
```

Replace with:
```tsx
                  <ConfirmButton
                    icon={Trash2}
                    iconLabel="Delete"
                    onConfirm={async () => {
                      await deleteCategory(cat.id);
                      setCats((prev) => prev.filter((c) => c.id !== cat.id));
                    }}
                    confirmMessage="Delete this category?"
                  />
```

- [ ] **Step 2: Verify CategoriesPage compiles**

Run:
```bash
cd packages/frontend && npm run build
```

Expected: Build succeeds, no TypeScript errors.

- [ ] **Step 3: Test in browser**

Start the dev server:
```bash
npm run dev
```

Navigate to the Categories page. Verify:
1. Delete button shows trash icon normally
2. Clicking trash icon replaces it with "Delete this category? Cancel Delete"
3. Clicking Cancel returns to trash icon
4. Clicking Delete removes the category from the list
5. Pressing Escape while confirming returns to trash icon

Expected: All interactions work smoothly without page refresh.

- [ ] **Step 4: Commit**

```bash
git add packages/frontend/src/components/ConfirmButton.tsx packages/frontend/src/pages/CategoriesPage.tsx
git commit -m "feat: add confirmation dialog for category deletion"
```

---

## Task 3: Document Pattern in AGENTS.md

**Files:**
- Modify: `AGENTS.md`

- [ ] **Step 1: Check current AGENTS.md structure**

Read the file to understand existing guidelines:
```bash
head -50 AGENTS.md
```

Look for sections on component patterns or UI guidelines. Note the format and style used.

- [ ] **Step 2: Add deletion confirmation guideline to AGENTS.md**

Open `AGENTS.md` and add this section (find an appropriate place, preferably under a "Component Patterns" or "UI Guidelines" section, or add it as a new section before the file ends):

```markdown
## Deletion & Destructive Actions

**Rule:** All destructive actions (delete, clear, reset) MUST require explicit user confirmation before proceeding. Never implement a delete button that acts immediately.

**Implementation:** Use the `ConfirmButton` component from `packages/frontend/src/components/ConfirmButton.tsx`.

**Example:**
```tsx
import ConfirmButton from '../components/ConfirmButton';

<ConfirmButton
  icon={Trash2}
  iconLabel="Delete"
  onConfirm={async () => {
    await deleteItem(id);
    setItems(prev => prev.filter(i => i.id !== id));
  }}
  confirmMessage="Delete this item?"
/>
```

**When to use:** Any action that removes data:
- Delete categories, transactions, budgets, accounts
- Clear all data
- Archive records
- Reset settings

**Component API:**
- `icon`: Lucide React icon component
- `iconLabel`: Aria label for accessibility
- `onConfirm`: Async function executed on confirmation
- `confirmMessage`: Optional message shown in confirmation state (default: "Are you sure?")
- `confirmText`: Optional button text (default: "Confirm")
- `isDangerous`: If true, uses red styling (default: true)

**Error handling:** If `onConfirm()` throws, the error displays below the buttons. Buttons remain enabled for retry.
```

- [ ] **Step 2: Verify AGENTS.md syntax**

Open the file and verify:
- Markdown formatting is correct
- Section fits with existing content
- No duplicate sections

- [ ] **Step 3: Commit**

```bash
git add AGENTS.md
git commit -m "docs: add deletion confirmation guideline to AGENTS.md"
```

---

## Summary

After completing all tasks:
- ✅ ConfirmButton component created and tested
- ✅ CategoriesPage integrated with ConfirmButton
- ✅ AGENTS.md documents pattern for future development
- ✅ All changes committed

The deletion confirmation pattern is now in place for categories and documented for reuse across the app.

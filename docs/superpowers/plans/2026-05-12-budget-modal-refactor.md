# Budget Modal Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the inline budget set/edit form in `HomePage` into a standalone `BudgetModal` component that renders as a centered overlay.

**Architecture:** Create `BudgetModal.tsx` following the same overlay pattern as `ConfirmModal.tsx`, with internal form state (input, saving, error). `HomePage` keeps only the `budgetFormOpen` boolean and passes `budget`, `month`, `onClose`, and `onSuccess` to the modal.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Vitest + React Testing Library

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `packages/frontend/src/components/BudgetModal.tsx` | Modal overlay + budget form |
| Create | `packages/frontend/src/test/BudgetModal.test.tsx` | Unit tests for BudgetModal |
| Modify | `packages/frontend/src/pages/HomePage.tsx` | Remove inline form, add `<BudgetModal>` |

---

### Task 1: Create BudgetModal with TDD

**Files:**
- Create: `packages/frontend/src/components/BudgetModal.tsx`
- Create: `packages/frontend/src/test/BudgetModal.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `packages/frontend/src/test/BudgetModal.test.tsx`:

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import BudgetModal from '../components/BudgetModal.tsx';
import { setBudget } from '../lib/budgets.ts';
import type { MonthlyBudget } from '../lib/budgets.ts';

vi.mock('../lib/budgets.ts', () => ({
  setBudget: vi.fn(),
}));

const mockSetBudget = vi.mocked(setBudget);

const existingBudget: MonthlyBudget = {
  id: 1,
  userId: 1,
  month: '2026-05',
  amount: 750,
  currency: 'USD',
  createdAt: '',
  updatedAt: '',
};

function renderModal(overrides: Partial<Parameters<typeof BudgetModal>[0]> = {}) {
  const props = {
    isOpen: true,
    month: '2026-05',
    budget: null,
    onClose: vi.fn(),
    onSuccess: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
  return { ...render(<BudgetModal {...props} />), props };
}

describe('BudgetModal', () => {
  beforeEach(() => {
    mockSetBudget.mockResolvedValue({ ...existingBudget, amount: 1000 });
  });

  it('renders nothing when isOpen is false', () => {
    renderModal({ isOpen: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders the dialog when isOpen is true', () => {
    renderModal();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('shows "Set Monthly Budget" title when no budget exists', () => {
    renderModal({ budget: null });
    expect(screen.getByText('Set Monthly Budget')).toBeInTheDocument();
  });

  it('shows "Update Monthly Budget" title when budget exists', () => {
    renderModal({ budget: existingBudget });
    expect(screen.getByText('Update Monthly Budget')).toBeInTheDocument();
  });

  it('pre-fills input with existing budget amount', () => {
    renderModal({ budget: existingBudget });
    expect(screen.getByRole('spinbutton')).toHaveValue(750);
  });

  it('shows validation error when submitting with no amount', async () => {
    const user = userEvent.setup();
    renderModal();
    await user.click(screen.getByRole('button', { name: /save/i }));
    expect(screen.getByText('Enter a positive amount')).toBeInTheDocument();
    expect(mockSetBudget).not.toHaveBeenCalled();
  });

  it('calls setBudget with correct args and closes on success', async () => {
    const user = userEvent.setup();
    const { props } = renderModal();
    await user.type(screen.getByRole('spinbutton'), '1200');
    await user.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() =>
      expect(mockSetBudget).toHaveBeenCalledWith('2026-05', { amount: 1200, currency: 'USD' })
    );
    expect(props.onSuccess).toHaveBeenCalledOnce();
    expect(props.onClose).toHaveBeenCalledOnce();
  });

  it('shows API error message on failure', async () => {
    mockSetBudget.mockRejectedValueOnce(new Error('Network error'));
    const user = userEvent.setup();
    renderModal();
    await user.type(screen.getByRole('spinbutton'), '500');
    await user.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() =>
      expect(screen.getByText('Failed to save budget. Try again.')).toBeInTheDocument()
    );
  });

  it('calls onClose when Cancel is clicked', async () => {
    const user = userEvent.setup();
    const { props } = renderModal();
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(props.onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();
    const { props } = renderModal();
    await user.click(screen.getByTestId('budget-modal-backdrop'));
    expect(props.onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when Escape is pressed', async () => {
    const user = userEvent.setup();
    const { props } = renderModal();
    await user.keyboard('{Escape}');
    expect(props.onClose).toHaveBeenCalledOnce();
  });

  it('does not close via Escape while saving', async () => {
    mockSetBudget.mockImplementation(() => new Promise(() => {}));
    const user = userEvent.setup();
    const { props } = renderModal();
    await user.type(screen.getByRole('spinbutton'), '500');
    await user.click(screen.getByRole('button', { name: /save/i }));
    await user.keyboard('{Escape}');
    expect(props.onClose).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run from `packages/frontend`:
```
npx vitest run src/test/BudgetModal.test.tsx
```

Expected: FAIL — `Cannot find module '../components/BudgetModal.tsx'`

- [ ] **Step 3: Create BudgetModal.tsx**

Create `packages/frontend/src/components/BudgetModal.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react';
import { setBudget, type MonthlyBudget } from '../lib/budgets.ts';

interface BudgetModalProps {
  isOpen: boolean;
  month: string;
  budget: MonthlyBudget | null;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

export default function BudgetModal({ isOpen, month, budget, onClose, onSuccess }: BudgetModalProps) {
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const onCloseRef = useRef(onClose);
  const savingRef = useRef(saving);
  useEffect(() => { onCloseRef.current = onClose; });
  useEffect(() => { savingRef.current = saving; });

  useEffect(() => {
    if (isOpen) {
      setInput(budget ? String(budget.amount) : '');
      setError('');
    }
  }, [isOpen, budget]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !savingRef.current) onCloseRef.current();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(input);
    if (isNaN(amount) || amount <= 0) {
      setError('Enter a positive amount');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await setBudget(month, { amount, currency: 'USD' });
      await onSuccess();
      onClose();
    } catch {
      setError('Failed to save budget. Try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      data-testid="budget-modal-backdrop"
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={saving ? undefined : onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Budget"
        className="bg-white dark:bg-dark-surface rounded-lg shadow-xl max-w-sm w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold text-gray-900 dark:text-dark-text mb-4">
          {budget ? 'Update Monthly Budget' : 'Set Monthly Budget'}
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm text-gray-400 dark:text-dark-text-muted">USD $</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={budget ? String(budget.amount) : '1000'}
              className="w-40 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-raised text-gray-900 dark:text-dark-text rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              disabled={saving}
              autoFocus
            />
          </div>
          {error && (
            <p className="text-xs text-red-500 mb-3">{error}</p>
          )}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-dark-border text-gray-700 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-raised disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run from `packages/frontend`:
```
npx vitest run src/test/BudgetModal.test.tsx
```

Expected: All 12 tests PASS

- [ ] **Step 5: Commit**

```bash
git add packages/frontend/src/components/BudgetModal.tsx packages/frontend/src/test/BudgetModal.test.tsx
git commit -m "feat: add BudgetModal component with tests"
```

---

### Task 2: Refactor HomePage to use BudgetModal

**Files:**
- Modify: `packages/frontend/src/pages/HomePage.tsx`

- [ ] **Step 1: Add the BudgetModal import**

In `packages/frontend/src/pages/HomePage.tsx`, add this import after line 10 (after the budgets imports block):

```tsx
import BudgetModal from '../components/BudgetModal.tsx';
```

- [ ] **Step 2: Remove budget form state**

Remove these three state declarations (currently lines 78–80):

```tsx
const [budgetInput, setBudgetInput] = useState('');
const [budgetSaving, setBudgetSaving] = useState(false);
const [budgetError, setBudgetError] = useState('');
```

- [ ] **Step 3: Remove handleSetBudget and simplify open/close**

Remove the entire `handleSetBudget` function (currently lines 109–128):

```tsx
async function handleSetBudget(e: React.FormEvent) {
  e.preventDefault();
  const amount = parseFloat(budgetInput);
  if (isNaN(amount) || amount <= 0) {
    setBudgetError('Enter a positive amount');
    return;
  }
  setBudgetSaving(true);
  setBudgetError('');
  try {
    await setBudget(month, { amount, currency: 'USD' });
    setBudgetFormOpen(false);
    setBudgetInput('');
    await loadData();
  } catch {
    setBudgetError('Failed to save budget. Try again.');
  } finally {
    setBudgetSaving(false);
  }
}
```

Replace `openBudgetForm` (currently lines 130–134) with the simplified version:

```tsx
// OLD — remove this:
function openBudgetForm() {
  setBudgetInput(budget ? String(budget.amount) : '');
  setBudgetError('');
  setBudgetFormOpen(true);
}

// NEW — replace with:
function openBudgetForm() {
  setBudgetFormOpen(true);
}
```

Remove the entire `closeBudgetForm` function (currently lines 136–140):

```tsx
function closeBudgetForm() {
  setBudgetFormOpen(false);
  setBudgetInput('');
  setBudgetError('');
}
```

- [ ] **Step 4: Remove the inline form JSX**

Remove the entire inline form block (currently lines 240–280):

```tsx
{/* Budget set/edit inline form */}
{budgetFormOpen && (
  <div className="mb-6 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl p-5">
    <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-text mb-3">
      {budget ? 'Update Monthly Budget' : 'Set Monthly Budget'}
    </h3>
    <form onSubmit={handleSetBudget} className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400 dark:text-dark-text-muted">USD $</span>
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={budgetInput}
          onChange={(e) => setBudgetInput(e.target.value)}
          placeholder={budget ? String(budget.amount) : '1000'}
          className="w-40 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-raised text-gray-900 dark:text-dark-text rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          disabled={budgetSaving}
          autoFocus
        />
      </div>
      {budgetError && (
        <span className="text-xs text-red-500">{budgetError}</span>
      )}
      <button
        type="submit"
        disabled={budgetSaving}
        className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
      >
        {budgetSaving ? 'Saving...' : 'Save'}
      </button>
      <button
        type="button"
        onClick={closeBudgetForm}
        className="px-4 py-2 text-gray-500 dark:text-dark-text-secondary rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-dark-raised"
      >
        Cancel
      </button>
    </form>
  </div>
)}
```

- [ ] **Step 5: Add BudgetModal to the JSX**

At the end of the returned JSX in `HomePage`, just before the final closing `</div>`, add:

```tsx
<BudgetModal
  isOpen={budgetFormOpen}
  month={month}
  budget={budget}
  onClose={() => setBudgetFormOpen(false)}
  onSuccess={loadData}
/>
```

- [ ] **Step 6: Also remove the now-unused `setBudget` import**

In the imports at the top of `HomePage.tsx`, remove `setBudget` from the budgets import (since the modal now handles it directly):

```tsx
// OLD:
import {
  getBudgetSummary,
  getBudget,
  setBudget,
  type BudgetSummary,
  type MonthlyBudget,
} from '../lib/budgets.ts';

// NEW:
import {
  getBudgetSummary,
  getBudget,
  type BudgetSummary,
  type MonthlyBudget,
} from '../lib/budgets.ts';
```

- [ ] **Step 7: Run the full test suite**

Run from `packages/frontend`:
```
npm test
```

Expected: All tests PASS (no regressions)

- [ ] **Step 8: Commit**

```bash
git add packages/frontend/src/pages/HomePage.tsx
git commit -m "refactor: replace inline budget form with BudgetModal"
```

---

## Self-Review

**Spec coverage:**
- Budget form opens as a centered modal overlay instead of an inline section
- "Set Monthly Budget" title shown when no budget exists; "Update Monthly Budget" when editing
- All three trigger points in `HomePage` still work: stat card "Set budget" link, Monthly Budget panel "Edit"/"Set budget" button, panel "Set Budget" button
- Input pre-fills with existing budget amount when editing
- ESC closes the modal (blocked during save)
- Backdrop click closes the modal (blocked during save)
- Form validation, saving state, and API error handling all preserved
- `onSuccess` triggers data refresh in `HomePage` after successful save

**Placeholder scan:** No TODOs, TBDs, or vague steps. All code blocks are complete.

**Type consistency:** `MonthlyBudget` shape (`id: number, userId: number, month, amount, currency, createdAt, updatedAt`) used correctly in tests. `onSuccess: () => Promise<void>` matches `loadData` return type. `setBudget(month, { amount, currency: 'USD' })` matches `BudgetInput` interface.

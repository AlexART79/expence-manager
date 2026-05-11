# Confirm Modal Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the inline confirmation state in `ConfirmButton` with a centered modal dialog, without changing its external API.

**Architecture:** Extract the confirmation UI into a new `ConfirmModal` component (a centered overlay dialog). Refactor `ConfirmButton` to render `ConfirmModal` when the user clicks the action button, instead of expanding in-place. All existing `ConfirmButton` usages and tests continue to work unchanged.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Vitest + React Testing Library

---

## File Map

| Action   | File                                                              | Responsibility                               |
|----------|-------------------------------------------------------------------|----------------------------------------------|
| Create   | `packages/frontend/src/components/ConfirmModal.tsx`              | Reusable centered overlay confirmation dialog |
| Modify   | `packages/frontend/src/components/ConfirmButton.tsx`             | Use `ConfirmModal` instead of inline confirm UI |
| Create   | `packages/frontend/src/test/ConfirmModal.test.tsx`               | Unit tests for `ConfirmModal` in isolation   |
| No-touch | `packages/frontend/src/test/TransactionsPage.test.tsx`           | Existing tests must pass without any changes |

---

## Task 1: ConfirmModal component (TDD)

**Files:**
- Create: `packages/frontend/src/test/ConfirmModal.test.tsx`
- Create: `packages/frontend/src/components/ConfirmModal.tsx`

- [ ] **Step 1: Write the failing test file**

Create `packages/frontend/src/test/ConfirmModal.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect } from 'vitest';
import ConfirmModal from '../components/ConfirmModal.tsx';

function renderModal(overrides: Partial<Parameters<typeof ConfirmModal>[0]> = {}) {
  const props = {
    message: 'Delete this item?',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    ...overrides,
  };
  return { ...render(<ConfirmModal {...props} />), props };
}

describe('ConfirmModal', () => {
  it('renders the message', () => {
    renderModal({ message: 'Are you absolutely sure?' });
    expect(screen.getByText('Are you absolutely sure?')).toBeInTheDocument();
  });

  it('calls onConfirm when Confirm button is clicked', async () => {
    const user = userEvent.setup();
    const { props } = renderModal();
    await user.click(screen.getByRole('button', { name: /confirm/i }));
    expect(props.onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onCancel when Cancel button is clicked', async () => {
    const user = userEvent.setup();
    const { props } = renderModal();
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(props.onCancel).toHaveBeenCalledOnce();
  });

  it('calls onCancel when backdrop is clicked', async () => {
    const user = userEvent.setup();
    const { props } = renderModal();
    const backdrop = screen.getByTestId('confirm-modal-backdrop');
    await user.click(backdrop);
    expect(props.onCancel).toHaveBeenCalledOnce();
  });

  it('does not call onCancel when dialog content is clicked', async () => {
    const user = userEvent.setup();
    const { props } = renderModal();
    const dialog = screen.getByRole('dialog');
    await user.click(dialog);
    expect(props.onCancel).not.toHaveBeenCalled();
  });

  it('calls onCancel when Escape key is pressed', async () => {
    const user = userEvent.setup();
    const { props } = renderModal();
    await user.keyboard('{Escape}');
    expect(props.onCancel).toHaveBeenCalledOnce();
  });

  it('shows custom confirmText', () => {
    renderModal({ confirmText: 'Yes, delete it' });
    expect(screen.getByRole('button', { name: /yes, delete it/i })).toBeInTheDocument();
  });

  it('disables both buttons while loading', () => {
    renderModal({ isLoading: true });
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /loading/i })).toBeDisabled();
  });

  it('shows error message when provided', () => {
    renderModal({ error: 'Failed to delete' });
    expect(screen.getByText('Failed to delete')).toBeInTheDocument();
  });

  it('uses red confirm button when isDangerous is true', () => {
    renderModal({ isDangerous: true });
    const confirmBtn = screen.getByRole('button', { name: /confirm/i });
    expect(confirmBtn.className).toMatch(/red/);
  });

  it('uses emerald confirm button when isDangerous is false', () => {
    renderModal({ isDangerous: false });
    const confirmBtn = screen.getByRole('button', { name: /confirm/i });
    expect(confirmBtn.className).toMatch(/emerald/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd packages/frontend && npm test -- --reporter=verbose ConfirmModal
```

Expected: FAIL — module `../components/ConfirmModal.tsx` not found

- [ ] **Step 3: Create `ConfirmModal` component**

Create `packages/frontend/src/components/ConfirmModal.tsx`:

```tsx
import { useEffect } from 'react';

interface ConfirmModalProps {
  message: string;
  confirmText?: string;
  isDangerous?: boolean;
  isLoading?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  message,
  confirmText = 'Confirm',
  isDangerous = false,
  isLoading = false,
  error = null,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <div
      data-testid="confirm-modal-backdrop"
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white dark:bg-dark-surface rounded-lg shadow-xl max-w-sm w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-gray-900 dark:text-dark-text mb-6">{message}</p>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>
        )}
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-dark-border text-gray-700 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-raised disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg font-medium text-white transition-colors disabled:opacity-50 ${
              isDangerous
                ? 'bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700'
                : 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700'
            }`}
          >
            {isLoading ? 'Loading...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd packages/frontend && npm test -- --reporter=verbose ConfirmModal
```

Expected: PASS — all 11 tests in `ConfirmModal.test.tsx` pass

- [ ] **Step 5: Commit**

```bash
git add packages/frontend/src/components/ConfirmModal.tsx packages/frontend/src/test/ConfirmModal.test.tsx
git commit -m "feat: add ConfirmModal centered overlay dialog component"
```

---

## Task 2: Refactor ConfirmButton to use ConfirmModal

**Files:**
- Modify: `packages/frontend/src/components/ConfirmButton.tsx`

- [ ] **Step 1: Verify existing TransactionsPage tests pass (baseline)**

```bash
cd packages/frontend && npm test -- --reporter=verbose TransactionsPage
```

Expected: PASS — all tests pass. This is the baseline. These same tests must still pass after the refactor.

- [ ] **Step 2: Replace ConfirmButton contents**

Replace the entire content of `packages/frontend/src/components/ConfirmButton.tsx` with:

```tsx
import { useState } from 'react';
import type { ComponentType } from 'react';
import ConfirmModal from './ConfirmModal.tsx';

interface ConfirmButtonProps {
  icon: ComponentType<{ size?: number }>;
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
  isDangerous = false,
  className = '',
}: ConfirmButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await onConfirm();
      setIsOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    setError(null);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        aria-label={iconLabel}
        className={`p-2 rounded-lg border border-gray-200 dark:border-dark-border text-gray-700 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-raised transition-colors ${className}`}
      >
        <Icon size={16} />
      </button>
      {isOpen && (
        <ConfirmModal
          message={confirmMessage}
          confirmText={confirmText}
          isDangerous={isDangerous}
          isLoading={isLoading}
          error={error}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </>
  );
}
```

> **Note on styling change:** The delete button styling is updated from `bg-red-600 text-white` (colored icon button) to `border border-gray-200 text-gray-700` (neutral icon button matching the Edit button) since the destructive intent is now communicated by the modal's red Confirm button, not the trigger button.

- [ ] **Step 3: Run TransactionsPage tests to confirm no regressions**

```bash
cd packages/frontend && npm test -- --reporter=verbose TransactionsPage
```

Expected: PASS — all tests pass. Key test to watch: `deletes a transaction and removes it from the list` — it clicks Delete, finds the modal message text, clicks Confirm in the modal.

- [ ] **Step 4: Run full test suite**

```bash
cd packages/frontend && npm test -- --reporter=verbose
```

Expected: PASS — all tests across all files pass

- [ ] **Step 5: Commit**

```bash
git add packages/frontend/src/components/ConfirmButton.tsx
git commit -m "refactor: replace inline delete confirmation with ConfirmModal dialog"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] Inline confirmation state removed from `ConfirmButton` → Task 2
- [x] Centered modal dialog created → Task 1
- [x] `ConfirmButton` external API unchanged → Task 2 keeps same props
- [x] Existing delete tests still pass → Task 2 Step 3 verifies
- [x] Escape key closes modal → `ConfirmModal` has keydown listener
- [x] Backdrop click closes modal → Task 1 tests this
- [x] Error display in modal → `ConfirmModal` renders `error` prop
- [x] Loading state in modal → `ConfirmModal` renders `isLoading` prop

**Placeholder scan:** No TBD, TODO, or "similar to" references — all steps include complete code.

**Type consistency:**
- `ConfirmModal` props: `message`, `confirmText`, `isDangerous`, `isLoading`, `error`, `onConfirm`, `onCancel`
- `ConfirmButton` passes these to `ConfirmModal` in Task 2 Step 2 — all names match
- `onConfirm` in `ConfirmModal` is `() => void`; `ConfirmButton.handleConfirm` is `() => void` — matches

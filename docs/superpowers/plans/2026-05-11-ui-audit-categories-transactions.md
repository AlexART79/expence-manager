# UI Audit & Alignment: Categories and Transactions

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Audit and align Categories and Transactions pages for consistent edit/delete UX, dark theme support, and shared design tokens.

**Architecture:** Standardize on inline confirmation for all delete actions (using the existing ConfirmButton pattern), migrate all hardcoded CSS to Tailwind + design tokens, ensure dark mode support across all UI controls.

**Tech Stack:** React, Tailwind CSS, Lucide React icons, existing design tokens (dark-text, dark-surface, etc.)

---

## Current State Analysis

### CategoriesPage
- Edit: Inline with toggle state
- Delete: Inline confirmation via ConfirmButton ✓ (already aligned)
- Styling: Tailwind classes with dark mode support ✓

### TransactionsPage
- Edit: Modal form
- Delete: Modal confirmation
- Styling: Hardcoded CSS (TransactionsPage.css) ✗ No dark mode
- Form: Hardcoded CSS (TransactionForm.css) ✗ No dark mode

### Issues Found
1. **Inconsistent UX**: Categories uses inline delete, Transactions uses modal
2. **Missing dark theme**: TransactionsPage.css and TransactionForm.css have no dark colors
3. **Design tokens not used**: Colors hardcoded (#333, #4caf50, #f5f5f5) instead of Tailwind design tokens
4. **Button styling duplicated**: Plain CSS `btn` classes instead of Tailwind utility classes

---

## Task 1: Refactor TransactionForm to Use Tailwind + Design Tokens

**Files:**
- Modify: `packages/frontend/src/components/TransactionForm.tsx`
- Delete: `packages/frontend/src/components/TransactionForm.css`

- [ ] **Step 1: Update TransactionForm.tsx to use Tailwind classes**

Replace the CSS-reliant form with inline Tailwind classes:

```tsx
import { useState, useEffect } from 'react';
import type { Transaction, TransactionInput } from '../lib/transactions.ts';
import type { Category } from '../lib/categories.ts';

interface TransactionFormProps {
  transaction?: Transaction;
  categories: Category[];
  onSubmit: (data: TransactionInput) => Promise<void>;
  onCancel: () => void;
}

export default function TransactionForm({
  transaction,
  categories,
  onSubmit,
  onCancel,
}: TransactionFormProps) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [transactionDate, setTransactionDate] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (transaction) {
      setTitle(transaction.title);
      setAmount(transaction.amount.toString());
      setCategoryId(transaction.categoryId.toString());
      setTransactionDate(transaction.transactionDate);
      setCurrency(transaction.currency);
      setNotes(transaction.notes || '');
    } else {
      setTitle('');
      setAmount('');
      setCategoryId(categories[0]?.id.toString() || '');
      setTransactionDate(new Date().toISOString().split('T')[0]);
      setCurrency('USD');
      setNotes('');
    }
  }, [transaction, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    if (!categoryId) {
      setError('Category is required');
      return;
    }

    if (!transactionDate) {
      setError('Date is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData: TransactionInput = {
        title: title.trim(),
        amount: parseFloat(amount),
        categoryId: parseInt(categoryId),
        transactionDate,
        currency,
        notes: notes.trim() || null,
      };

      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm border border-red-300 dark:border-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor="title" className="font-semibold text-gray-700 dark:text-dark-text text-sm">
          Title
        </label>
        <input
          id="title"
          type="text"
          placeholder="Transaction title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isSubmitting}
          className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text placeholder-gray-400 dark:placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="amount" className="font-semibold text-gray-700 dark:text-dark-text text-sm">
          Amount
        </label>
        <input
          id="amount"
          type="number"
          placeholder="Amount"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={isSubmitting}
          className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text placeholder-gray-400 dark:placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="category" className="font-semibold text-gray-700 dark:text-dark-text text-sm">
          Category
        </label>
        <select
          id="category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          disabled={isSubmitting}
          className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">Select a category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="date" className="font-semibold text-gray-700 dark:text-dark-text text-sm">
          Date
        </label>
        <input
          id="date"
          type="date"
          value={transactionDate}
          onChange={(e) => setTransactionDate(e.target.value)}
          disabled={isSubmitting}
          className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="currency" className="font-semibold text-gray-700 dark:text-dark-text text-sm">
          Currency
        </label>
        <input
          id="currency"
          type="text"
          placeholder="Currency code"
          value={currency}
          onChange={(e) => setCurrency(e.target.value.toUpperCase())}
          maxLength={3}
          disabled={isSubmitting}
          className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text placeholder-gray-400 dark:placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="notes" className="font-semibold text-gray-700 dark:text-dark-text text-sm">
          Notes
        </label>
        <textarea
          id="notes"
          placeholder="Optional notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={isSubmitting}
          rows={3}
          className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text placeholder-gray-400 dark:placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      <div className="flex gap-3 justify-end mt-2 pt-4 border-t border-gray-200 dark:border-dark-border">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-700 dark:text-dark-text-secondary font-medium hover:bg-gray-100 dark:hover:bg-dark-raised disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {transaction ? 'Save Changes' : 'Add Transaction'}
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Delete TransactionForm.css**

```bash
rm packages/frontend/src/components/TransactionForm.css
```

Expected: File deleted, no errors.

- [ ] **Step 3: Run tests to verify form still works**

```bash
npm run test -- TransactionForm
```

Expected: All tests pass (existing tests verify form behavior hasn't changed).

- [ ] **Step 4: Commit**

```bash
git add packages/frontend/src/components/TransactionForm.tsx
git commit -m "refactor: migrate TransactionForm to Tailwind CSS with dark mode support"
```

---

## Task 2: Refactor TransactionsPage to Use Tailwind + Design Tokens

**Files:**
- Modify: `packages/frontend/src/pages/TransactionsPage.tsx`
- Modify: `packages/frontend/src/pages/TransactionsPage.css`
- Modify: `packages/frontend/src/components/TransactionList.css` (if exists)

- [ ] **Step 1: Update TransactionsPage.tsx with Tailwind classes**

Replace hardcoded CSS classes with Tailwind utilities:

```tsx
import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import {
  listTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  type Transaction,
  type TransactionInput,
  type TransactionFilters,
} from '../lib/transactions.ts';
import { listCategories, type Category } from '../lib/categories.ts';
import { ApiError } from '../lib/apiClient.ts';
import TransactionForm from '../components/TransactionForm.tsx';
import ConfirmButton from '../components/ConfirmButton.tsx';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [status, setStatus] = useState<'loading' | 'error' | 'idle'>('loading');
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [formOpen, setFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Load transactions and categories on mount and when filters change
  useEffect(() => {
    setStatus('loading');
    Promise.all([
      listTransactions(filters),
      listCategories(),
    ])
      .then(([txns, cats]) => {
        setTransactions(txns);
        setCategories(cats);
        setStatus('idle');
      })
      .catch(() => setStatus('error'));
  }, [filters]);

  function handleCreate() {
    setEditingTransaction(null);
    setFormOpen(true);
    setFormError(null);
  }

  function handleEdit(transaction: Transaction) {
    setEditingTransaction(transaction);
    setFormOpen(true);
    setFormError(null);
  }

  async function handleFormSaved(input: TransactionInput) {
    try {
      let saved: Transaction;

      if (editingTransaction) {
        // Update mode
        saved = await updateTransaction(editingTransaction.id, input);
        setTransactions((prev) => prev.map((t) => (t.id === saved.id ? saved : t)));
      } else {
        // Create mode
        saved = await createTransaction(input);
        setTransactions((prev) => [saved, ...prev]);
      }

      setFormOpen(false);
      setEditingTransaction(null);
      setFormError(null);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to save transaction';
      setFormError(message);
      throw new Error(message);
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteTransaction(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to delete transaction';
      throw new Error(message);
    }
  }

  function handleFilterChange(key: keyof TransactionFilters, value: string | number | undefined) {
    setFilters((prev) => {
      const updated = { ...prev };
      if (value === undefined || value === '' || value === 0) {
        delete updated[key];
      } else {
        (updated[key] as string | number) = value;
      }
      return updated;
    });
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-48">
        <span className="text-gray-400 dark:text-dark-text-muted">Loading...</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="py-8 text-center text-red-600 dark:text-red-400">
        Failed to load transactions. Please refresh the page.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-dark-text">Transactions</h2>
        <button
          onClick={handleCreate}
          className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-medium flex items-center gap-2 transition-colors"
        >
          <Plus size={18} />
          Add Transaction
        </button>
      </div>

      <div className="bg-white dark:bg-dark-surface rounded-lg border border-gray-200 dark:border-dark-border shadow-sm overflow-x-auto">
        {transactions.length === 0 ? (
          <p className="px-6 py-8 text-center text-gray-500 dark:text-dark-text-secondary">
            No transactions yet. Create one to get started.
          </p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-dark-border">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-dark-text">Title</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-dark-text">Amount</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-dark-text">Category</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-dark-text">Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-dark-text">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => {
                const category = categories.find((c) => c.id === tx.categoryId);
                return (
                  <tr key={tx.id} className="border-b border-gray-100 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-raised transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-dark-text">{tx.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-dark-text">
                      {tx.currency} {tx.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-dark-text">{category?.name || 'Unknown'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-dark-text">{tx.transactionDate}</td>
                    <td className="px-6 py-4 text-sm flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(tx)}
                        aria-label="Edit"
                        className="p-2 rounded-lg border border-gray-200 dark:border-dark-border text-gray-700 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-raised transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <ConfirmButton
                        icon={Trash2}
                        iconLabel="Delete"
                        onConfirm={async () => {
                          try {
                            await handleDelete(tx.id);
                          } catch (err) {
                            throw err instanceof Error ? err : new Error('Failed to delete transaction');
                          }
                        }}
                        confirmMessage="Delete this transaction?"
                        isDangerous={true}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {formOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setFormOpen(false)}>
          <div className="bg-white dark:bg-dark-surface rounded-lg shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-900 dark:text-dark-text mb-4">
              {editingTransaction ? 'Edit Transaction' : 'New Transaction'}
            </h2>
            {formError && (
              <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm mb-4 border border-red-300 dark:border-red-700">
                {formError}
              </div>
            )}
            <TransactionForm
              transaction={editingTransaction || undefined}
              categories={categories}
              onSubmit={handleFormSaved}
              onCancel={() => {
                setFormOpen(false);
                setEditingTransaction(null);
                setFormError(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Delete TransactionsPage.css**

```bash
rm packages/frontend/src/pages/TransactionsPage.css
```

Expected: File deleted, no errors.

- [ ] **Step 3: Update import statement in TransactionsPage.tsx**

Remove the CSS import from the top of the file (it should no longer be there after the refactor above).

- [ ] **Step 4: Run tests to verify page still works**

```bash
npm run test -- TransactionsPage
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/frontend/src/pages/TransactionsPage.tsx
git commit -m "refactor: migrate TransactionsPage to Tailwind CSS with dark mode support"
```

---

## Task 3: Align Delete UX - Use Inline Confirmation for Transactions

**Files:**
- Modify: `packages/frontend/src/pages/TransactionsPage.tsx` (already done in Task 2, but verify the ConfirmButton usage)

- [ ] **Step 1: Verify TransactionsPage uses ConfirmButton for delete**

In TransactionsPage.tsx, the delete action should use ConfirmButton (already included in Task 2 refactor):

```tsx
<ConfirmButton
  icon={Trash2}
  iconLabel="Delete"
  onConfirm={async () => {
    try {
      await handleDelete(tx.id);
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to delete transaction');
    }
  }}
  confirmMessage="Delete this transaction?"
  isDangerous={true}
/>
```

This matches the CategoriesPage pattern ✓

- [ ] **Step 2: Verify both pages have same confirmation behavior**

Check CategoriesPage.tsx uses ConfirmButton for delete - it should already ✓

- [ ] **Step 3: Test inline delete flow manually**

- Click a delete button on Transactions page
- Confirm message appears inline
- Click Cancel - confirmation disappears
- Click delete again, click Confirm - item is deleted

Expected: Same inline UX as Categories page.

- [ ] **Step 4: Commit** (if changes were needed)

```bash
git add packages/frontend/src/pages/TransactionsPage.tsx
git commit -m "feat: align delete UX - use inline confirmation for transactions"
```

---

## Task 4: Update Modal Overlay Styling for Dark Mode

**Files:**
- Modify: `packages/frontend/src/pages/TransactionsPage.tsx` (modal overlay)

- [ ] **Step 1: Verify modal styling has dark mode classes**

The modal in TransactionsPage should use dark mode classes (already in Task 2 refactor):

```tsx
<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setFormOpen(false)}>
  <div className="bg-white dark:bg-dark-surface rounded-lg shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
    <h2 className="text-xl font-bold text-gray-900 dark:text-dark-text mb-4">
      {editingTransaction ? 'Edit Transaction' : 'New Transaction'}
    </h2>
```

This uses `dark:bg-dark-surface` and `dark:text-dark-text` ✓

- [ ] **Step 2: Test modal in light and dark modes**

- Toggle to light mode - modal has white background, dark text ✓
- Toggle to dark mode - modal has dark surface background, light text ✓

Expected: Modal is readable in both themes.

- [ ] **Step 3: Commit** (no changes needed if already done in Task 2)

No new commit needed - covered in Task 2.

---

## Task 5: Verify Design Token Consistency Across All Pages

**Files to audit:**
- `packages/frontend/src/pages/CategoriesPage.tsx`
- `packages/frontend/src/pages/TransactionsPage.tsx`
- `packages/frontend/src/components/ConfirmButton.tsx`
- `packages/frontend/src/components/TransactionForm.tsx`

- [ ] **Step 1: Create consistency checklist**

Verify all pages use consistent Tailwind tokens:

| Element | Token Expected | Location | Status |
|---------|---|---|---|
| Dark background | `dark:bg-dark-surface` | All pages | Check |
| Dark text | `dark:text-dark-text` | All pages | Check |
| Dark borders | `dark:border-dark-border` | All pages | Check |
| Primary button | `bg-emerald-600` | Categories, Transactions | Check |
| Danger button | `bg-red-600` | Categories, Transactions | Check |
| Input background | `dark:bg-dark-surface` | Form inputs | Check |
| Input border | `border-gray-200 dark:border-dark-border` | Form inputs | Check |
| Hover state | `dark:hover:bg-dark-raised` | Interactive elements | Check |

- [ ] **Step 2: Audit CategoriesPage**

Verify existing styling uses consistent tokens - should already be ✓

Example from CategoriesPage (should match):
```tsx
<input
  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text placeholder-gray-400 dark:placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500"
/>
```

- [ ] **Step 3: Verify TransactionsPage matches CategoriesPage input styling**

After Task 2, TransactionsPage inputs should use identical Tailwind classes ✓

- [ ] **Step 4: Verify buttons use consistent colors**

All buttons should use:
- Primary: `bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700`
- Secondary: `bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border`
- Danger: `bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700`

- [ ] **Step 5: Test in light and dark modes**

Navigate through all pages in both themes:
- CategoriesPage: buttons, inputs, list items ✓
- TransactionsPage: buttons, table, inputs, modal ✓
- Dark theme toggle works seamlessly ✓

- [ ] **Step 6: Create a summary document (optional)**

Document the design tokens used across the app for future reference:

```markdown
# Design Tokens Usage

## Colors (from tailwind.config.ts)
- Dark theme background: `dark-base` (#090e0c)
- Dark theme surface: `dark-surface` (#0f1612)
- Dark theme elevated: `dark-raised` (#161b22)
- Dark theme border: `dark-border` (#1a2820)
- Dark theme text: `dark-text` (#e2ede8)
- Dark theme secondary text: `dark-text-secondary` (#a3c9b8)
- Dark theme muted text: `dark-text-muted` (#4d7a66)

## Button Styles
- Primary: `bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700`
- Secondary: `bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border`
- Danger: `bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700`

## Input Styles
- `border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text`
- Focus: `focus:outline-none focus:ring-2 focus:ring-emerald-500`

## Interactive Elements
- Hover: `hover:bg-gray-100 dark:hover:bg-dark-raised transition-colors`
```

- [ ] **Step 7: Commit** (if created design token doc)

```bash
git add docs/design-tokens.md
git commit -m "docs: add design tokens consistency guide"
```

---

## Task 6: Verify Edit UX Consistency

**Files:**
- `packages/frontend/src/pages/CategoriesPage.tsx`
- `packages/frontend/src/pages/TransactionsPage.tsx`

- [ ] **Step 1: Document current edit patterns**

- **CategoriesPage**: Inline editing with toggle state (edit → inline input → save/cancel buttons)
- **TransactionsPage**: Modal form (edit → modal with full form)

Both are acceptable. User approved keeping them different if they make sense for the use case.

- [ ] **Step 2: Test edit flow on Categories**

- Click edit icon on a category
- Input appears inline with Save/Cancel buttons
- Verify dark mode works
- Cancel clears the state
- Save updates the item

Expected: Smooth inline editing ✓

- [ ] **Step 3: Test edit flow on Transactions**

- Click edit button on a transaction
- Modal opens with TransactionForm
- Verify dark mode in modal and form
- Cancel closes the modal
- Save updates the transaction and closes modal

Expected: Smooth modal editing ✓

- [ ] **Step 4: Verify both edit UX are clear and consistent in style**

While patterns differ, ensure:
- Both have clear visual feedback
- Both work in light and dark modes
- Both have consistent button styling (emerald primary, gray secondary)

Expected: ✓ Different patterns but consistent styling

- [ ] **Step 5: Document edit patterns in code comments (optional)**

If desired, add brief comments explaining the edit approach in each page.

- [ ] **Step 6: Commit** (no changes needed if patterns are acceptable)

No new commit needed - both patterns are working and aligned stylistically.

---

## Task 7: Run Full Test Suite and Manual Testing

**Files:**
- All test files

- [ ] **Step 1: Run all tests**

```bash
npm run test
```

Expected: All tests pass (no regressions from CSS removal).

- [ ] **Step 2: Start dev server and test all flows**

```bash
npm run dev
```

- [ ] **Step 3: Test on Categories page**

- View categories list ✓
- Add new category ✓
- Rename category (inline) ✓
- Delete category (inline confirmation) ✓
- Light theme ✓
- Dark theme ✓

- [ ] **Step 4: Test on Transactions page**

- View transactions table ✓
- Add transaction (modal form) ✓
- Edit transaction (modal form) ✓
- Delete transaction (inline confirmation) ✓
- Modal styling in light theme ✓
- Modal styling in dark theme ✓
- Form inputs in light theme ✓
- Form inputs in dark theme ✓

- [ ] **Step 5: Test navigation and theme toggle**

- Navigate between pages ✓
- Toggle dark mode - all content updates ✓
- Refresh page - theme persists ✓

- [ ] **Step 6: Test responsive design**

- Resize browser to mobile width
- Categories page responsive ✓
- Transactions table scrollable on mobile ✓
- Modal readable on mobile ✓

Expected: All manual tests pass, no visual regressions.

- [ ] **Step 7: Commit final verification**

```bash
git add .
git commit -m "test: verify all UI changes work correctly in light and dark modes"
```

---

## Summary of Changes

| Page | Issue | Fix | Status |
|------|-------|-----|--------|
| TransactionForm | Hardcoded CSS, no dark mode | Migrated to Tailwind + design tokens | Task 1 |
| TransactionsPage | Hardcoded CSS, no dark mode | Migrated to Tailwind + design tokens | Task 2 |
| TransactionsPage | Modal delete confirmation | Aligned to inline confirmation (ConfirmButton) | Task 3 |
| Both pages | Modal styling no dark mode | Updated modal to use `dark:bg-dark-surface` | Task 4 |
| All pages | Token consistency | Verified consistent use of design tokens | Task 5 |
| Edit UX | Different patterns | Documented and verified both acceptable | Task 6 |
| All | Regression testing | Full test suite and manual testing | Task 7 |

---

## Acceptance Criteria

✅ All hardcoded CSS replaced with Tailwind utilities  
✅ Dark mode works across all UI controls  
✅ Design tokens used consistently (colors, sizes, fonts)  
✅ Delete confirmation is inline on both Categories and Transactions  
✅ All tests pass  
✅ Manual testing covers light/dark themes and all flows  
✅ Responsive design works on mobile  

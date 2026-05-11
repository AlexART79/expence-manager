import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import TransactionsPage from '../pages/TransactionsPage.tsx';
import * as txLib from '../lib/transactions.ts';
import * as catLib from '../lib/categories.ts';
import type { Transaction } from '../lib/transactions.ts';
import type { Category } from '../lib/categories.ts';
import { ApiError } from '../lib/apiClient.ts';

function makeCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: 1,
    userId: 42,
    name: 'Food',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 1,
    userId: 42,
    categoryId: 1,
    title: 'Groceries',
    amount: 45.5,
    currency: 'USD',
    transactionDate: '2026-05-01',
    notes: null,
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
    ...overrides,
  };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <TransactionsPage />
    </MemoryRouter>,
  );
}

describe('TransactionsPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(catLib, 'listCategories').mockResolvedValue([makeCategory()]);
  });

  it('shows loading state while fetching', () => {
    vi.spyOn(txLib, 'listTransactions').mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows empty state when there are no transactions', async () => {
    vi.spyOn(txLib, 'listTransactions').mockResolvedValue([]);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/no transactions yet/i)).toBeInTheDocument();
    });
  });

  it('shows error state when fetch fails', async () => {
    vi.spyOn(txLib, 'listTransactions').mockRejectedValue(new Error('Network error'));
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/failed to load transactions/i)).toBeInTheDocument();
    });
  });

  it('renders a list of transactions', async () => {
    vi.spyOn(txLib, 'listTransactions').mockResolvedValue([
      makeTransaction({
        id: 1,
        title: 'Groceries',
        amount: 45.5,
        transactionDate: '2026-05-01',
      }),
      makeTransaction({
        id: 2,
        title: 'Gas Station',
        amount: 52.0,
        transactionDate: '2026-05-02',
      }),
    ]);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Groceries')).toBeInTheDocument();
      expect(screen.getByText('Gas Station')).toBeInTheDocument();
      expect(screen.getByText('USD 45.50')).toBeInTheDocument();
      expect(screen.getByText('USD 52.00')).toBeInTheDocument();
    });
  });

  it('opens create form when "Add Transaction" is clicked', async () => {
    const user = userEvent.setup();
    vi.spyOn(txLib, 'listTransactions').mockResolvedValue([]);
    renderPage();
    await waitFor(() => expect(screen.getByText(/no transactions yet/i)).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /add transaction/i }));

    expect(screen.getByRole('heading', { name: /new transaction/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Amount')).toBeInTheDocument();
    expect(screen.getByLabelText('Date')).toBeInTheDocument();
    expect(screen.getByLabelText('Category')).toBeInTheDocument();
  });

  it('creates a transaction and adds it to the list', async () => {
    const user = userEvent.setup();
    vi.spyOn(txLib, 'listTransactions').mockResolvedValue([]);
    vi.spyOn(catLib, 'listCategories').mockResolvedValue([makeCategory({ id: 1, name: 'Food' })]);
    vi.spyOn(txLib, 'createTransaction').mockResolvedValue(
      makeTransaction({ id: 10, title: 'New Expense', amount: 30, categoryId: 1 }),
    );

    renderPage();
    await waitFor(() => expect(screen.getByText(/no transactions yet/i)).toBeInTheDocument());

    // Click the header button to open the form
    const headerButton = screen.getAllByRole('button', { name: /add transaction/i })[0]!;
    await user.click(headerButton);

    await user.clear(screen.getByLabelText('Title'));
    await user.type(screen.getByLabelText('Title'), 'New Expense');
    await user.clear(screen.getByLabelText('Amount'));
    await user.type(screen.getByLabelText('Amount'), '30');
    await user.selectOptions(screen.getByLabelText('Category'), '1');

    // Find the form submit button (not the header button)
    const submitButtons = screen.getAllByRole('button', { name: /add transaction/i });
    await user.click(submitButtons[submitButtons.length - 1]!);

    await waitFor(() => {
      expect(txLib.createTransaction).toHaveBeenCalled();
      expect(screen.getByText('New Expense')).toBeInTheDocument();
    });
  });

  it('shows validation error when title is empty on submit', async () => {
    const user = userEvent.setup();
    vi.spyOn(txLib, 'listTransactions').mockResolvedValue([]);

    renderPage();
    await waitFor(() => expect(screen.getByText(/no transactions yet/i)).toBeInTheDocument());

    // Click the header button to open the form
    const headerButton = screen.getAllByRole('button', { name: /add transaction/i })[0]!;
    await user.click(headerButton);

    // Find the submit button in the form (should be the second one now)
    const submitButtons = screen.getAllByRole('button', { name: /add transaction/i });
    await user.click(submitButtons[submitButtons.length - 1]!);

    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
    });
  });

  it('opens edit form pre-populated with transaction data', async () => {
    const user = userEvent.setup();
    vi.spyOn(txLib, 'listTransactions').mockResolvedValue([
      makeTransaction({
        id: 5,
        title: 'Coffee',
        amount: 5.5,
        transactionDate: '2026-05-05',
        categoryId: 1,
      }),
    ]);
    vi.spyOn(catLib, 'listCategories').mockResolvedValue([makeCategory({ id: 1, name: 'Food' })]);

    renderPage();
    await waitFor(() => expect(screen.getByText('Coffee')).toBeInTheDocument());

    const row = screen.getByText('Coffee').closest('tr')!;
    await user.click(within(row).getByRole('button', { name: /edit/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /edit transaction/i })).toBeInTheDocument();
      expect(screen.getByDisplayValue('Coffee')).toBeInTheDocument();
      expect(screen.getByDisplayValue('5.5')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2026-05-05')).toBeInTheDocument();
    });
  });

  it('updates a transaction and reflects change in list', async () => {
    const user = userEvent.setup();
    vi.spyOn(txLib, 'listTransactions').mockResolvedValue([
      makeTransaction({ id: 7, title: 'Old Title', amount: 20, categoryId: 1 }),
    ]);
    vi.spyOn(catLib, 'listCategories').mockResolvedValue([makeCategory({ id: 1, name: 'Food' })]);
    vi.spyOn(txLib, 'updateTransaction').mockResolvedValue(
      makeTransaction({ id: 7, title: 'New Title', amount: 20, categoryId: 1 }),
    );

    renderPage();
    await waitFor(() => expect(screen.getByText('Old Title')).toBeInTheDocument());

    const row = screen.getByText('Old Title').closest('tr')!;
    await user.click(within(row).getByRole('button', { name: /edit/i }));

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /edit transaction/i })).toBeInTheDocument(),
    );

    const titleInput = screen.getByDisplayValue('Old Title');
    await user.clear(titleInput);
    await user.type(titleInput, 'New Title');

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(txLib.updateTransaction).toHaveBeenCalledWith(
        7,
        expect.objectContaining({ title: 'New Title' }),
      );
      expect(screen.getByText('New Title')).toBeInTheDocument();
      expect(screen.queryByText('Old Title')).not.toBeInTheDocument();
    });
  });

  it('closes form when Cancel is clicked', async () => {
    const user = userEvent.setup();
    vi.spyOn(txLib, 'listTransactions').mockResolvedValue([]);

    renderPage();
    await waitFor(() => expect(screen.getByText(/no transactions yet/i)).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /add transaction/i }));
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /new transaction/i })).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(screen.queryByRole('heading', { name: /new transaction/i })).not.toBeInTheDocument();
  });

  it('deletes a transaction and removes it from the list', async () => {
    const user = userEvent.setup();
    vi.spyOn(txLib, 'listTransactions').mockResolvedValue([
      makeTransaction({ id: 9, title: 'To Delete', categoryId: 1 }),
    ]);
    vi.spyOn(txLib, 'deleteTransaction').mockResolvedValue(undefined);

    renderPage();
    await waitFor(() => expect(screen.getByText('To Delete')).toBeInTheDocument());

    const row = screen.getByText('To Delete').closest('tr')!;
    await user.click(within(row).getByRole('button', { name: /delete/i }));

    await waitFor(() => expect(screen.getByText('Delete this transaction?')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /confirm/i }));

    await waitFor(() => {
      expect(txLib.deleteTransaction).toHaveBeenCalledWith(9);
      expect(screen.queryByText('To Delete')).not.toBeInTheDocument();
    });
  });
});

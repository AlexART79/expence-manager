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

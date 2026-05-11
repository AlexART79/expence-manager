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

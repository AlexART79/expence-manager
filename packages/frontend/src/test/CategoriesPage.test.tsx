import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CategoriesPage from '../pages/CategoriesPage.tsx';
import * as categoriesLib from '../lib/categories.ts';
import type { Category } from '../lib/categories.ts';
import { ApiError } from '../lib/apiClient.ts';

function makeCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: 1,
    userId: 42,
    name: 'Groceries',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <CategoriesPage />
    </MemoryRouter>,
  );
}

describe('CategoriesPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('shows loading state while fetching', () => {
    vi.spyOn(categoriesLib, 'listCategories').mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows empty state when there are no categories', async () => {
    vi.spyOn(categoriesLib, 'listCategories').mockResolvedValue([]);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('No categories yet.')).toBeInTheDocument();
    });
  });

  it('renders a list of categories', async () => {
    vi.spyOn(categoriesLib, 'listCategories').mockResolvedValue([
      makeCategory({ id: 1, name: 'Groceries' }),
      makeCategory({ id: 2, name: 'Transport' }),
    ]);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Groceries')).toBeInTheDocument();
      expect(screen.getByText('Transport')).toBeInTheDocument();
    });
  });

  it('shows error state when fetch fails', async () => {
    vi.spyOn(categoriesLib, 'listCategories').mockRejectedValue(new Error('Network error'));
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/failed to load categories/i)).toBeInTheDocument();
    });
  });

  it('creates a category and adds it to the list', async () => {
    const user = userEvent.setup();
    vi.spyOn(categoriesLib, 'listCategories').mockResolvedValue([]);
    vi.spyOn(categoriesLib, 'createCategory').mockResolvedValue(
      makeCategory({ id: 10, name: 'New Category' }),
    );

    renderPage();
    await waitFor(() => expect(screen.getByText('No categories yet.')).toBeInTheDocument());

    await user.type(screen.getByPlaceholderText('Category name'), 'New Category');
    await user.click(screen.getByRole('button', { name: /add/i }));

    await waitFor(() => {
      expect(categoriesLib.createCategory).toHaveBeenCalledWith('New Category');
      expect(screen.getByText('New Category')).toBeInTheDocument();
    });
  });

  it('clears the input after successful create', async () => {
    const user = userEvent.setup();
    vi.spyOn(categoriesLib, 'listCategories').mockResolvedValue([]);
    vi.spyOn(categoriesLib, 'createCategory').mockResolvedValue(
      makeCategory({ id: 11, name: 'Cleared' }),
    );

    renderPage();
    await waitFor(() => expect(screen.getByText('No categories yet.')).toBeInTheDocument());

    const input = screen.getByPlaceholderText('Category name') as HTMLInputElement;
    await user.type(input, 'Cleared');
    await user.click(screen.getByRole('button', { name: /add/i }));

    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });

  it('shows conflict error when create returns 409', async () => {
    const user = userEvent.setup();
    vi.spyOn(categoriesLib, 'listCategories').mockResolvedValue([]);
    vi.spyOn(categoriesLib, 'createCategory').mockRejectedValue(
      new ApiError(409, { error: { code: 'CONFLICT', message: 'A category with this name already exists', details: {} } }),
    );

    renderPage();
    await waitFor(() => expect(screen.getByText('No categories yet.')).toBeInTheDocument());

    await user.type(screen.getByPlaceholderText('Category name'), 'Duplicate');
    await user.click(screen.getByRole('button', { name: /add/i }));

    await waitFor(() => {
      expect(screen.getByText('A category with this name already exists')).toBeInTheDocument();
    });
  });

  it('deletes a category and removes it from the list', async () => {
    const user = userEvent.setup();
    vi.spyOn(categoriesLib, 'listCategories').mockResolvedValue([
      makeCategory({ id: 5, name: 'To Delete' }),
    ]);
    vi.spyOn(categoriesLib, 'deleteCategory').mockResolvedValue(undefined);

    renderPage();
    await waitFor(() => expect(screen.getByText('To Delete')).toBeInTheDocument());

    const row = screen.getByText('To Delete').closest('li')!;
    await user.click(within(row).getByRole('button', { name: /delete/i }));

    await waitFor(() => {
      expect(categoriesLib.deleteCategory).toHaveBeenCalledWith(5);
      expect(screen.queryByText('To Delete')).not.toBeInTheDocument();
    });
  });

  it('enters rename mode and saves new name', async () => {
    const user = userEvent.setup();
    vi.spyOn(categoriesLib, 'listCategories').mockResolvedValue([
      makeCategory({ id: 7, name: 'Old Name' }),
    ]);
    vi.spyOn(categoriesLib, 'renameCategory').mockResolvedValue(
      makeCategory({ id: 7, name: 'New Name' }),
    );

    renderPage();
    await waitFor(() => expect(screen.getByText('Old Name')).toBeInTheDocument());

    const row = screen.getByText('Old Name').closest('li')!;
    await user.click(within(row).getByRole('button', { name: /rename/i }));

    const renameInput = within(row).getByDisplayValue('Old Name');
    await user.clear(renameInput);
    await user.type(renameInput, 'New Name');
    await user.click(within(row).getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(categoriesLib.renameCategory).toHaveBeenCalledWith(7, 'New Name');
      expect(screen.getByText('New Name')).toBeInTheDocument();
      expect(screen.queryByText('Old Name')).not.toBeInTheDocument();
    });
  });

  it('cancels rename without saving', async () => {
    const user = userEvent.setup();
    vi.spyOn(categoriesLib, 'listCategories').mockResolvedValue([
      makeCategory({ id: 8, name: 'Stay Same' }),
    ]);
    vi.spyOn(categoriesLib, 'renameCategory').mockResolvedValue(
      makeCategory({ id: 8, name: 'Changed' }),
    );

    renderPage();
    await waitFor(() => expect(screen.getByText('Stay Same')).toBeInTheDocument());

    const row = screen.getByText('Stay Same').closest('li')!;
    await user.click(within(row).getByRole('button', { name: /rename/i }));
    await user.click(within(row).getByRole('button', { name: /cancel/i }));

    expect(screen.getByText('Stay Same')).toBeInTheDocument();
    expect(vi.mocked(categoriesLib.renameCategory)).not.toHaveBeenCalled();
  });
});

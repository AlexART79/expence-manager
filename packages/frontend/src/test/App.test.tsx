import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import App from '../App.tsx';
import * as authLib from '../lib/auth.ts';
import * as categoriesLib from '../lib/categories.ts';
import * as txLib from '../lib/transactions.ts';
import * as catLib from '../lib/categories.ts';

describe('App', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(categoriesLib, 'listCategories').mockResolvedValue([]);
  });

  it('renders the app shell header', async () => {
    vi.spyOn(authLib, 'getCurrentUser').mockResolvedValue(null);

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText('Expence')).toBeInTheDocument();
    });
  });

  it('renders CategoriesPage at /categories when authenticated', async () => {
    vi.spyOn(authLib, 'getCurrentUser').mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      displayName: 'Test User',
      avatarUrl: null,
      provider: 'test',
    });

    render(
      <MemoryRouter initialEntries={['/categories']}>
        <App />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Categories' })).toBeInTheDocument();
    });
  });

  it('renders TransactionsPage for /transactions', async () => {
    // Mock auth to return a logged-in user
    vi.spyOn(authLib, 'getCurrentUser').mockResolvedValue({
      id: 1, provider: 'test', email: 'a@test.com', displayName: 'Alice', avatarUrl: null,
    });
    // Mock transactions lib to return empty list
    vi.spyOn(txLib, 'listTransactions').mockResolvedValue([]);
    vi.spyOn(catLib, 'listCategories').mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={['/transactions']}>
        <App />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /transactions/i })).toBeInTheDocument();
    });
  });
});

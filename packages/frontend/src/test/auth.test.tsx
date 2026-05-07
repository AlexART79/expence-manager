import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import App from '../App.tsx';
import * as authLib from '../lib/auth.ts';

describe('Auth routing', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('redirects to /login when not authenticated', async () => {
    vi.spyOn(authLib, 'getCurrentUser').mockResolvedValue(null);

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Sign in to Expense Tracker')).toBeInTheDocument();
    });
  });

  it('shows home page when authenticated', async () => {
    vi.spyOn(authLib, 'getCurrentUser').mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      displayName: 'Test User',
      avatarUrl: null,
      provider: 'test',
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });
});

import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import App from '../App.tsx';
import * as authLib from '../lib/auth.ts';

describe('App', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the app shell header', async () => {
    vi.spyOn(authLib, 'getCurrentUser').mockResolvedValue(null);

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText('Expense Tracker')).toBeInTheDocument();
    });
  });
});

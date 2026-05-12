import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, afterEach } from 'vitest';
import ProtectedRoute from '../components/ProtectedRoute.tsx';
import * as AuthContext from '../context/AuthContext.tsx';

function renderRoute() {
  return render(
    <MemoryRouter>
      <ProtectedRoute>
        <div>protected content</div>
      </ProtectedRoute>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows loading spinner, not "Loading..." text, while auth is resolving', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: null,
      loading: true,
      logout: vi.fn(),
    });
    renderRoute();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    expect(document.querySelector('[data-testid="auth-loading-spinner"]')).toBeInTheDocument();
  });

  it('does not render children while loading', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: null,
      loading: true,
      logout: vi.fn(),
    });
    renderRoute();
    expect(screen.queryByText('protected content')).not.toBeInTheDocument();
  });

  it('renders children when authenticated', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: {
        id: 1,
        displayName: 'Alice',
        email: 'alice@test.com',
        avatarUrl: null,
        provider: 'google',
      },
      loading: false,
      logout: vi.fn(),
    });
    renderRoute();
    expect(screen.getByText('protected content')).toBeInTheDocument();
  });
});

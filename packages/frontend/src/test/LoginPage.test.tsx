import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import LoginPage from '../pages/LoginPage.tsx';

describe('LoginPage', () => {
  it('renders Google and GitHub sign-in buttons', () => {
    render(<LoginPage />);

    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    expect(screen.getByText('Continue with GitHub')).toBeInTheDocument();
  });

  it('Google link points to the backend OAuth endpoint', () => {
    render(<LoginPage />);

    const googleLink = screen.getByText('Continue with Google').closest('a');
    expect(googleLink?.href).toContain('/api/auth/google');
  });

  it('GitHub link points to the backend OAuth endpoint', () => {
    render(<LoginPage />);

    const githubLink = screen.getByText('Continue with GitHub').closest('a');
    expect(githubLink?.href).toContain('/api/auth/github');
  });

  it('renders the sign-in heading', () => {
    render(<LoginPage />);
    expect(screen.getByRole('heading', { name: 'Sign in to Expense Tracker' })).toBeInTheDocument();
  });
});

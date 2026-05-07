import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { App } from "./App";
import type { AuthClient } from "./auth/authClient";

function createAuthClient(overrides: Partial<AuthClient>): AuthClient {
  return {
    getCurrentUser: vi.fn(),
    logout: vi.fn(),
    getProviderLoginUrl: vi.fn((provider) => `http://localhost:3000/api/auth/${provider}/start`),
    ...overrides
  } as AuthClient;
}

describe("App shell", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/");
  });

  it("redirects unauthenticated homepage visitors to the login page", async () => {
    render(<App authClient={createAuthClient({ getCurrentUser: vi.fn().mockResolvedValue(null) })} />);

    expect(await screen.findByRole("heading", { name: "Sign in to Expense Tracker" })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/login");
  });

  it("shows a bootstrap error instead of silently treating API failures as logged out", async () => {
    render(
      <App
        authClient={createAuthClient({
          getCurrentUser: vi.fn().mockRejectedValue(new Error("Failed to fetch"))
        })}
      />
    );

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not verify your session");
    expect(window.location.pathname).toBe("/");
  });

  it("renders a dedicated login page with recognizable provider buttons", async () => {
    window.history.replaceState({}, "", "/login");

    render(<App authClient={createAuthClient({ getCurrentUser: vi.fn().mockResolvedValue(null) })} />);

    expect(await screen.findByRole("link", { name: /Continue with Google/ })).toHaveAttribute(
      "href",
      "http://localhost:3000/api/auth/google/start"
    );
    expect(screen.getByRole("link", { name: /Continue with GitHub/ })).toHaveAttribute(
      "href",
      "http://localhost:3000/api/auth/github/start"
    );
  });

  it("shows a loading-capable main area", () => {
    render(<App isLoading authClient={createAuthClient({ getCurrentUser: vi.fn().mockResolvedValue(null) })} />);

    expect(screen.getByRole("status")).toHaveTextContent("Loading dashboard");
  });

  it("toggles dark theme class on the app root", async () => {
    const user = userEvent.setup();
    render(<App authClient={createAuthClient({ getCurrentUser: vi.fn().mockResolvedValue(null) })} />);

    const root = screen.getByTestId("app-root");
    expect(root).toHaveClass("dark");

    await user.click(await screen.findByRole("button", { name: "Switch to light theme" }));

    expect(root).not.toHaveClass("dark");
  });

  it("redirects authenticated login visitors to the protected homepage", async () => {
    window.history.replaceState({}, "", "/login");

    render(
      <App
        authClient={createAuthClient({
          getCurrentUser: vi.fn().mockResolvedValue({
            id: 1,
            provider: "google",
            email: "google.user@example.com",
            displayName: "Google Test User",
            avatarUrl: null
          })
        })}
      />
    );

    expect(await screen.findByRole("heading", { name: "Home" })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/");
  });

  it("renders the authenticated header with avatar and current user identity", async () => {
    render(
      <App
        authClient={createAuthClient({
          getCurrentUser: vi.fn().mockResolvedValue({
            id: 1,
            provider: "google",
            email: "google.user@example.com",
            displayName: "Google Test User",
            avatarUrl: "https://example.com/avatar.png"
          })
        })}
      />
    );

    expect(await screen.findByRole("img", { name: "Google Test User avatar" })).toHaveAttribute(
      "src",
      "https://example.com/avatar.png"
    );
    expect(screen.getByText("Google Test User")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument();
  });

  it("logs out and returns to the auth entry state", async () => {
    const user = userEvent.setup();
    const logout = vi.fn().mockResolvedValue(undefined);
    render(
      <App
        authClient={createAuthClient({
          getCurrentUser: vi.fn().mockResolvedValue({
            id: 1,
            provider: "github",
            email: null,
            displayName: "GitHub Test User",
            avatarUrl: null
          }),
          logout
        })}
      />
    );

    await user.click(await screen.findByRole("button", { name: "Log out" }));

    await waitFor(() => expect(logout).toHaveBeenCalledTimes(1));
    expect(await screen.findByRole("link", { name: /Continue with GitHub/ })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/login");
  });
});

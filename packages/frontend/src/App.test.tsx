import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { App } from "./App";
import type { AuthClient } from "./auth/authClient";

function createAuthClient(overrides: Partial<AuthClient>): AuthClient {
  return {
    getCurrentUser: vi.fn(),
    logout: vi.fn(),
    getProviderLoginUrl: vi.fn((provider) => `http://localhost:4000/auth/${provider}/start`),
    ...overrides
  } as AuthClient;
}

describe("App shell", () => {
  it("renders the unauthenticated auth entry after bootstrap", async () => {
    render(<App authClient={createAuthClient({ getCurrentUser: vi.fn().mockResolvedValue(null) })} />);

    expect(screen.getByRole("heading", { name: "Personal Expense Tracker" })).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: "Continue with Google" })).toHaveAttribute(
      "href",
      "http://localhost:4000/auth/google/start"
    );
    expect(screen.getByRole("link", { name: "Continue with GitHub" })).toHaveAttribute(
      "href",
      "http://localhost:4000/auth/github/start"
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
    expect(root).not.toHaveClass("dark");

    await user.click(screen.getByRole("button", { name: "Switch to dark theme" }));

    expect(root).toHaveClass("dark");
  });

  it("renders the authenticated shell with current user identity", async () => {
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

    expect(await screen.findByText("Google Test User")).toBeInTheDocument();
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
    expect(await screen.findByRole("link", { name: "Continue with GitHub" })).toBeInTheDocument();
  });
});

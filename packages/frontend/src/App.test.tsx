import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { App } from "./App";
import type { AuthClient } from "./auth/authClient";
import type { CategoryClient } from "./categories/categoryClient";

function createAuthClient(overrides: Partial<AuthClient>): AuthClient {
  return {
    getCurrentUser: vi.fn(),
    logout: vi.fn(),
    getProviderLoginUrl: vi.fn((provider) => `http://localhost:3000/api/auth/${provider}/start`),
    ...overrides
  } as AuthClient;
}

function createCategoryClient(overrides: Partial<CategoryClient>): CategoryClient {
  return {
    listCategories: vi.fn().mockResolvedValue([]),
    createCategory: vi.fn(),
    renameCategory: vi.fn(),
    deleteCategory: vi.fn(),
    ...overrides
  } as CategoryClient;
}

const signedInUser = {
  id: 1,
  provider: "google" as const,
  email: "google.user@example.com",
  displayName: "Google Test User",
  avatarUrl: null
};

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
          getCurrentUser: vi.fn().mockResolvedValue(signedInUser)
        })}
      />
    );

    expect(await screen.findByRole("heading", { name: "Home" })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/");
  });

  it("loads categories on the authenticated homepage", async () => {
    render(
      <App
        authClient={createAuthClient({ getCurrentUser: vi.fn().mockResolvedValue(signedInUser) })}
        categoryClient={createCategoryClient({
          listCategories: vi.fn().mockResolvedValue([
            { id: 1, name: "Groceries", createdAt: 123, updatedAt: 123 },
            { id: 2, name: "Rent", createdAt: 124, updatedAt: 124 }
          ])
        })}
      />
    );

    expect(await screen.findByRole("heading", { name: "Categories" })).toBeInTheDocument();
    expect(await screen.findByText("Groceries")).toBeInTheDocument();
    expect(await screen.findByText("Rent")).toBeInTheDocument();
  });

  it("shows an empty category state after loading", async () => {
    render(
      <App
        authClient={createAuthClient({ getCurrentUser: vi.fn().mockResolvedValue(signedInUser) })}
        categoryClient={createCategoryClient({ listCategories: vi.fn().mockResolvedValue([]) })}
      />
    );

    expect(await screen.findByText("No categories yet")).toBeInTheDocument();
  });

  it("trims category input, blocks blank names, and creates a category", async () => {
    const user = userEvent.setup();
    const createCategory = vi
      .fn()
      .mockResolvedValue({ id: 1, name: "Groceries", createdAt: 123, updatedAt: 123 });

    render(
      <App
        authClient={createAuthClient({ getCurrentUser: vi.fn().mockResolvedValue(signedInUser) })}
        categoryClient={createCategoryClient({ createCategory })}
      />
    );

    await user.type(await screen.findByLabelText("Category name"), "   ");
    await user.click(screen.getByRole("button", { name: "Add category" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Category name is required");
    expect(createCategory).not.toHaveBeenCalled();

    await user.clear(screen.getByLabelText("Category name"));
    await user.type(screen.getByLabelText("Category name"), "  Groceries  ");
    await user.click(screen.getByRole("button", { name: "Add category" }));

    await waitFor(() => expect(createCategory).toHaveBeenCalledWith("Groceries"));
    expect(await screen.findByText("Groceries")).toBeInTheDocument();
  });

  it("renames categories inline and asks for approval before deletion", async () => {
    const user = userEvent.setup();
    const renameCategory = vi.fn().mockResolvedValue({ id: 1, name: "Food", createdAt: 123, updatedAt: 456 });
    const deleteCategory = vi.fn().mockResolvedValue(undefined);

    render(
      <App
        authClient={createAuthClient({ getCurrentUser: vi.fn().mockResolvedValue(signedInUser) })}
        categoryClient={createCategoryClient({
          listCategories: vi.fn().mockResolvedValue([{ id: 1, name: "Groceries", createdAt: 123, updatedAt: 123 }]),
          renameCategory,
          deleteCategory
        })}
      />
    );

    await user.click(await screen.findByRole("button", { name: "Rename Groceries" }));
    expect(screen.getByLabelText("Rename category").closest("li")).toHaveClass("sm:items-end");

    await user.clear(screen.getByLabelText("Rename category"));
    await user.type(screen.getByLabelText("Rename category"), "Food");
    await user.click(screen.getByRole("button", { name: "Save category name" }));

    await waitFor(() => expect(renameCategory).toHaveBeenCalledWith(1, "Food"));
    expect(await screen.findByText("Food")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete Food" }));

    expect(deleteCategory).not.toHaveBeenCalled();
    expect(screen.getByText("Are you sure you want to delete category Food?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Yes, delete Food" }));

    await waitFor(() => expect(deleteCategory).toHaveBeenCalledWith(1));
    expect(screen.queryByText("Food")).not.toBeInTheDocument();
  });

  it("shows category API errors without leaving the authenticated screen", async () => {
    render(
      <App
        authClient={createAuthClient({ getCurrentUser: vi.fn().mockResolvedValue(signedInUser) })}
        categoryClient={createCategoryClient({
          listCategories: vi.fn().mockRejectedValue(new Error("Failed to load categories"))
        })}
      />
    );

    expect(await screen.findByRole("alert")).toHaveTextContent("Failed to load categories");
    expect(screen.getByRole("heading", { name: "Categories" })).toBeInTheDocument();
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

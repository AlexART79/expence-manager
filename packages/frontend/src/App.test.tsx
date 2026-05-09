import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const defaultBudgetClientMock = vi.hoisted(() => ({
  getBudget: vi.fn(),
  setBudget: vi.fn(),
  getBudgetSummary: vi.fn().mockResolvedValue({
    month: new Date().toISOString().slice(0, 7),
    budget: null,
    totalSpent: "0.00",
    totalSpentCents: 0,
    remaining: null,
    remainingCents: null,
    usagePercentage: null,
    currency: "USD"
  })
}));

vi.mock("./budgets/budgetClient", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./budgets/budgetClient")>();
  return {
    ...actual,
    budgetClient: defaultBudgetClientMock
  };
});

import { App } from "./App";
import type { AuthClient } from "./auth/authClient";
import type { BudgetAlert, BudgetAlertClient } from "./budgetAlerts/budgetAlertClient";
import type { BudgetClient } from "./budgets/budgetClient";
import type { CategoryClient } from "./categories/categoryClient";
import type { TransactionClient } from "./transactions/transactionClient";

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

function createBudgetClient(overrides: Partial<BudgetClient>): BudgetClient {
  return {
    getBudget: vi.fn(),
    setBudget: vi.fn(),
    getBudgetSummary: vi.fn().mockResolvedValue({
      month: new Date().toISOString().slice(0, 7),
      budget: null,
      totalSpent: "0.00",
      totalSpentCents: 0,
      remaining: null,
      remainingCents: null,
      usagePercentage: null,
      currency: "USD"
    }),
    ...overrides
  } as BudgetClient;
}

function createBudgetAlertClient(onSubscribe: (onAlert: (alert: BudgetAlert) => void) => void): BudgetAlertClient {
  return {
    subscribe: vi.fn((onAlert) => {
      onSubscribe(onAlert);
      return vi.fn();
    })
  };
}

function createTransactionClient(overrides: Partial<TransactionClient>): TransactionClient {
  return {
    listTransactions: vi.fn().mockResolvedValue([]),
    createTransaction: vi.fn(),
    updateTransaction: vi.fn(),
    deleteTransaction: vi.fn(),
    ...overrides
  } as TransactionClient;
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
    expect(await screen.findByText("2 active")).toBeInTheDocument();
    expect(screen.queryByText("Groceries")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Expand categories" }));

    expect(await screen.findByText("Groceries")).toBeInTheDocument();
    expect(await screen.findByText("Rent")).toBeInTheDocument();
  });

  it("collapses the categories block to its summary and expands it again", async () => {
    const user = userEvent.setup();

    render(
      <App
        authClient={createAuthClient({ getCurrentUser: vi.fn().mockResolvedValue(signedInUser) })}
        categoryClient={createCategoryClient({
          listCategories: vi.fn().mockResolvedValue([
            { id: 1, name: "Groceries", createdAt: 123, updatedAt: 123 },
            { id: 2, name: "Rent", createdAt: 124, updatedAt: 124 }
          ])
        })}
        transactionClient={createTransactionClient({})}
      />
    );

    const expandButton = await screen.findByRole("button", { name: "Expand categories" });
    const categorySection = expandButton.closest("section");

    expect(categorySection).not.toBeNull();
    expect(screen.getByText("Spending structure")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Categories" })).toBeInTheDocument();
    expect(await screen.findByText("2 active")).toBeInTheDocument();
    expect(within(categorySection as HTMLElement).queryByText("Groceries")).not.toBeInTheDocument();
    expect(within(categorySection as HTMLElement).queryByLabelText("Category name")).not.toBeInTheDocument();
    expect(expandButton).toHaveAttribute("aria-expanded", "false");

    await user.click(expandButton);

    expect(await within(categorySection as HTMLElement).findByText("Groceries")).toBeInTheDocument();
    expect(within(categorySection as HTMLElement).getByLabelText("Category name")).toBeInTheDocument();
    const collapseButton = screen.getByRole("button", { name: "Collapse categories" });
    expect(collapseButton).toHaveAttribute("aria-expanded", "true");

    await user.click(collapseButton);

    expect(within(categorySection as HTMLElement).queryByText("Groceries")).not.toBeInTheDocument();
    expect(within(categorySection as HTMLElement).queryByLabelText("Category name")).not.toBeInTheDocument();
    expect(screen.getByText("Spending structure")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Categories" })).toBeInTheDocument();
    expect(screen.getByText("2 active")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Expand categories" })).toHaveAttribute("aria-expanded", "false");

    await user.click(screen.getByRole("button", { name: "Expand categories" }));

    expect(within(categorySection as HTMLElement).getByText("Groceries")).toBeInTheDocument();
    expect(within(categorySection as HTMLElement).getByLabelText("Category name")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Collapse categories" })).toHaveAttribute("aria-expanded", "true");
  });

  it("shows an empty category state after loading", async () => {
    render(
      <App
        authClient={createAuthClient({ getCurrentUser: vi.fn().mockResolvedValue(signedInUser) })}
        categoryClient={createCategoryClient({ listCategories: vi.fn().mockResolvedValue([]) })}
      />
    );

    await userEvent.click(await screen.findByRole("button", { name: "Expand categories" }));

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
        transactionClient={createTransactionClient({})}
      />
    );

    await user.click(await screen.findByRole("button", { name: "Expand categories" }));

    await user.type(await screen.findByLabelText("Category name"), "   ");
    await user.click(screen.getByRole("button", { name: "Add category" }));

    expect(await screen.findByText("Category name is required")).toBeInTheDocument();
    expect(screen.getByLabelText("Category name")).toHaveAttribute("aria-invalid", "true");
    expect(createCategory).not.toHaveBeenCalled();

    await user.clear(screen.getByLabelText("Category name"));
    await user.type(screen.getByLabelText("Category name"), "  Groceries  ");
    await user.click(screen.getByRole("button", { name: "Add category" }));

    await waitFor(() => expect(createCategory).toHaveBeenCalledWith("Groceries"));
    expect(await screen.findByText("Groceries")).toBeInTheDocument();
  });

  it("makes newly created categories available in the transaction form without reloading", async () => {
    const user = userEvent.setup();
    const listCategories = vi
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValue([
        { id: 1, name: "Home", createdAt: 123, updatedAt: 123 }
      ]);
    const createCategory = vi
      .fn()
      .mockResolvedValue({ id: 1, name: "Home", createdAt: 123, updatedAt: 123 });

    render(
      <App
        authClient={createAuthClient({ getCurrentUser: vi.fn().mockResolvedValue(signedInUser) })}
        categoryClient={createCategoryClient({ listCategories, createCategory })}
        transactionClient={createTransactionClient({})}
      />
    );

    await user.click(await screen.findByRole("button", { name: "Expand categories" }));
    const categorySection = screen.getByRole("button", { name: "Collapse categories" }).closest("section");
    await user.type(await screen.findByLabelText("Category name"), "Home");
    await user.click(screen.getByRole("button", { name: "Add category" }));

    expect(categorySection).not.toBeNull();
    expect(await within(categorySection as HTMLElement).findByText("Home")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add transaction" }));

    const categorySelect = screen.getByLabelText("Category");
    await waitFor(() => expect(categorySelect).toHaveTextContent("Home"));
    expect(within(categorySelect).getByRole("option", { name: "Home" })).toHaveValue("1");
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

    await user.click(await screen.findByRole("button", { name: "Expand categories" }));

    await user.click(await screen.findByRole("button", { name: "Rename Groceries" }));
    expect(screen.getByLabelText("Rename category").closest("li")).toHaveClass("sm:items-end");
    expect(screen.getByLabelText("Rename category").closest("li")).toHaveClass("mode-transition");

    await user.clear(screen.getByLabelText("Rename category"));
    await user.type(screen.getByLabelText("Rename category"), "Food");
    await user.click(screen.getByRole("button", { name: "Save category name" }));

    await waitFor(() => expect(renameCategory).toHaveBeenCalledWith(1, "Food"));
    expect(await screen.findByText("Food")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete Food" }));

    expect(deleteCategory).not.toHaveBeenCalled();
    const confirmationMessage = screen.getByText("Are you sure you want to delete category Food?");
    expect(confirmationMessage).toBeInTheDocument();
    expect(confirmationMessage.closest("[data-delete-confirmation-overlay]")).toHaveClass("absolute");

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
        transactionClient={createTransactionClient({})}
      />
    );

    await userEvent.click(await screen.findByRole("button", { name: "Expand categories" }));

    expect(await screen.findAllByText("Failed to load categories")).toHaveLength(2);
    expect(screen.getByRole("heading", { name: "Categories" })).toBeInTheDocument();
  });

  it("loads transactions on the authenticated homepage", async () => {
    render(
      <App
        authClient={createAuthClient({ getCurrentUser: vi.fn().mockResolvedValue(signedInUser) })}
        categoryClient={createCategoryClient({
          listCategories: vi.fn().mockResolvedValue([{ id: 1, name: "Groceries", createdAt: 123, updatedAt: 123 }])
        })}
        transactionClient={createTransactionClient({
          listTransactions: vi.fn().mockResolvedValue([
            {
              id: 1,
              categoryId: 1,
              title: "Farmers market",
              amount: "42.35",
              amountCents: 4235,
              transactionDate: "2026-05-08",
              notes: "fresh apples",
              currency: "USD",
              createdAt: 123,
              updatedAt: 123
            }
          ])
        })}
      />
    );

    expect(await screen.findByRole("heading", { name: "Transactions" })).toBeInTheDocument();
    expect(await screen.findByText("Farmers market")).toBeInTheDocument();
    expect(screen.getByText("$42.35")).toBeInTheDocument();
  });

  it("renders the monthly budget dashboard with the selected month and no-budget state", async () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentMonthLabel = new Intl.DateTimeFormat("en-US", {
      month: "long",
      timeZone: "UTC",
      year: "numeric"
    }).format(new Date(`${currentMonth}-01T00:00:00.000Z`));
    const getBudgetSummary = vi.fn().mockResolvedValue({
      month: currentMonth,
      budget: null,
      totalSpent: "12.50",
      totalSpentCents: 1250,
      remaining: null,
      remainingCents: null,
      usagePercentage: null,
      currency: "USD"
    });

    render(
      <App
        authClient={createAuthClient({ getCurrentUser: vi.fn().mockResolvedValue(signedInUser) })}
        categoryClient={createCategoryClient({})}
        transactionClient={createTransactionClient({})}
        budgetClient={createBudgetClient({ getBudgetSummary })}
      />
    );

    expect(await screen.findByRole("heading", { name: "Monthly budget" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Budget month")).not.toBeInTheDocument();
    expect((await screen.findAllByText("No budget set"))[0]).toBeInTheDocument();
    expect(screen.getByText(`${currentMonthLabel} budget`)).toBeInTheDocument();
    expect(screen.getByText("Remaining")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Expand budget" })).toHaveAttribute("aria-expanded", "false");
    expect(getBudgetSummary).toHaveBeenCalledWith(currentMonth);

    await userEvent.click(screen.getByRole("button", { name: "Expand budget" }));

    expect(screen.getByLabelText("Budget month")).toHaveValue(currentMonth);
    await waitFor(() => expect(screen.queryByText(`${currentMonthLabel} budget`)).not.toBeInTheDocument());
    expect(screen.getByText("$12.50")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Collapse budget" })).toHaveAttribute("aria-expanded", "true");
  });

  it("saves a monthly budget from the dashboard", async () => {
    const user = userEvent.setup();
    const currentMonth = new Date().toISOString().slice(0, 7);
    const setBudget = vi.fn().mockResolvedValue({
      id: 1,
      month: currentMonth,
      amount: "600.00",
      amountCents: 60000,
      currency: "USD",
      createdAt: 123,
      updatedAt: 123
    });
    const getBudgetSummary = vi
      .fn()
      .mockResolvedValueOnce({
        month: currentMonth,
        budget: null,
        totalSpent: "12.50",
        totalSpentCents: 1250,
        remaining: null,
        remainingCents: null,
        usagePercentage: null,
        currency: "USD"
      })
      .mockResolvedValue({
        month: currentMonth,
        budget: {
          id: 1,
          month: currentMonth,
          amount: "600.00",
          amountCents: 60000,
          currency: "USD",
          createdAt: 123,
          updatedAt: 123
        },
        totalSpent: "12.50",
        totalSpentCents: 1250,
        remaining: "587.50",
        remainingCents: 58750,
        usagePercentage: 2.08,
        currency: "USD"
      });

    render(
      <App
        authClient={createAuthClient({ getCurrentUser: vi.fn().mockResolvedValue(signedInUser) })}
        categoryClient={createCategoryClient({})}
        transactionClient={createTransactionClient({})}
        budgetClient={createBudgetClient({ getBudgetSummary, setBudget })}
      />
    );

    await user.click(await screen.findByRole("button", { name: "Expand budget" }));
    await user.click(screen.getByRole("button", { name: "Save budget" }));

    expect(await screen.findByText("Budget amount is required")).toBeInTheDocument();
    expect(screen.getByLabelText("Monthly budget amount")).toHaveAttribute("aria-invalid", "true");

    await user.type(await screen.findByLabelText("Monthly budget amount"), "600.00");
    await user.click(screen.getByRole("button", { name: "Save budget" }));

    await waitFor(() => expect(setBudget).toHaveBeenCalledWith(currentMonth, { amount: "600.00", currency: "USD" }));
    expect((await screen.findAllByText("$587.50"))[0]).toBeInTheDocument();
    expect(screen.getAllByText("2.08%")[0]).toBeInTheDocument();
  });

  it("applies transaction filters immediately and clears them", async () => {
    const user = userEvent.setup();
    const listTransactions = vi.fn().mockResolvedValue([]);

    render(
      <App
        authClient={createAuthClient({ getCurrentUser: vi.fn().mockResolvedValue(signedInUser) })}
        categoryClient={createCategoryClient({
          listCategories: vi.fn().mockResolvedValue([{ id: 2, name: "Groceries", createdAt: 123, updatedAt: 123 }])
        })}
        transactionClient={createTransactionClient({ listTransactions })}
      />
    );

    const searchInput = await screen.findByLabelText("Search transactions");
    await waitFor(() => expect(listTransactions).toHaveBeenCalledWith());

    expect(screen.queryByRole("button", { name: "Apply filters" })).not.toBeInTheDocument();

    await user.type(searchInput, "apple");
    await user.selectOptions(screen.getByLabelText("Filter by category"), "2");
    await user.type(screen.getByLabelText("From date"), "2026-05-01");
    await user.type(screen.getByLabelText("To date"), "2026-05-31");
    await user.type(screen.getByLabelText("Minimum amount"), "20");
    await user.type(screen.getByLabelText("Maximum amount"), "50");

    await waitFor(() =>
      expect(listTransactions).toHaveBeenLastCalledWith({
        search: "apple",
        categoryId: 2,
        dateFrom: "2026-05-01",
        dateTo: "2026-05-31",
        amountMin: "20",
        amountMax: "50"
      })
    );

    await user.click(screen.getByRole("button", { name: "Clear filters" }));

    await waitFor(() => expect(listTransactions).toHaveBeenLastCalledWith({}));
    expect(searchInput).toHaveValue("");
    expect(screen.getByLabelText("Filter by category")).toHaveValue("");
    expect(screen.getByLabelText("From date")).toHaveValue("");
    expect(screen.getByLabelText("To date")).toHaveValue("");
    expect(screen.getByLabelText("Minimum amount")).toHaveValue("");
    expect(screen.getByLabelText("Maximum amount")).toHaveValue("");
  });

  it("shows a clear no-results state when live transaction filters match nothing", async () => {
    const user = userEvent.setup();
    const listTransactions = vi.fn().mockResolvedValue([]);

    render(
      <App
        authClient={createAuthClient({ getCurrentUser: vi.fn().mockResolvedValue(signedInUser) })}
        categoryClient={createCategoryClient({})}
        transactionClient={createTransactionClient({ listTransactions })}
      />
    );

    await user.type(await screen.findByLabelText("Search transactions"), "not-a-real-expense");

    expect(await screen.findByText("No transactions match")).toBeInTheDocument();
    expect(screen.getByText("Adjust filters to broaden the ledger.")).toBeInTheDocument();
  });

  it("opens native date pickers when date controls are clicked", async () => {
    const user = userEvent.setup();
    const showPicker = vi.fn();
    const originalShowPicker = HTMLInputElement.prototype.showPicker;
    HTMLInputElement.prototype.showPicker = showPicker;

    try {
      render(
        <App
          authClient={createAuthClient({ getCurrentUser: vi.fn().mockResolvedValue(signedInUser) })}
          categoryClient={createCategoryClient({})}
          transactionClient={createTransactionClient({})}
        />
      );

      await user.click(await screen.findByLabelText("From date"));
      expect(showPicker).toHaveBeenCalledTimes(1);

      await user.click(screen.getByRole("button", { name: "Expand budget" }));
      await user.click(await screen.findByLabelText("Budget month"));
      expect(showPicker).toHaveBeenCalledTimes(2);
    } finally {
      if (originalShowPicker) {
        HTMLInputElement.prototype.showPicker = originalShowPicker;
      } else {
        Reflect.deleteProperty(HTMLInputElement.prototype, "showPicker");
      }
    }
  });

  it("validates and creates transactions from the authenticated homepage", async () => {
    const user = userEvent.setup();
    const createTransaction = vi.fn().mockResolvedValue({
      id: 1,
      categoryId: 1,
      title: "Lunch",
      amount: "12.50",
      amountCents: 1250,
      transactionDate: "2026-05-08",
      notes: null,
      currency: "USD",
      createdAt: 123,
      updatedAt: 123
    });

    render(
      <App
        authClient={createAuthClient({ getCurrentUser: vi.fn().mockResolvedValue(signedInUser) })}
        categoryClient={createCategoryClient({
          listCategories: vi.fn().mockResolvedValue([{ id: 1, name: "Food", createdAt: 123, updatedAt: 123 }])
        })}
        transactionClient={createTransactionClient({ createTransaction })}
      />
    );

    await user.click(await screen.findByRole("button", { name: "Add transaction" }));
    await user.click(screen.getByRole("button", { name: "Save transaction" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Transaction title is required");
    expect(screen.getByLabelText("Transaction title")).toHaveAttribute("aria-invalid", "true");
    expect(createTransaction).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText("Transaction title"), "Lunch");
    await user.type(screen.getByLabelText("Amount"), "12.50");
    await user.type(screen.getByLabelText("Transaction date"), "2026-05-08");
    await user.selectOptions(screen.getByLabelText("Category"), "1");
    await user.click(screen.getByRole("button", { name: "Save transaction" }));

    await waitFor(() =>
      expect(createTransaction).toHaveBeenCalledWith({
        title: "Lunch",
        amount: "12.50",
        transactionDate: "2026-05-08",
        categoryId: 1,
        notes: null,
        currency: "USD"
      })
    );
    expect(await screen.findByText("Lunch")).toBeInTheDocument();
  });

  it("refreshes the monthly budget summary after creating a transaction", async () => {
    const user = userEvent.setup();
    const currentMonth = new Date().toISOString().slice(0, 7);
    const getBudgetSummary = vi.fn().mockResolvedValue({
      month: currentMonth,
      budget: {
        id: 1,
        month: currentMonth,
        amount: "100.00",
        amountCents: 10000,
        currency: "USD",
        createdAt: 123,
        updatedAt: 123
      },
      totalSpent: "0.00",
      totalSpentCents: 0,
      remaining: "100.00",
      remainingCents: 10000,
      usagePercentage: 0,
      currency: "USD"
    });
    const createTransaction = vi.fn().mockResolvedValue({
      id: 1,
      categoryId: 1,
      title: "Lunch",
      amount: "12.50",
      amountCents: 1250,
      transactionDate: "2026-05-08",
      notes: null,
      currency: "USD",
      createdAt: 123,
      updatedAt: 123
    });

    render(
      <App
        authClient={createAuthClient({ getCurrentUser: vi.fn().mockResolvedValue(signedInUser) })}
        categoryClient={createCategoryClient({
          listCategories: vi.fn().mockResolvedValue([{ id: 1, name: "Food", createdAt: 123, updatedAt: 123 }])
        })}
        transactionClient={createTransactionClient({ createTransaction })}
        budgetClient={createBudgetClient({ getBudgetSummary })}
      />
    );

    await user.click(await screen.findByRole("button", { name: "Add transaction" }));
    await user.type(screen.getByLabelText("Transaction title"), "Lunch");
    await user.type(screen.getByLabelText("Amount"), "12.50");
    await user.type(screen.getByLabelText("Transaction date"), "2026-05-08");
    await user.selectOptions(screen.getByLabelText("Category"), "1");
    await user.click(screen.getByRole("button", { name: "Save transaction" }));

    await waitFor(() => expect(createTransaction).toHaveBeenCalled());
    await waitFor(() => expect(getBudgetSummary).toHaveBeenCalledTimes(2));
  });

  it("renders and dismisses inline budget alert banners", async () => {
    const user = userEvent.setup();
    let alertListener: ((alert: BudgetAlert) => void) | null = null;
    const budgetAlertClient = createBudgetAlertClient((onAlert) => {
      alertListener = onAlert;
    });

    render(
      <App
        authClient={createAuthClient({ getCurrentUser: vi.fn().mockResolvedValue(signedInUser) })}
        categoryClient={createCategoryClient({})}
        transactionClient={createTransactionClient({})}
        budgetClient={createBudgetClient({})}
        budgetAlertClient={budgetAlertClient}
      />
    );

    expect(await screen.findByRole("heading", { name: "Monthly budget" })).toBeInTheDocument();
    await waitFor(() => expect(budgetAlertClient.subscribe).toHaveBeenCalledTimes(1));

    act(() => {
      alertListener?.({
        month: "2026-05",
        threshold: 80,
        usagePercentage: 82.5,
        totalSpent: "825.00",
        budgetAmount: "1000.00",
        currency: "USD",
        message: "You have used 80% of your May budget."
      });
    });

    expect(await screen.findByText("You have used 80% of your May budget.")).toBeInTheDocument();
    expect(screen.getByText("$825.00 spent of $1000.00")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Dismiss 80% budget alert" }));

    expect(screen.queryByText("You have used 80% of your May budget.")).not.toBeInTheDocument();
  });

  it("edits transactions inline without opening the create form above the list", async () => {
    const user = userEvent.setup();
    const updateTransaction = vi.fn().mockResolvedValue({
      id: 1,
      categoryId: 1,
      title: "Dinner",
      amount: "18.25",
      amountCents: 1825,
      transactionDate: "2026-05-09",
      notes: "soup",
      currency: "USD",
      createdAt: 123,
      updatedAt: 456
    });

    render(
      <App
        authClient={createAuthClient({ getCurrentUser: vi.fn().mockResolvedValue(signedInUser) })}
        categoryClient={createCategoryClient({
          listCategories: vi.fn().mockResolvedValue([{ id: 1, name: "Food", createdAt: 123, updatedAt: 123 }])
        })}
        transactionClient={createTransactionClient({
          listTransactions: vi.fn().mockResolvedValue([
            {
              id: 1,
              categoryId: 1,
              title: "Lunch",
              amount: "12.50",
              amountCents: 1250,
              transactionDate: "2026-05-08",
              notes: null,
              currency: "USD",
              createdAt: 123,
              updatedAt: 123
            }
          ]),
          updateTransaction
        })}
      />
    );

    await user.click(await screen.findByRole("button", { name: "Edit Lunch" }));

    const titleInput = screen.getByLabelText("Edit transaction title");
    const editRow = titleInput.closest("li");

    expect(editRow).toHaveClass("md:items-end");
    expect(editRow).toHaveClass("mode-transition");
    expect(editRow).toContainElement(screen.getByDisplayValue("12.50"));
    expect(screen.queryByLabelText("Transaction title")).not.toBeInTheDocument();

    await user.clear(titleInput);
    await user.type(titleInput, "Dinner");
    await user.clear(screen.getByLabelText("Edit amount"));
    await user.type(screen.getByLabelText("Edit amount"), "18.25");
    await user.clear(screen.getByLabelText("Edit transaction date"));
    await user.type(screen.getByLabelText("Edit transaction date"), "2026-05-09");
    await user.type(screen.getByLabelText("Edit notes"), "soup");
    await user.click(screen.getByRole("button", { name: "Save transaction changes" }));

    await waitFor(() =>
      expect(updateTransaction).toHaveBeenCalledWith(1, {
        title: "Dinner",
        amount: "18.25",
        transactionDate: "2026-05-09",
        categoryId: 1,
        notes: "soup",
        currency: "USD"
      })
    );
    expect(await screen.findByText("Dinner")).toBeInTheDocument();
  });

  it("asks for approval before deleting transactions without moving the row layout", async () => {
    const user = userEvent.setup();
    const deleteTransaction = vi.fn().mockResolvedValue(undefined);

    render(
      <App
        authClient={createAuthClient({ getCurrentUser: vi.fn().mockResolvedValue(signedInUser) })}
        categoryClient={createCategoryClient({
          listCategories: vi.fn().mockResolvedValue([{ id: 1, name: "Food", createdAt: 123, updatedAt: 123 }])
        })}
        transactionClient={createTransactionClient({
          listTransactions: vi.fn().mockResolvedValue([
            {
              id: 1,
              categoryId: 1,
              title: "Lunch",
              amount: "12.50",
              amountCents: 1250,
              transactionDate: "2026-05-08",
              notes: null,
              currency: "USD",
              createdAt: 123,
              updatedAt: 123
            }
          ]),
          deleteTransaction
        })}
      />
    );

    await user.click(await screen.findByRole("button", { name: "Delete Lunch" }));

    expect(deleteTransaction).not.toHaveBeenCalled();
    const confirmationMessage = screen.getByText("Are you sure you want to delete transaction Lunch?");
    expect(confirmationMessage).toBeInTheDocument();
    expect(confirmationMessage.closest("[data-delete-confirmation-overlay]")).toHaveClass("absolute");

    await user.click(screen.getByRole("button", { name: "Yes, delete Lunch" }));

    await waitFor(() => expect(deleteTransaction).toHaveBeenCalledWith(1));
    expect(screen.queryByText("Lunch")).not.toBeInTheDocument();
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

  it("falls back to initials when the current user's avatar image cannot load", async () => {
    render(
      <App
        authClient={createAuthClient({
          getCurrentUser: vi.fn().mockResolvedValue({
            id: 1,
            provider: "github",
            email: null,
            displayName: "GitHub Test User",
            avatarUrl: "https://example.com/missing-avatar.png"
          })
        })}
      />
    );

    fireEvent.error(await screen.findByRole("img", { name: "GitHub Test User avatar" }));

    expect(screen.queryByRole("img", { name: "GitHub Test User avatar" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("GitHub Test User initials")).toHaveTextContent("GT");
    expect(screen.getByText("GitHub Test User")).toBeInTheDocument();
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

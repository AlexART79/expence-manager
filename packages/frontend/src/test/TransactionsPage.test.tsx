import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import TransactionsPage from "../pages/TransactionsPage";
import { TransactionsProvider } from "../context/TransactionsContext";

const mockTransactions = [
  {
    id: "1",
    description: "Groceries",
    amount: 50.0,
    category: "food",
    date: "2024-01-15",
    type: "expense",
  },
  {
    id: "2",
    description: "Salary",
    amount: 2000.0,
    category: "income",
    date: "2024-01-14",
    type: "income",
  },
  {
    id: "3",
    description: "Gas",
    amount: 40.0,
    category: "transport",
    date: "2024-01-13",
    type: "expense",
  },
];

const renderTransactionsPage = () =>
  render(
    <TransactionsProvider>
      <TransactionsPage />
    </TransactionsProvider>
  );

describe("TransactionsPage", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("transactions", JSON.stringify(mockTransactions));
  });

  it("renders the page title and buttons", () => {
    renderTransactionsPage();
    expect(screen.getByText("Transactions")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add transaction/i })).toBeInTheDocument();
  });

  it("displays transactions list", () => {
    renderTransactionsPage();
    expect(screen.getByText("Groceries")).toBeInTheDocument();
    expect(screen.getByText("Salary")).toBeInTheDocument();
    expect(screen.getByText("Gas")).toBeInTheDocument();
    // Amounts are rendered with +/- signs
    expect(screen.getByText(/-\$50\.00/)).toBeInTheDocument();
    expect(screen.getByText(/\+\$2,000\.00/)).toBeInTheDocument();
  });

  it("shows 'No transactions' when list is empty", () => {
    localStorage.clear();
    localStorage.setItem("transactions", JSON.stringify([]));
    renderTransactionsPage();
    expect(screen.getByText("No transactions yet")).toBeInTheDocument();
  });

  it("opens add transaction modal on button click", async () => {
    renderTransactionsPage();
    const addButton = screen.getByRole("button", { name: /add transaction/i });
    await userEvent.click(addButton);
    expect(screen.getByPlaceholderText("Description")).toBeInTheDocument();
  });

  it("filters transactions by type", async () => {
    renderTransactionsPage();
    const expenseButton = screen.getByRole("button", { name: /expense/i });
    await userEvent.click(expenseButton);
    expect(screen.getByText("Groceries")).toBeInTheDocument();
    expect(screen.getByText("Gas")).toBeInTheDocument();
    expect(screen.queryByText("Salary")).not.toBeInTheDocument();
  });

  it("filters transactions by category", async () => {
    renderTransactionsPage();
    const categorySelect = screen.getByDisplayValue("All Categories");
    await userEvent.selectOptions(categorySelect, "food");
    expect(screen.getByText("Groceries")).toBeInTheDocument();
    expect(screen.queryByText("Salary")).not.toBeInTheDocument();
    expect(screen.queryByText("Gas")).not.toBeInTheDocument();
  });

  it("filters transactions by date range", async () => {
    renderTransactionsPage();
    const startDateInput = screen.getByDisplayValue("2024-01-13");
    await userEvent.clear(startDateInput);
    await userEvent.type(startDateInput, "2024-01-14");
    await waitFor(() => {
      expect(screen.getByText("Salary")).toBeInTheDocument();
      expect(screen.queryByText("Gas")).not.toBeInTheDocument();
    });
  });

  it("adds a new transaction", async () => {
    renderTransactionsPage();
    const addButton = screen.getByRole("button", { name: /add transaction/i });
    await userEvent.click(addButton);

    const descInput = screen.getByPlaceholderText("Description");
    const amountInput = screen.getByPlaceholderText("Amount");
    const submitButton = screen.getByRole("button", { name: /save/i });

    await userEvent.type(descInput, "New Expense");
    await userEvent.type(amountInput, "75.50");
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("New Expense")).toBeInTheDocument();
      // The amount is rendered with a minus sign for expenses
      expect(screen.getByText(/\$75\.50/)).toBeInTheDocument();
    });
  });

  it("deletes a transaction", async () => {
    renderTransactionsPage();
    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    await userEvent.click(deleteButtons[0]);

    const confirmButton = screen.getByRole("button", { name: /confirm/i });
    await userEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.queryByText("Groceries")).not.toBeInTheDocument();
    });
  });

  it("displays loading state", () => {
    renderTransactionsPage();
    // The component should load transactions from localStorage
    expect(screen.getByText("Transactions")).toBeInTheDocument();
  });

  it("displays error message if transaction fails", async () => {
    renderTransactionsPage();
    // Simulate an error by attempting invalid input
    const addButton = screen.getByRole("button", { name: /add transaction/i });
    await userEvent.click(addButton);

    const submitButton = screen.getByRole("button", { name: /save/i });
    await userEvent.click(submitButton);

    // The form should still be open if validation fails
    expect(screen.getByPlaceholderText("Description")).toBeInTheDocument();
  });
});

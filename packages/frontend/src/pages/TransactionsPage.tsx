import { useState, useEffect } from "react";
import { useTransactions } from "../context/TransactionsContext";
import TransactionForm from "../components/TransactionForm";
import TransactionList from "../components/TransactionList";
import ConfirmButton from "../components/ConfirmButton";
import "./TransactionsPage.css";

interface FilterState {
  type: "all" | "income" | "expense";
  category: string;
  startDate: string;
  endDate: string;
}

export default function TransactionsPage() {
  const { transactions, addTransaction, deleteTransaction } = useTransactions();
  const [showAddModal, setShowAddModal] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    type: "all",
    category: "All Categories",
    startDate: "2024-01-13",
    endDate: new Date().toISOString().split("T")[0],
  });
  const [filteredTransactions, setFilteredTransactions] = useState(transactions);

  useEffect(() => {
    let filtered = transactions;

    // Filter by type
    if (filters.type !== "all") {
      filtered = filtered.filter((t) => t.type === filters.type);
    }

    // Filter by category
    if (filters.category !== "All Categories") {
      filtered = filtered.filter((t) => t.category === filters.category);
    }

    // Filter by date range
    if (filters.startDate) {
      filtered = filtered.filter((t) => t.date >= filters.startDate);
    }
    if (filters.endDate) {
      filtered = filtered.filter((t) => t.date <= filters.endDate);
    }

    setFilteredTransactions(filtered);
  }, [transactions, filters]);

  const handleAddTransaction = (data: {
    description: string;
    amount: number;
    category: string;
    date: string;
    type: "income" | "expense";
  }) => {
    addTransaction(data);
    setShowAddModal(false);
  };

  const handleDeleteTransaction = (id: string) => {
    deleteTransaction(id);
  };

  const categories = Array.from(
    new Set(transactions.map((t) => t.category))
  ).sort();

  return (
    <div className="transactions-page">
      <div className="transactions-header">
        <h1>Transactions</h1>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          Add Transaction
        </button>
      </div>

      <div className="filters-section">
        <div className="filter-group">
          <label>Type:</label>
          <div className="filter-buttons">
            <button
              className={`filter-btn ${filters.type === "all" ? "active" : ""}`}
              onClick={() => setFilters({ ...filters, type: "all" })}
            >
              All
            </button>
            <button
              className={`filter-btn ${filters.type === "income" ? "active" : ""}`}
              onClick={() => setFilters({ ...filters, type: "income" })}
            >
              Income
            </button>
            <button
              className={`filter-btn ${filters.type === "expense" ? "active" : ""}`}
              onClick={() => setFilters({ ...filters, type: "expense" })}
            >
              Expense
            </button>
          </div>
        </div>

        <div className="filter-group">
          <label htmlFor="category-select">Category:</label>
          <select
            id="category-select"
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          >
            <option>All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="start-date">From:</label>
          <input
            id="start-date"
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="end-date">To:</label>
          <input
            id="end-date"
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          />
        </div>
      </div>

      <div className="transactions-content">
        {filteredTransactions.length === 0 ? (
          <p className="no-transactions">No transactions yet</p>
        ) : (
          <TransactionList
            transactions={filteredTransactions}
            onDelete={handleDeleteTransaction}
          />
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add Transaction</h2>
            <TransactionForm
              onSubmit={handleAddTransaction}
              onCancel={() => setShowAddModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

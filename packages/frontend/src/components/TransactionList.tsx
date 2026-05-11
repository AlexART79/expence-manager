import { useState } from "react";
import type { Transaction } from "../context/TransactionsContext";
import "./TransactionList.css";

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
}

export default function TransactionList({ transactions, onDelete }: TransactionListProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const formatAmount = (amount: number, type: string) => {
    const formatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
    return formatted;
  };

  const handleDeleteClick = (id: string) => {
    setDeleteConfirm(id);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirm) {
      onDelete(deleteConfirm);
      setDeleteConfirm(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirm(null);
  };

  return (
    <div className="transaction-list">
      {transactions.length === 0 ? (
        <p className="empty-message">No transactions</p>
      ) : (
        <table className="transactions-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.id} className={`transaction-row ${transaction.type}`}>
                <td className="date">{transaction.date}</td>
                <td className="description">{transaction.description}</td>
                <td className="category">
                  {transaction.category.charAt(0).toUpperCase() + transaction.category.slice(1)}
                </td>
                <td className={`amount ${transaction.type}`}>
                  {transaction.type === "income" ? "+" : "-"}
                  {formatAmount(transaction.amount, transaction.type)}
                </td>
                <td className="type">
                  <span className={`type-badge ${transaction.type}`}>
                    {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                  </span>
                </td>
                <td className="actions">
                  {deleteConfirm === transaction.id ? (
                    <div className="confirm-actions">
                      <button
                        className="btn-cancel"
                        onClick={handleCancelDelete}
                        title="Cancel deletion"
                      >
                        Cancel
                      </button>
                      <button
                        className="btn-confirm"
                        onClick={handleConfirmDelete}
                        title="Confirm deletion"
                      >
                        Confirm
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn-delete"
                      onClick={() => handleDeleteClick(transaction.id)}
                      title="Delete transaction"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

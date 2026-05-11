import { useState } from "react";
import type { Transaction } from "../context/TransactionsContext";
import "./TransactionForm.css";

interface TransactionFormProps {
  onSubmit: (data: Omit<Transaction, "id">) => void;
  onCancel: () => void;
}

export default function TransactionForm({ onSubmit, onCancel }: TransactionFormProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("food");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [type, setType] = useState<"income" | "expense">("expense");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!description.trim()) {
      setError("Description is required");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError("Amount must be greater than 0");
      return;
    }

    const formData = {
      description: description.trim(),
      amount: parseFloat(amount),
      category,
      date,
      type,
    };

    onSubmit(formData);

    // Reset form
    setDescription("");
    setAmount("");
    setCategory("food");
    setDate(new Date().toISOString().split("T")[0]);
    setType("expense");
  };

  return (
    <form onSubmit={handleSubmit} className="transaction-form">
      {error && <div className="error-message">{error}</div>}

      <div className="form-group">
        <label htmlFor="description">Description</label>
        <input
          id="description"
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label htmlFor="amount">Amount</label>
        <input
          id="amount"
          type="number"
          placeholder="Amount"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label htmlFor="type">Type</label>
        <select id="type" value={type} onChange={(e) => setType(e.target.value as "income" | "expense")}>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="category">Category</label>
        <select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="food">Food</option>
          <option value="transport">Transport</option>
          <option value="entertainment">Entertainment</option>
          <option value="utilities">Utilities</option>
          <option value="income">Income</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="date">Date</label>
        <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          Save
        </button>
      </div>
    </form>
  );
}

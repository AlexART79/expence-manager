import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  type: "income" | "expense";
}

interface TransactionsContextValue {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  addTransaction: (data: Omit<Transaction, "id">) => void;
  deleteTransaction: (id: string) => void;
}

const TransactionsContext = createContext<TransactionsContextValue | null>(null);

export function TransactionsProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load transactions from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("transactions");
      if (stored) {
        setTransactions(JSON.parse(stored));
      }
    } catch (err) {
      setError("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, []);

  // Save transactions to localStorage whenever they change
  useEffect(() => {
    if (!loading) {
      localStorage.setItem("transactions", JSON.stringify(transactions));
    }
  }, [transactions, loading]);

  const addTransaction = (data: Omit<Transaction, "id">) => {
    try {
      const newTransaction: Transaction = {
        ...data,
        id: Date.now().toString(),
      };
      setTransactions((prev) => [newTransaction, ...prev]);
      setError(null);
    } catch (err) {
      setError("Failed to add transaction");
    }
  };

  const deleteTransaction = (id: string) => {
    try {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      setError(null);
    } catch (err) {
      setError("Failed to delete transaction");
    }
  };

  return (
    <TransactionsContext.Provider
      value={{ transactions, loading, error, addTransaction, deleteTransaction }}
    >
      {children}
    </TransactionsContext.Provider>
  );
}

export function useTransactions(): TransactionsContextValue {
  const ctx = useContext(TransactionsContext);
  if (!ctx) {
    throw new Error("useTransactions must be used inside TransactionsProvider");
  }
  return ctx;
}

import { useEffect, useRef, useState } from "react";
import type { Category, CategoryClient } from "../categories/categoryClient";
import type { Transaction, TransactionClient } from "./transactionClient";
import { TRANSACTION_MESSAGES, TRANSACTION_PENDING_ACTIONS } from "./transactionConstants";
import {
  createEmptyTransactionFilters,
  createEmptyTransactionForm,
  createTransactionFormFromTransaction,
  sortTransactions,
  toTransactionFilters,
  toTransactionInput,
  validateTransactionForm
} from "./transactionFormState";
import type { TransactionFilterFormState, TransactionFormState } from "./transactionFormState";

export function useTransactionManager(categoryClient: CategoryClient, transactionClient: TransactionClient) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filters, setFilters] = useState<TransactionFilterFormState>(createEmptyTransactionFilters());
  const [form, setForm] = useState<TransactionFormState>(createEmptyTransactionForm());
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const filterRequestId = useRef(0);

  useEffect(() => {
    let isCurrent = true;

    setIsLoadingTransactions(true);
    Promise.all([categoryClient.listCategories(), transactionClient.listTransactions()])
      .then(([loadedCategories, loadedTransactions]) => {
        if (isCurrent) {
          setCategories(loadedCategories);
          setTransactions(loadedTransactions);
          setError(null);
        }
      })
      .catch((loadError: unknown) => {
        if (isCurrent) {
          setError(loadError instanceof Error ? loadError.message : TRANSACTION_MESSAGES.loadFailed);
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoadingTransactions(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [categoryClient, transactionClient]);

  async function runTransactionFilters(nextFilters: TransactionFilterFormState) {
    const requestId = filterRequestId.current + 1;
    filterRequestId.current = requestId;
    setPendingAction(TRANSACTION_PENDING_ACTIONS.filter);
    try {
      const loadedTransactions = await transactionClient.listTransactions(toTransactionFilters(nextFilters));
      if (filterRequestId.current === requestId) {
        setTransactions(loadedTransactions);
        setError(null);
      }
    } catch (filterError) {
      if (filterRequestId.current === requestId) {
        setError(filterError instanceof Error ? filterError.message : TRANSACTION_MESSAGES.filterFailed);
      }
    } finally {
      if (filterRequestId.current === requestId) {
        setPendingAction(null);
      }
    }
  }

  function updateFilters(nextFilters: TransactionFilterFormState) {
    setFilters(nextFilters);
    void runTransactionFilters(nextFilters);
  }

  function updateFilter<Key extends keyof TransactionFilterFormState>(
    key: Key,
    value: TransactionFilterFormState[Key]
  ) {
    updateFilters({ ...filters, [key]: value });
  }

  function clearFilters() {
    updateFilters(createEmptyTransactionFilters());
  }

  async function saveTransaction() {
    const validationError = validateTransactionForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    const input = toTransactionInput(form);
    const action = editingTransaction
      ? TRANSACTION_PENDING_ACTIONS.update(editingTransaction.id)
      : TRANSACTION_PENDING_ACTIONS.create;
    setPendingAction(action);
    try {
      const saved = editingTransaction
        ? await transactionClient.updateTransaction(editingTransaction.id, input)
        : await transactionClient.createTransaction(input);

      setTransactions((current) =>
        editingTransaction
          ? current.map((transaction) => (transaction.id === saved.id ? saved : transaction)).sort(sortTransactions)
          : [saved, ...current].sort(sortTransactions)
      );
      setForm(createEmptyTransactionForm());
      setEditingTransaction(null);
      setIsFormOpen(false);
      setError(null);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : TRANSACTION_MESSAGES.saveFailed);
    } finally {
      setPendingAction(null);
    }
  }

  async function deleteTransaction(transactionId: number) {
    setPendingAction(TRANSACTION_PENDING_ACTIONS.delete(transactionId));
    try {
      await transactionClient.deleteTransaction(transactionId);
      setTransactions((current) => current.filter((transaction) => transaction.id !== transactionId));
      setDeleteConfirmationId(null);
      setError(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : TRANSACTION_MESSAGES.deleteFailed);
    } finally {
      setPendingAction(null);
    }
  }

  function startCreate() {
    setEditingTransaction(null);
    setForm(createEmptyTransactionForm());
    setDeleteConfirmationId(null);
    setIsFormOpen(true);
  }

  function startEdit(transaction: Transaction) {
    setEditingTransaction(transaction);
    setForm(createTransactionFormFromTransaction(transaction));
    setDeleteConfirmationId(null);
    setIsFormOpen(false);
  }

  function cancelCreate() {
    setIsFormOpen(false);
    setForm(createEmptyTransactionForm());
  }

  function cancelEdit() {
    setEditingTransaction(null);
    setForm(createEmptyTransactionForm());
  }

  return {
    categories,
    transactions,
    filters,
    form,
    setForm,
    editingTransaction,
    deleteConfirmationId,
    setDeleteConfirmationId,
    isFormOpen,
    isLoadingTransactions,
    error,
    pendingAction,
    updateFilter,
    clearFilters,
    saveTransaction,
    deleteTransaction,
    startCreate,
    startEdit,
    cancelCreate,
    cancelEdit
  };
}

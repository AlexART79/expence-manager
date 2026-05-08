import type { Dispatch, SetStateAction } from "react";
import { useEffect, useRef, useState } from "react";
import type { Category, CategoryClient } from "../categories/categoryClient";
import { TransactionFiltersForm } from "./TransactionFiltersForm";
import { TransactionForm } from "./TransactionForm";
import { TransactionRow } from "./TransactionRow";
import type { Transaction, TransactionClient } from "./transactionClient";
import {
  createEmptyTransactionFilters,
  createEmptyTransactionForm,
  createTransactionFormFromTransaction,
  hasActiveTransactionFilters,
  sortTransactions,
  toTransactionFilters,
  toTransactionInput,
  validateTransactionForm
} from "./transactionFormState";
import type { TransactionFilterFormState } from "./transactionFormState";
import type { TransactionFormState } from "./transactionFormState";

export function TransactionManager({
  categoryClient,
  transactionClient
}: {
  categoryClient: CategoryClient;
  transactionClient: TransactionClient;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filters, setFilters] = useState<TransactionFilterFormState>(createEmptyTransactionFilters());
  const [form, setForm] = useState(createEmptyTransactionForm());
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
          setError(loadError instanceof Error ? loadError.message : "Failed to load transactions");
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
    setPendingAction("filter");
    try {
      const loadedTransactions = await transactionClient.listTransactions(toTransactionFilters(nextFilters));
      if (filterRequestId.current === requestId) {
        setTransactions(loadedTransactions);
        setError(null);
      }
    } catch (filterError) {
      if (filterRequestId.current === requestId) {
        setError(filterError instanceof Error ? filterError.message : "Could not filter transactions");
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

  async function handleSaveTransaction() {
    const validationError = validateTransactionForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    const input = toTransactionInput(form);
    const action = editingTransaction ? `update-${editingTransaction.id}` : "create-transaction";
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
      setError(saveError instanceof Error ? saveError.message : "Could not save transaction");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleDeleteTransaction(transactionId: number) {
    setPendingAction(`delete-transaction-${transactionId}`);
    try {
      await transactionClient.deleteTransaction(transactionId);
      setTransactions((current) => current.filter((transaction) => transaction.id !== transactionId));
      setDeleteConfirmationId(null);
      setError(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete transaction");
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

  return (
    <section className="rounded-lg border border-white/10 bg-surface-muted p-5 shadow-xl shadow-black/10 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-accent-strong">Spending ledger</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-normal text-text">Transactions</h2>
        </div>
        <button
          type="button"
          className="inline-flex min-h-10 items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 dark:focus:ring-offset-slate-950"
          onClick={startCreate}
        >
          Add transaction
        </button>
      </div>

      <TransactionFiltersForm
        categories={categories}
        filters={filters}
        isFiltering={pendingAction === "filter"}
        onFilterChange={updateFilter}
        onClear={clearFilters}
      />

      {isFormOpen && !editingTransaction ? (
        <div className="mode-transition mt-5 rounded-md border border-white/10 bg-surface p-4">
          <TransactionForm
            categories={categories}
            form={form}
            setForm={setForm}
            labels={{
              title: "Transaction title",
              amount: "Amount",
              transactionDate: "Transaction date",
              category: "Category",
              notes: "Notes"
            }}
            saveLabel="Save transaction"
            isSaving={pendingAction === "create-transaction"}
            onSave={handleSaveTransaction}
            onCancel={cancelCreate}
          />
        </div>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200" role="alert">
          {error}
        </p>
      ) : null}

      <TransactionList
        categories={categories}
        transactions={transactions}
        form={form}
        setForm={setForm}
        editingTransaction={editingTransaction}
        deleteConfirmationId={deleteConfirmationId}
        isLoading={isLoadingTransactions}
        hasActiveFilters={hasActiveTransactionFilters(filters)}
        pendingAction={pendingAction}
        onStartEdit={startEdit}
        onSave={handleSaveTransaction}
        onCancelEdit={cancelEdit}
        onAskDelete={setDeleteConfirmationId}
        onCancelDelete={() => setDeleteConfirmationId(null)}
        onConfirmDelete={handleDeleteTransaction}
      />
    </section>
  );
}

function TransactionList({
  categories,
  transactions,
  form,
  setForm,
  editingTransaction,
  deleteConfirmationId,
  isLoading,
  hasActiveFilters,
  pendingAction,
  onStartEdit,
  onSave,
  onCancelEdit,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete
}: {
  categories: Category[];
  transactions: Transaction[];
  form: TransactionFormState;
  setForm: Dispatch<SetStateAction<TransactionFormState>>;
  editingTransaction: Transaction | null;
  deleteConfirmationId: number | null;
  isLoading: boolean;
  hasActiveFilters: boolean;
  pendingAction: string | null;
  onStartEdit: (transaction: Transaction) => void;
  onSave: () => void;
  onCancelEdit: () => void;
  onAskDelete: (transactionId: number) => void;
  onCancelDelete: () => void;
  onConfirmDelete: (transactionId: number) => void;
}) {
  if (isLoading) {
    return (
      <div className="mt-5 rounded-md border border-white/10 bg-surface px-4 py-5 text-sm text-text-muted" role="status">
        Loading transactions
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="mt-5 rounded-md border border-dashed border-white/15 bg-surface px-4 py-6">
        <p className="text-sm font-semibold text-text">{hasActiveFilters ? "No transactions match" : "No transactions yet"}</p>
        <p className="mt-1 text-sm text-text-muted">
          {hasActiveFilters ? "Adjust filters to broaden the ledger." : "Add the first expense once categories are ready."}
        </p>
      </div>
    );
  }

  return (
    <ul className="mt-5 grid gap-2">
      {transactions.map((transaction) => (
        <TransactionRow
          key={transaction.id}
          transaction={transaction}
          categories={categories}
          form={form}
          setForm={setForm}
          isEditing={editingTransaction?.id === transaction.id}
          isConfirmingDelete={deleteConfirmationId === transaction.id}
          isSaving={pendingAction === `update-${transaction.id}`}
          isDeleting={pendingAction === `delete-transaction-${transaction.id}`}
          onStartEdit={() => onStartEdit(transaction)}
          onSave={onSave}
          onCancelEdit={onCancelEdit}
          onAskDelete={() => onAskDelete(transaction.id)}
          onCancelDelete={onCancelDelete}
          onConfirmDelete={() => onConfirmDelete(transaction.id)}
        />
      ))}
    </ul>
  );
}

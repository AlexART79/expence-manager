import type { CategoryClient } from "../categories/categoryClient";
import { TRANSACTION_COPY, TRANSACTION_PENDING_ACTIONS } from "./transactionConstants";
import { TransactionFiltersForm } from "./TransactionFiltersForm";
import { TransactionForm } from "./TransactionForm";
import { TransactionList } from "./TransactionList";
import type { TransactionClient } from "./transactionClient";
import { hasActiveTransactionFilters } from "./transactionFormState";
import { useTransactionManager } from "./useTransactionManager";

export function TransactionManager({
  categoryClient,
  transactionClient
}: {
  categoryClient: CategoryClient;
  transactionClient: TransactionClient;
}) {
  const manager = useTransactionManager(categoryClient, transactionClient);

  return (
    <section className="rounded-lg border border-white/10 bg-surface-muted p-5 shadow-xl shadow-black/10 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-accent-strong">{TRANSACTION_COPY.eyebrow}</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-normal text-text">{TRANSACTION_COPY.title}</h2>
        </div>
        <button
          type="button"
          className="inline-flex min-h-10 items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 dark:focus:ring-offset-slate-950"
          onClick={manager.startCreate}
        >
          {TRANSACTION_COPY.addTransaction}
        </button>
      </div>

      <TransactionFiltersForm
        categories={manager.categories}
        filters={manager.filters}
        isFiltering={manager.pendingAction === TRANSACTION_PENDING_ACTIONS.filter}
        onFilterChange={manager.updateFilter}
        onClear={manager.clearFilters}
      />

      {manager.isFormOpen && !manager.editingTransaction ? (
        <div className="mode-transition mt-5 rounded-md border border-white/10 bg-surface p-4">
          <TransactionForm
            categories={manager.categories}
            form={manager.form}
            setForm={manager.setForm}
            labels={TRANSACTION_COPY.createLabels}
            saveLabel={TRANSACTION_COPY.saveTransaction}
            isSaving={manager.pendingAction === TRANSACTION_PENDING_ACTIONS.create}
            onSave={manager.saveTransaction}
            onCancel={manager.cancelCreate}
          />
        </div>
      ) : null}

      {manager.error ? (
        <p className="mt-4 rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200" role="alert">
          {manager.error}
        </p>
      ) : null}

      <TransactionList
        categories={manager.categories}
        transactions={manager.transactions}
        form={manager.form}
        setForm={manager.setForm}
        editingTransaction={manager.editingTransaction}
        deleteConfirmationId={manager.deleteConfirmationId}
        isLoading={manager.isLoadingTransactions}
        hasActiveFilters={hasActiveTransactionFilters(manager.filters)}
        pendingAction={manager.pendingAction}
        onStartEdit={manager.startEdit}
        onSave={manager.saveTransaction}
        onCancelEdit={manager.cancelEdit}
        onAskDelete={manager.setDeleteConfirmationId}
        onCancelDelete={() => manager.setDeleteConfirmationId(null)}
        onConfirmDelete={manager.deleteTransaction}
      />
    </section>
  );
}

import type { CategoryClient } from "../categories/categoryClient";
import { Button } from "../components/Button";
import { InlineAlert } from "../components/InlineAlert";
import { TRANSACTION_COPY, TRANSACTION_PENDING_ACTIONS } from "./transactionConstants";
import { TransactionFiltersForm } from "./TransactionFiltersForm";
import { TransactionForm } from "./TransactionForm";
import { TransactionList } from "./TransactionList";
import type { TransactionClient } from "./transactionClient";
import { hasActiveTransactionFilters } from "./transactionFormState";
import { useTransactionManager } from "./useTransactionManager";

export function TransactionManager({
  categoryClient,
  transactionClient,
  categoryRefreshKey = 0,
  onTransactionsChanged
}: {
  categoryClient: CategoryClient;
  transactionClient: TransactionClient;
  categoryRefreshKey?: number;
  onTransactionsChanged?: () => void;
}) {
  const manager = useTransactionManager(categoryClient, transactionClient, onTransactionsChanged, categoryRefreshKey);

  return (
    <section className="rounded-lg border border-line/35 bg-surface-muted p-5 shadow-xl shadow-slate-950/10 sm:p-6 dark:border-line/10 dark:shadow-black/10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-accent-strong">{TRANSACTION_COPY.eyebrow}</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-normal text-text">{TRANSACTION_COPY.title}</h2>
        </div>
        <Button
          type="button"
          variant="primary"
          onClick={manager.startCreate}
        >
          {TRANSACTION_COPY.addTransaction}
        </Button>
      </div>

      {manager.isFormOpen && !manager.editingTransaction ? (
        <div className="mode-transition mt-5 rounded-md border border-line/45 bg-surface-raised p-4 dark:border-line/10 dark:bg-surface">
          <TransactionForm
            categories={manager.categories}
            form={manager.form}
            setForm={manager.setForm}
            labels={TRANSACTION_COPY.createLabels}
            validationError={manager.formError}
            saveLabel={TRANSACTION_COPY.saveTransaction}
            isSaving={manager.pendingAction === TRANSACTION_PENDING_ACTIONS.create}
            onSave={manager.saveTransaction}
            onCancel={manager.cancelCreate}
          />
        </div>
      ) : (
        <TransactionFiltersForm
          categories={manager.categories}
          filters={manager.filters}
          isFiltering={manager.pendingAction === TRANSACTION_PENDING_ACTIONS.filter}
          onFilterChange={manager.updateFilter}
          onClear={manager.clearFilters}
        />
      )}

      {manager.error ? (
        <InlineAlert className="mt-4">{manager.error}</InlineAlert>
      ) : null}

      <TransactionList
        categories={manager.categories}
        transactions={manager.transactions}
        form={manager.form}
        setForm={manager.setForm}
        formError={manager.formError}
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

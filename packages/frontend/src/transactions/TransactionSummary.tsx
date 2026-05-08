import type { Category } from "../categories/categoryClient";
import type { Transaction } from "./transactionClient";
import { categoryNameFor, formatCurrency } from "./transactionDisplay";

export function TransactionSummary({ transaction, categories }: { transaction: Transaction; categories: Category[] }) {
  return (
    <div className="mode-transition min-w-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <p className="font-semibold text-text">{transaction.title}</p>
        <p className="text-sm font-semibold text-accent-strong">{formatCurrency(transaction.amount)}</p>
        <p className="text-xs text-text-muted">{transaction.transactionDate}</p>
      </div>
      <p className="mt-1 text-xs text-text-muted">
        {categoryNameFor(categories, transaction.categoryId)}
        {transaction.notes ? ` - ${transaction.notes}` : ""}
      </p>
    </div>
  );
}

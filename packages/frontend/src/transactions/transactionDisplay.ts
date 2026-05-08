import type { Category } from "../categories/categoryClient";
import { TRANSACTION_MESSAGES } from "./transactionConstants";

export function categoryNameFor(categories: Category[], categoryId: number) {
  return categories.find((category) => category.id === categoryId)?.name ?? TRANSACTION_MESSAGES.uncategorized;
}

export function formatCurrency(amount: string) {
  return `$${amount}`;
}

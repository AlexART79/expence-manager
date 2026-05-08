import type { Transaction, TransactionFilters, TransactionInput } from "./transactionClient";

export type TransactionFormState = {
  title: string;
  amount: string;
  transactionDate: string;
  categoryId: string;
  notes: string;
  currency: "USD";
};

export type TransactionFilterFormState = {
  search: string;
  categoryId: string;
  dateFrom: string;
  dateTo: string;
  amountMin: string;
  amountMax: string;
};

export function createEmptyTransactionForm(): TransactionFormState {
  return {
    title: "",
    amount: "",
    transactionDate: "",
    categoryId: "",
    notes: "",
    currency: "USD"
  };
}

export function createTransactionFormFromTransaction(transaction: Transaction): TransactionFormState {
  return {
    title: transaction.title,
    amount: transaction.amount,
    transactionDate: transaction.transactionDate,
    categoryId: String(transaction.categoryId),
    notes: transaction.notes ?? "",
    currency: transaction.currency
  };
}

export function validateTransactionForm(form: TransactionFormState) {
  if (!form.title.trim()) {
    return "Transaction title is required";
  }

  if (!/^\d+(\.\d{1,2})?$/.test(form.amount.trim()) || Number(form.amount) <= 0) {
    return "Amount must be greater than 0";
  }

  if (!form.transactionDate) {
    return "Transaction date is required";
  }

  if (!form.categoryId) {
    return "Category is required";
  }

  if (form.currency !== "USD") {
    return "Currency must be USD";
  }

  if (form.notes.length > 500) {
    return "Notes are too long";
  }

  return null;
}

export function toTransactionInput(form: TransactionFormState): TransactionInput {
  const notes = form.notes.trim();
  return {
    title: form.title.trim(),
    amount: form.amount.trim(),
    transactionDate: form.transactionDate,
    categoryId: Number(form.categoryId),
    notes: notes.length > 0 ? notes : null,
    currency: form.currency
  };
}

export function createEmptyTransactionFilters(): TransactionFilterFormState {
  return {
    search: "",
    categoryId: "",
    dateFrom: "",
    dateTo: "",
    amountMin: "",
    amountMax: ""
  };
}

export function toTransactionFilters(filters: TransactionFilterFormState): TransactionFilters {
  const transactionFilters: TransactionFilters = {};
  const search = filters.search.trim();
  const amountMin = filters.amountMin.trim();
  const amountMax = filters.amountMax.trim();

  if (search) {
    transactionFilters.search = search;
  }

  if (filters.categoryId) {
    transactionFilters.categoryId = Number(filters.categoryId);
  }

  if (filters.dateFrom) {
    transactionFilters.dateFrom = filters.dateFrom;
  }

  if (filters.dateTo) {
    transactionFilters.dateTo = filters.dateTo;
  }

  if (amountMin) {
    transactionFilters.amountMin = amountMin;
  }

  if (amountMax) {
    transactionFilters.amountMax = amountMax;
  }

  return transactionFilters;
}

export function hasActiveTransactionFilters(filters: TransactionFilterFormState) {
  return Object.values(filters).some((value) => value.trim().length > 0);
}

export function sortTransactions(left: Transaction, right: Transaction) {
  const dateCompare = right.transactionDate.localeCompare(left.transactionDate);
  return dateCompare === 0 ? right.id - left.id : dateCompare;
}

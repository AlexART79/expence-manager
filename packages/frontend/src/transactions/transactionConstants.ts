export const TRANSACTION_CURRENCY = "USD";

export type TransactionCurrency = typeof TRANSACTION_CURRENCY;

export const TRANSACTION_LIMITS = {
  titleMaxLength: 120,
  notesMaxLength: 500
} as const;

export const TRANSACTION_REGEX = {
  amount: /^\d+(\.\d{1,2})?$/
} as const;

export const TRANSACTION_PENDING_ACTIONS = {
  filter: "filter",
  create: "create-transaction",
  update: (transactionId: number) => `update-${transactionId}`,
  delete: (transactionId: number) => `delete-transaction-${transactionId}`
} as const;

export const TRANSACTION_MESSAGES = {
  loadFailed: "Failed to load transactions",
  filterFailed: "Could not filter transactions",
  saveFailed: "Could not save transaction",
  deleteFailed: "Could not delete transaction",
  titleRequired: "Transaction title is required",
  amountInvalid: "Amount must be greater than 0",
  dateRequired: "Transaction date is required",
  categoryRequired: "Category is required",
  currencyInvalid: "Currency must be USD",
  notesTooLong: "Notes are too long",
  loading: "Loading transactions",
  emptyFilteredTitle: "No transactions match",
  emptyTitle: "No transactions yet",
  emptyFilteredDescription: "Adjust filters to broaden the ledger.",
  emptyDescription: "Add the first expense once categories are ready.",
  uncategorized: "Uncategorized"
} as const;

export const TRANSACTION_COPY = {
  eyebrow: "Spending ledger",
  title: "Transactions",
  addTransaction: "Add transaction",
  clearFilters: "Clear filters",
  filterSearchLabel: "Search transactions",
  filterSearchPlaceholder: "Title or notes",
  filterCategoryLabel: "Filter by category",
  allCategories: "All categories",
  dateFromLabel: "From date",
  dateToLabel: "To date",
  amountMinLabel: "Minimum amount",
  amountMaxLabel: "Maximum amount",
  amountMinPlaceholder: "0.00",
  amountMaxPlaceholder: "999.00",
  createLabels: {
    title: "Transaction title",
    amount: "Amount",
    transactionDate: "Transaction date",
    category: "Category",
    notes: "Notes"
  },
  editLabels: {
    title: "Edit transaction title",
    amount: "Edit amount",
    transactionDate: "Edit transaction date",
    category: "Edit category",
    notes: "Edit notes"
  },
  saveTransaction: "Save transaction",
  saveTransactionChanges: "Save transaction changes",
  titlePlaceholder: "Lunch",
  amountPlaceholder: "12.50",
  chooseCategory: "Choose category",
  currencyLabel: "Currency",
  notesPlaceholder: "Optional",
  cancel: "Cancel",
  edit: "Edit",
  delete: "Delete",
  editAriaLabel: (transactionTitle: string) => `Edit ${transactionTitle}`,
  deleteAriaLabel: (transactionTitle: string) => `Delete ${transactionTitle}`,
  deleteMessage: (transactionTitle: string) => `Are you sure you want to delete transaction ${transactionTitle}?`,
  deleteConfirmLabel: (transactionTitle: string) => `Yes, delete ${transactionTitle}`
} as const;

export const CATEGORY_LIMITS = {
  nameMaxLength: 60
} as const;

export const CATEGORY_PENDING_ACTIONS = {
  create: "create",
  rename: (categoryId: number) => `rename-${categoryId}`,
  delete: (categoryId: number) => `delete-${categoryId}`
} as const;

export const CATEGORY_MESSAGES = {
  nameRequired: "Category name is required",
  loadFailed: "Failed to load categories",
  createFailed: "Could not create category",
  renameFailed: "Could not rename category",
  deleteFailed: "Could not delete category",
  loading: "Loading categories",
  emptyTitle: "No categories yet",
  emptyDescription: "Add the first one to organize future transactions.",
  readyForTransactions: "Ready for transactions"
} as const;

export const CATEGORY_COPY = {
  eyebrow: "Spending structure",
  title: "Categories",
  activeSuffix: "active",
  createLabel: "Category name",
  createPlaceholder: "Category name",
  adding: "Adding",
  addCategory: "Add category",
  collapse: "Collapse categories",
  expand: "Expand categories",
  renameLabel: "Rename category",
  saveName: "Save category name",
  cancel: "Cancel",
  rename: "Rename",
  delete: "Delete",
  deleteMessage: (categoryName: string) => `Are you sure you want to delete category ${categoryName}?`,
  deleteConfirmLabel: (categoryName: string) => `Yes, delete ${categoryName}`,
  renameAriaLabel: (categoryName: string) => `Rename ${categoryName}`,
  deleteAriaLabel: (categoryName: string) => `Delete ${categoryName}`
} as const;

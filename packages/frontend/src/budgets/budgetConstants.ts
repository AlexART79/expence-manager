export const SUPPORTED_BUDGET_CURRENCY = "USD";

export const BUDGET_API_ROUTES = {
  budget: (month: string) => `/api/budgets/${month}`,
  summary: (month: string) => `/api/budgets/${month}/summary`
};

export const BUDGET_FIELD_LIMITS = {
  decimalPattern: /^\d+(\.\d{1,2})?$/
} as const;

export const BUDGET_MESSAGES = {
  amountRequired: "Budget amount is required",
  amountInvalid: "Budget amount must be a valid decimal",
  amountPositive: "Budget amount must be greater than 0",
  loadFailed: "Failed to load budget summary",
  saveFailed: "Failed to save budget"
} as const;

export const BUDGET_UI_TEXT = {
  panelContentId: "budget-panel-content",
  eyebrow: "Budget guardrails",
  heading: "Monthly budget",
  budgetMonthLabel: "Budget month",
  amountLabel: "Monthly budget amount",
  amountPlaceholder: "500.00",
  loading: "Loading...",
  noBudgetSet: "No budget set",
  remaining: "Remaining",
  spent: "Spent",
  budget: "Budget",
  usage: "Usage",
  monthlyUsage: "Monthly usage",
  collapseBudget: "Collapse budget",
  expandBudget: "Expand budget",
  saving: "Saving...",
  saveBudget: "Save budget"
} as const;

export const BUDGET_DISPLAY_FORMAT = {
  defaultAmount: "0.00",
  currencyPrefix: "$",
  emptyValue: "--",
  locale: "en-US",
  timeZone: "UTC",
  monthFormat: "long",
  yearFormat: "numeric",
  percentSuffix: "%",
  usageWidthMin: 0,
  usageWidthMax: 100
} as const;

export const BUDGET_PANEL_ANIMATION = {
  headerSummaryHideDelayMs: 160
} as const;

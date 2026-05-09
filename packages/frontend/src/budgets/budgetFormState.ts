import type { BudgetInput, BudgetSummary } from "./budgetClient";
import { BUDGET_FIELD_LIMITS, BUDGET_MESSAGES, SUPPORTED_BUDGET_CURRENCY } from "./budgetConstants";

export type BudgetFormState = {
  amount: string;
};

export type BudgetFormValidationError = {
  field: "amount";
  message: string;
};

export function getCurrentBudgetMonth(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function createBudgetForm(summary: BudgetSummary | null): BudgetFormState {
  return {
    amount: summary?.budget?.amount ?? ""
  };
}

export function validateBudgetForm(form: BudgetFormState) {
  const amount = form.amount.trim();

  if (!amount) {
    return { field: "amount", message: BUDGET_MESSAGES.amountRequired } satisfies BudgetFormValidationError;
  }

  if (!BUDGET_FIELD_LIMITS.decimalPattern.test(amount)) {
    return { field: "amount", message: BUDGET_MESSAGES.amountInvalid } satisfies BudgetFormValidationError;
  }

  if (Number(amount) <= 0) {
    return { field: "amount", message: BUDGET_MESSAGES.amountPositive } satisfies BudgetFormValidationError;
  }

  return null;
}

export function toBudgetInput(form: BudgetFormState): BudgetInput {
  return {
    amount: form.amount.trim(),
    currency: SUPPORTED_BUDGET_CURRENCY
  };
}

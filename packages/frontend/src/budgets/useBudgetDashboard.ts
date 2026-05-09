import { useEffect, useState } from "react";
import type { BudgetClient, BudgetSummary } from "./budgetClient";
import {
  createBudgetForm,
  getCurrentBudgetMonth,
  toBudgetInput,
  validateBudgetForm,
  type BudgetFormValidationError,
  type BudgetFormState
} from "./budgetFormState";
import { BUDGET_MESSAGES } from "./budgetConstants";

export function useBudgetDashboard(budgetClient: BudgetClient, refreshKey: number) {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentBudgetMonth());
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [form, setForm] = useState<BudgetFormState>(() => createBudgetForm(null));
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<BudgetFormValidationError | null>(null);

  useEffect(() => {
    let isCurrent = true;

    setIsLoading(true);
    budgetClient
      .getBudgetSummary(selectedMonth)
      .then((loadedSummary) => {
        if (isCurrent) {
          setSummary(loadedSummary);
          setForm(createBudgetForm(loadedSummary));
          setError(null);
          setFormError(null);
        }
      })
      .catch((loadError: unknown) => {
        if (isCurrent) {
          setError(loadError instanceof Error ? loadError.message : BUDGET_MESSAGES.loadFailed);
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [budgetClient, selectedMonth, refreshKey]);

  function updateAmount(amount: string) {
    setForm({ amount });
    setFormError(null);
  }

  async function saveBudget() {
    const validationError = validateBudgetForm(form);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setIsSaving(true);
    try {
      await budgetClient.setBudget(selectedMonth, toBudgetInput(form));
      const loadedSummary = await budgetClient.getBudgetSummary(selectedMonth);
      setSummary(loadedSummary);
      setForm(createBudgetForm(loadedSummary));
      setError(null);
      setFormError(null);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : BUDGET_MESSAGES.saveFailed);
    } finally {
      setIsSaving(false);
    }
  }

  return {
    selectedMonth,
    setSelectedMonth,
    summary,
    form,
    updateAmount,
    isLoading,
    isSaving,
    error,
    formError,
    saveBudget
  };
}

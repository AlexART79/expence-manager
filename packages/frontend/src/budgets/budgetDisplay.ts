import { BUDGET_DISPLAY_FORMAT } from "./budgetConstants";

export function formatBudgetCurrency(amount: string | null) {
  return amount === null ? BUDGET_DISPLAY_FORMAT.emptyValue : `${BUDGET_DISPLAY_FORMAT.currencyPrefix}${amount}`;
}

export function formatBudgetMonth(month: string) {
  const [year, monthIndex] = month.split("-").map(Number);

  if (!year || !monthIndex) {
    return month;
  }

  return new Intl.DateTimeFormat(BUDGET_DISPLAY_FORMAT.locale, {
    month: BUDGET_DISPLAY_FORMAT.monthFormat,
    year: BUDGET_DISPLAY_FORMAT.yearFormat,
    timeZone: BUDGET_DISPLAY_FORMAT.timeZone
  }).format(new Date(Date.UTC(year, monthIndex - 1, 1)));
}

export function formatUsagePercentage(value: number | null) {
  return value === null
    ? BUDGET_DISPLAY_FORMAT.emptyValue
    : `${value.toFixed(2).replace(/\.00$/, "")}${BUDGET_DISPLAY_FORMAT.percentSuffix}`;
}

export function getUsageBarWidth(value: number | null) {
  if (value === null) {
    return `${BUDGET_DISPLAY_FORMAT.usageWidthMin}${BUDGET_DISPLAY_FORMAT.percentSuffix}`;
  }

  return `${Math.min(
    Math.max(value, BUDGET_DISPLAY_FORMAT.usageWidthMin),
    BUDGET_DISPLAY_FORMAT.usageWidthMax
  )}${BUDGET_DISPLAY_FORMAT.percentSuffix}`;
}

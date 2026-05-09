import { useEffect, useRef, useState } from "react";
import type { BudgetAlert, BudgetAlertClient } from "./budgetAlertClient";

export function useBudgetAlerts(budgetAlertClient: BudgetAlertClient, isEnabled: boolean) {
  const dismissedAlertIds = useRef(new Set<string>());
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);

  useEffect(() => {
    if (!isEnabled) {
      setAlerts([]);
      return;
    }

    return budgetAlertClient.subscribe((alert) => {
      setAlerts((currentAlerts) => {
        const alertId = getBudgetAlertId(alert);

        if (
          dismissedAlertIds.current.has(alertId) ||
          currentAlerts.some((currentAlert) => getBudgetAlertId(currentAlert) === alertId)
        ) {
          return currentAlerts;
        }

        return [...currentAlerts, alert];
      });
    });
  }, [budgetAlertClient, isEnabled]);

  function dismissAlert(alert: BudgetAlert) {
    const alertId = getBudgetAlertId(alert);

    dismissedAlertIds.current.add(alertId);
    setAlerts((currentAlerts) => currentAlerts.filter((currentAlert) => getBudgetAlertId(currentAlert) !== alertId));
  }

  return { alerts, dismissAlert };
}

function getBudgetAlertId(alert: BudgetAlert) {
  return `${alert.month}-${alert.threshold}`;
}

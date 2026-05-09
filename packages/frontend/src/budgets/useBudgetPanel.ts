import { useEffect, useState } from "react";
import { BUDGET_PANEL_ANIMATION } from "./budgetConstants";

export function useBudgetPanel() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showHeaderSummary, setShowHeaderSummary] = useState(true);

  useEffect(() => {
    if (!isExpanded) {
      setShowHeaderSummary(true);
      return;
    }

    const hideSummary = window.setTimeout(
      () => setShowHeaderSummary(false),
      BUDGET_PANEL_ANIMATION.headerSummaryHideDelayMs
    );

    return () => window.clearTimeout(hideSummary);
  }, [isExpanded]);

  function toggleExpanded() {
    setIsExpanded((current) => !current);
  }

  return {
    isExpanded,
    showHeaderSummary,
    toggleExpanded
  };
}

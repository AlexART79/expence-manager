import type { ReactNode } from "react";
import { Button } from "./Button";

type ExpandableSectionProps = {
  eyebrow: string;
  title: string;
  panelId: string;
  isExpanded: boolean;
  expandLabel: string;
  collapseLabel: string;
  onToggle: () => void;
  actions?: ReactNode;
  status?: ReactNode;
  children: ReactNode;
  headerClassName?: string;
  actionsClassName?: string;
};

export function ExpandableSection({
  eyebrow,
  title,
  panelId,
  isExpanded,
  expandLabel,
  collapseLabel,
  onToggle,
  actions,
  status,
  children,
  headerClassName = "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
  actionsClassName = "flex items-center gap-3 sm:self-end"
}: ExpandableSectionProps) {
  return (
    <section className="rounded-lg border border-line/35 bg-surface-muted p-5 shadow-xl shadow-slate-950/10 sm:p-6 dark:border-line/10 dark:shadow-black/10">
      <div className={headerClassName}>
        <div>
          <p className="text-sm font-medium text-accent-strong">{eyebrow}</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-normal text-text">{title}</h2>
        </div>
        <div className={actionsClassName}>
          {actions}
          <Button
            type="button"
            variant="ghostIcon"
            aria-label={isExpanded ? collapseLabel : expandLabel}
            aria-expanded={isExpanded}
            aria-controls={panelId}
            onClick={onToggle}
          >
            <svg
              className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="none"
            >
              <path
                d="M5 7.5L10 12.5L15 7.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Button>
        </div>
      </div>

      {status}

      {isExpanded ? (
        <div id={panelId} className="mode-transition">
          {children}
        </div>
      ) : null}
    </section>
  );
}

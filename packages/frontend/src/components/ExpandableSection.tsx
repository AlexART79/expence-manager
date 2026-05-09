import type { ReactNode } from "react";

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
    <section className="rounded-lg border border-white/10 bg-surface-muted p-5 shadow-xl shadow-black/10 sm:p-6">
      <div className={headerClassName}>
        <div>
          <p className="text-sm font-medium text-accent-strong">{eyebrow}</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-normal text-text">{title}</h2>
        </div>
        <div className={actionsClassName}>
          {actions}
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-surface text-text transition hover:border-accent/60 hover:text-accent-strong focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 dark:focus:ring-offset-slate-950"
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
          </button>
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

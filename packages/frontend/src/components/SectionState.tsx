export type SectionStateProps = {
  state: "loading" | "empty" | "error";
  title: string;
  description?: string;
  className?: string;
};

const STATE_CLASSES = {
  loading: "border-line/35 bg-surface-raised text-text-muted dark:border-line/10 dark:bg-surface",
  empty: "border-dashed border-line/45 bg-surface-raised text-text dark:border-line/15 dark:bg-surface",
  error: "border-danger-border bg-danger-surface text-danger dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-100"
} as const;

export function SectionState({ state, title, description, className = "" }: SectionStateProps) {
  return (
    <div
      className={`rounded-md border px-4 py-5 text-sm ${STATE_CLASSES[state]} ${className}`}
      role={state === "loading" ? "status" : state === "error" ? "alert" : undefined}
    >
      <p className="font-semibold text-text">{title}</p>
      {description ? <p className="mt-1 text-text-muted">{description}</p> : null}
    </div>
  );
}

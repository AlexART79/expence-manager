export type SectionStateProps = {
  state: "loading" | "empty" | "error";
  title: string;
  description?: string;
  className?: string;
};

const STATE_CLASSES = {
  loading: "border-white/10 bg-surface text-text-muted",
  empty: "border-dashed border-white/15 bg-surface text-text",
  error: "border-red-400/30 bg-red-500/10 text-red-100"
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

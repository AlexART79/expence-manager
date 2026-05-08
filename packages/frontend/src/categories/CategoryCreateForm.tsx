import { CATEGORY_COPY, CATEGORY_LIMITS } from "./categoryConstants";

export function CategoryCreateForm({
  newName,
  isCreating,
  onNameChange,
  onCreate
}: {
  newName: string;
  isCreating: boolean;
  onNameChange: (name: string) => void;
  onCreate: () => void;
}) {
  return (
    <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
      <label className="grid gap-2 text-sm font-medium text-text">
        {CATEGORY_COPY.createLabel}
        <input
          className="min-h-11 rounded-md border border-white/10 bg-surface px-3 text-sm text-text outline-none transition placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/40"
          value={newName}
          maxLength={CATEGORY_LIMITS.nameMaxLength}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder={CATEGORY_COPY.createPlaceholder}
        />
      </label>
      <button
        type="button"
        className="inline-flex min-h-11 items-center justify-center self-end rounded-md bg-accent px-4 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-slate-950"
        disabled={isCreating}
        onClick={onCreate}
      >
        {isCreating ? CATEGORY_COPY.adding : CATEGORY_COPY.addCategory}
      </button>
    </div>
  );
}

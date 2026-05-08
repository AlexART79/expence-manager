import { CATEGORY_COPY } from "./categoryConstants";

export function CategoryRenameActions({
  isRenaming,
  onSave,
  onCancel
}: {
  isRenaming: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      <button
        type="button"
        className="inline-flex min-h-9 items-center justify-center rounded-md bg-accent px-3 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-60 dark:focus:ring-offset-slate-950"
        disabled={isRenaming}
        onClick={onSave}
      >
        {CATEGORY_COPY.saveName}
      </button>
      <button
        type="button"
        className="inline-flex min-h-9 items-center justify-center rounded-md border border-white/10 px-3 text-sm font-medium text-text transition hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 dark:focus:ring-offset-slate-950"
        onClick={onCancel}
      >
        {CATEGORY_COPY.cancel}
      </button>
    </>
  );
}

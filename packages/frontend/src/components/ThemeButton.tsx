export function ThemeButton({ isDark, setIsDark }: { isDark: boolean; setIsDark: (value: boolean) => void }) {
  return (
    <button
      type="button"
      className="inline-flex min-h-9 items-center justify-center rounded-md border border-white/10 px-3 text-sm font-medium text-text transition hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 dark:focus:ring-offset-slate-950"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => setIsDark(!isDark)}
    >
      {isDark ? "Light" : "Dark"}
    </button>
  );
}

export function ThemeButton({ isDark, setIsDark }: { isDark: boolean; setIsDark: (value: boolean) => void }) {
  return (
    <button
      type="button"
      className="inline-flex min-h-9 items-center justify-center rounded-md border border-line bg-control px-3 text-sm font-medium text-text transition hover:bg-control-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 dark:border-line/20 dark:focus:ring-offset-slate-950"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => setIsDark(!isDark)}
    >
      {isDark ? "Light" : "Dark"}
    </button>
  );
}

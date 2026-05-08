export function LoadingScreen() {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <section
        className="w-full max-w-sm rounded-lg border border-white/10 bg-surface-muted p-6 text-center shadow-xl shadow-black/15"
        role="status"
        aria-live="polite"
      >
        Loading dashboard
      </section>
    </main>
  );
}

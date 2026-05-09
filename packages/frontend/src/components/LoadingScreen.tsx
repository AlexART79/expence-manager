import { SectionState } from "./SectionState";

export function LoadingScreen() {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <section className="w-full max-w-sm rounded-lg border border-white/10 bg-surface-muted p-4 shadow-xl shadow-black/15">
        <SectionState state="loading" title="Loading dashboard" />
      </section>
    </main>
  );
}

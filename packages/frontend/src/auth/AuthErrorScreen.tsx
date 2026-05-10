import { InlineAlert } from "../components/InlineAlert";

export function AuthErrorScreen({ message }: { message: string }) {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <section className="w-full max-w-md rounded-lg border border-danger-border bg-surface-muted p-6 shadow-xl shadow-slate-950/10 dark:border-danger-border/50 dark:shadow-black/15">
        <InlineAlert>Could not verify your session</InlineAlert>
        <p className="mt-3 text-sm leading-6 text-text-muted">
          The backend did not complete the session check. Restart the frontend dev server, then refresh this page.
        </p>
        <p className="mt-4 rounded-md bg-surface px-3 py-2 text-xs text-text-muted">{message}</p>
      </section>
    </main>
  );
}

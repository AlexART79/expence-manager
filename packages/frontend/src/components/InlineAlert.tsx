import type { ReactNode } from "react";

export type InlineAlertProps = {
  tone?: "error" | "warning" | "info" | "success";
  children: ReactNode;
  className?: string;
};

const TONE_CLASSES = {
  error: "border-danger-border bg-danger-surface text-danger dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-100",
  warning: "border-warning-border bg-warning-surface text-warning dark:border-amber-300/40 dark:bg-amber-300/10 dark:text-amber-50",
  info: "border-line/35 bg-surface-raised text-text-muted dark:border-line/10 dark:bg-surface",
  success: "border-emerald-700 bg-emerald-50 text-emerald-800 dark:border-emerald-300/30 dark:bg-emerald-300/10 dark:text-emerald-50"
} as const;

export function InlineAlert({ tone = "error", children, className = "" }: InlineAlertProps) {
  return (
    <p className={`rounded-md border px-3 py-2 text-sm ${TONE_CLASSES[tone]} ${className}`} role="alert">
      {children}
    </p>
  );
}

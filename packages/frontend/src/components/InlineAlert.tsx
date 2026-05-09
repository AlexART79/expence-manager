import type { ReactNode } from "react";

export type InlineAlertProps = {
  tone?: "error" | "warning" | "info" | "success";
  children: ReactNode;
  className?: string;
};

const TONE_CLASSES = {
  error: "border-red-400/30 bg-red-500/10 text-red-100",
  warning: "border-amber-300/40 bg-amber-300/10 text-amber-50",
  info: "border-white/10 bg-surface text-text-muted",
  success: "border-emerald-300/30 bg-emerald-300/10 text-emerald-50"
} as const;

export function InlineAlert({ tone = "error", children, className = "" }: InlineAlertProps) {
  return (
    <p className={`rounded-md border px-3 py-2 text-sm ${TONE_CLASSES[tone]} ${className}`} role="alert">
      {children}
    </p>
  );
}

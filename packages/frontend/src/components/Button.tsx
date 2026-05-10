import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghostIcon";
  size?: "sm" | "md";
  isLoading?: boolean;
  children: ReactNode;
};

const VARIANT_CLASSES = {
  primary:
    "bg-teal-600 text-white hover:bg-teal-800 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-60 dark:bg-accent dark:text-slate-950 dark:hover:bg-accent-strong",
  secondary:
    "border border-line bg-control text-text hover:bg-control-hover focus:ring-accent disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-transparent dark:hover:bg-surface-muted",
  danger:
    "border border-danger-border bg-danger-surface text-danger hover:bg-danger-surface/80 focus:ring-danger-border disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-400/30 dark:bg-transparent dark:text-red-200 dark:hover:bg-red-500/10 dark:focus:ring-red-300",
  ghostIcon:
    "border border-line bg-control text-text hover:border-accent-strong hover:bg-control-hover hover:text-accent-strong focus:ring-accent disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-surface dark:hover:border-accent/60 dark:hover:bg-transparent dark:hover:text-accent-strong",
} as const;

const SIZE_CLASSES = {
  sm: "min-h-9 px-3 text-sm",
  md: "min-h-10 px-4 text-sm",
} as const;

export function Button({ variant = "secondary", size = "md", isLoading = false, className = "", disabled, children, ...props }: ButtonProps) {
  const sizeClass = variant === "ghostIcon" ? "h-10 w-10 p-0 text-sm" : SIZE_CLASSES[size];

  return (
    <button
      className={`inline-flex items-center justify-center rounded-md font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-950 ${sizeClass} ${VARIANT_CLASSES[variant]} ${className}`}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {children}
    </button>
  );
}

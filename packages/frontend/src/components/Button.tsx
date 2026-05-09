import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghostIcon";
  size?: "sm" | "md";
  isLoading?: boolean;
  children: ReactNode;
};

const VARIANT_CLASSES = {
  primary:
    "bg-accent text-slate-950 hover:bg-accent-strong focus:ring-accent disabled:cursor-not-allowed disabled:opacity-60",
  secondary:
    "border border-white/10 text-text hover:bg-surface-muted focus:ring-accent disabled:cursor-not-allowed disabled:opacity-60",
  danger:
    "border border-red-400/30 text-red-200 hover:bg-red-500/10 focus:ring-red-300 disabled:cursor-not-allowed disabled:opacity-60",
  ghostIcon:
    "border border-white/10 bg-surface text-text hover:border-accent/60 hover:text-accent-strong focus:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
} as const;

const SIZE_CLASSES = {
  sm: "min-h-9 px-3 text-sm",
  md: "min-h-10 px-4 text-sm"
} as const;

export function Button({
  variant = "secondary",
  size = "md",
  isLoading = false,
  className = "",
  disabled,
  children,
  ...props
}: ButtonProps) {
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

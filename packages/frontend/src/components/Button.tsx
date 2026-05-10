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
    "border border-line bg-control text-text hover:bg-control-hover focus:ring-accent disabled:cursor-not-allowed disabled:opacity-60 dark:border-line/20",
  danger:
    "border border-danger-border bg-danger-surface text-danger hover:bg-danger-surface/80 focus:ring-danger-border disabled:cursor-not-allowed disabled:opacity-60 dark:border-danger-border/50",
  ghostIcon:
    "border border-line bg-control text-text hover:border-accent-strong hover:bg-control-hover hover:text-accent-strong focus:ring-accent disabled:cursor-not-allowed disabled:opacity-60 dark:border-line/20"
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

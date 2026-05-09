import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from "react";

export type FieldProps = {
  label: string;
  error?: string | null;
  description?: string;
  id?: string;
  children: ReactElement<{ id?: string; "aria-invalid"?: boolean; "aria-describedby"?: string }>;
};

export function Field({ label, error, description, id, children }: FieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const messageId = `${fieldId}-message`;
  const control = cloneElement(children, {
    id: children.props.id ?? fieldId,
    "aria-invalid": Boolean(error) || undefined,
    "aria-describedby": error || description ? messageId : undefined
  });

  return (
    <div className="grid gap-2 text-sm font-medium text-text">
      <label htmlFor={fieldId}>{label}</label>
      {control}
      <FieldMessage id={messageId} tone={error ? "error" : "muted"}>
        {error ?? description}
      </FieldMessage>
    </div>
  );
}

export function FieldMessage({
  id,
  tone = "muted",
  children
}: {
  id?: string;
  tone?: "error" | "muted";
  children?: ReactNode;
}) {
  if (!children) {
    return null;
  }

  return (
    <p
      id={id}
      className={`text-xs ${tone === "error" ? "text-red-200" : "text-text-muted"}`}
      role={tone === "error" ? "alert" : undefined}
    >
      {children}
    </p>
  );
}

export const FIELD_CONTROL_CLASS =
  "field-control min-h-10 rounded-md border border-white/10 bg-surface px-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/40 aria-[invalid=true]:border-red-300/70 aria-[invalid=true]:focus:border-red-300 aria-[invalid=true]:focus:ring-red-300/30";

export const FIELD_CONTROL_MUTED_CLASS =
  "field-control min-h-10 rounded-md border border-white/10 bg-surface-muted px-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/40 aria-[invalid=true]:border-red-300/70 aria-[invalid=true]:focus:border-red-300 aria-[invalid=true]:focus:ring-red-300/30";

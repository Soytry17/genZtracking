import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export const inputClassName =
  "h-11 w-full rounded-xl border border-line-strong bg-surface-2 px-3 text-sm text-ink " +
  "placeholder:text-ink-subtle disabled:opacity-50 " +
  "focus:border-brand focus:outline-none";

export const labelClassName = "text-xs font-medium text-ink-muted";

export function Field({
  label,
  htmlFor,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className={labelClassName}>
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-ink-subtle">{hint}</p> : null}
    </div>
  );
}

import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

export const inputClassName =
  "h-11 w-full rounded-2xl glass-inset px-3.5 text-sm text-ink " +
  "placeholder:text-ink-subtle disabled:opacity-50 " +
  "focus:border-brand focus:outline-none";

export const labelClassName = "text-xs font-medium text-ink-muted";

export function Field({
  label,
  htmlFor,
  hint,
  children,
  className,
  ...props
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
} & ComponentProps<"div">) {
  return (
    <div className={cn("space-y-1.5", className)} {...props}>
      <label htmlFor={htmlFor} className={labelClassName}>
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-ink-subtle">{hint}</p> : null}
    </div>
  );
}

import * as React from "react";

import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("min-w-0 rounded-card glass shadow-glass", className)}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex min-w-0 flex-col gap-1 border-b border-hairline px-4 py-4 sm:px-6 sm:py-5", className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      className={cn("text-base font-semibold tracking-tight text-ink", className)}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p className={cn("text-sm text-ink-muted", className)} {...props} />
  );
}

export function CardBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("p-4 sm:p-6", className)} {...props} />;
}

type PillTone = "neutral" | "brand" | "success" | "warning" | "danger" | "freeze" | "xp";

const PILL_TONES: Record<PillTone, string> = {
  neutral: "glass text-ink-muted",
  brand: "border-transparent bg-brand-soft text-brand",
  success: "border-transparent bg-success-soft text-success",
  warning: "border-transparent bg-warning-soft text-warning",
  danger: "border-transparent bg-danger-soft text-danger",
  freeze: "border-transparent bg-freeze-soft text-freeze",
  xp: "border-transparent bg-xp-soft text-xp",
};

export function Pill({
  className,
  tone = "neutral",
  ...props
}: React.ComponentProps<"span"> & { tone?: PillTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        PILL_TONES[tone],
        className,
      )}
      {...props}
    />
  );
}

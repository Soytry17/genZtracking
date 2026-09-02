import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const BASE =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full font-medium " +
  "transition-transform duration-200 " +
  "[transition-timing-function:var(--ease-out-quint)] active:scale-[0.96] " +
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "btn-liquid bg-brand text-brand-ink shadow-[0_8px_24px_-12px_var(--t-brand)]",
  secondary: "glass text-ink hover:bg-glass-strong",
  ghost: "text-ink-muted hover:bg-glass hover:text-ink",
  danger: "bg-danger-soft text-danger hover:bg-danger hover:text-white",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-3.5 text-xs",
  md: "h-10 px-5 text-sm",
  lg: "h-12 px-7 text-[15px]",
};

export type ButtonProps = React.ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(BASE, VARIANTS[variant], SIZES[size], className)}
      {...props}
    />
  );
}

/** Same visual treatment as `Button`, for anchors and `next/link`. */
export function buttonClassName({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(BASE, VARIANTS[variant], SIZES[size], className);
}

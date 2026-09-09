"use client";

import Link from "next/link";
import { useEffect, useState, type ComponentProps, type ReactNode } from "react";

import {
  RippleButton,
  RippleButtonRipples,
} from "@/components/animate-ui/components/buttons/ripple";
import { prefersReducedMotion } from "@/lib/anim/reduced-motion";
import { cn } from "@/lib/utils";

type Tone = "primary" | "secondary";
type Size = "sm" | "md" | "lg";

const TONES: Record<Tone, string> = {
  primary:
    "rounded-full bg-brand text-brand-ink shadow-[0_8px_24px_-12px_var(--t-brand)] " +
    "[--ripple-button-ripple-color:#ffffff]",
  secondary:
    "rounded-full glass text-ink [--ripple-button-ripple-color:var(--t-brand)]",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3.5 text-xs",
  md: "h-10 px-5 text-sm",
  lg: "h-12 px-7 text-[15px]",
};

type RippleCtaProps = {
  children: ReactNode;
  href?: string;
  tone?: Tone;
  size?: Size;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
} & Omit<ComponentProps<typeof RippleButton>, "children" | "size" | "variant" | "asChild">;

/** Animate UI Ripple, restyled as an iOS glass / violet pill. Real CTAs only. */
export function RippleCta({
  children,
  href,
  tone = "primary",
  size = "lg",
  type = "button",
  disabled,
  className,
  ...props
}: RippleCtaProps) {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(prefersReducedMotion());
  }, []);

  const classes = cn(
    "font-medium",
    TONES[tone],
    SIZES[size],
    className,
  );

  const body = (
    <>
      {children}
      {reduced ? null : <RippleButtonRipples scale={8} />}
    </>
  );

  if (href) {
    return (
      <RippleButton
        asChild
        hoverScale={reduced ? 1 : 1.02}
        tapScale={reduced ? 1 : 0.96}
        className={classes}
        {...props}
      >
        <Link href={href}>{body}</Link>
      </RippleButton>
    );
  }

  return (
    <RippleButton
      type={type}
      disabled={disabled}
      hoverScale={reduced ? 1 : 1.02}
      tapScale={reduced ? 1 : 0.96}
      className={classes}
      {...props}
    >
      {body}
    </RippleButton>
  );
}

"use client";

import { useEffect, useRef } from "react";

import { animateFreeze, animateFreezeSpend } from "@/lib/anim/anime";
import { FREEZE_MAX_TOKENS } from "@/lib/habits/constants";
import { cn } from "@/lib/utils";

export function FreezeTokens({
  count,
  className,
}: {
  count: number;
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const clamped = Math.max(0, Math.min(FREEZE_MAX_TOKENS, count));
  const prevRef = useRef(clamped);

  useEffect(() => {
    const prev = prevRef.current;
    if (prev === clamped) return;
    prevRef.current = clamped;

    const root = rootRef.current;
    if (!root) return;

    if (clamped > prev) {
      const earned = root.querySelector<HTMLElement>(
        `[data-token="${clamped - 1}"]`,
      );
      if (earned) animateFreeze(earned);
      return;
    }

    const spent = root.querySelector<HTMLElement>(`[data-token="${clamped}"]`);
    if (spent) animateFreezeSpend(spent);
  }, [clamped]);

  return (
    <div
      ref={rootRef}
      className={cn("flex items-center gap-0.5", className)}
      title={`${clamped} / ${FREEZE_MAX_TOKENS} freeze tokens`}
      aria-label={`${clamped} freeze tokens`}
    >
      {Array.from({ length: FREEZE_MAX_TOKENS }).map((_, i) => (
        <span
          key={i}
          data-token={i}
          aria-hidden
          className={cn(
            "text-sm leading-none",
            i < clamped ? "text-freeze" : "text-ink-subtle/35",
          )}
        >
          ❄
        </span>
      ))}
    </div>
  );
}

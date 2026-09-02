"use client";

import { useEffect, useRef } from "react";

import { animateCount, animateProgress, killAnime } from "@/lib/anim/anime";
import { cn } from "@/lib/utils";

export function ProgressBar({
  percent,
  label,
  className,
  barClassName,
}: {
  percent: number;
  label?: string;
  className?: string;
  barClassName?: string;
}) {
  const fillRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const prevRef = useRef(0);
  const clamped = Math.max(0, Math.min(100, percent));

  useEffect(() => {
    const from = prevRef.current;
    const fill = animateProgress(fillRef.current, clamped, from);
    const count = animateCount(countRef.current, clamped, from);
    prevRef.current = clamped;
    return () => {
      killAnime(fill);
      killAnime(count);
    };
  }, [clamped]);

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-start justify-between gap-3 text-xs text-ink-muted">
        {label ? (
          <span className="min-w-0 flex-1 text-pretty leading-snug">{label}</span>
        ) : (
          <span />
        )}
        <span
          ref={countRef}
          className="font-medium tabular-nums text-ink"
        >
          {clamped}%
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full glass-inset">
        <div
          ref={fillRef}
          className={cn(
            "gpu h-full w-full origin-left rounded-full bg-success",
            barClassName,
          )}
          style={{ transform: `scaleX(${clamped / 100})` }}
        />
      </div>
    </div>
  );
}

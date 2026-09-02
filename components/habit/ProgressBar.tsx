"use client";

import { useEffect, useRef } from "react";

import { animateProgress } from "@/lib/anim/anime";
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
  const clamped = Math.max(0, Math.min(100, percent));

  useEffect(() => {
    animateProgress(fillRef.current, clamped, 0);
  }, [clamped]);

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between gap-3 text-xs text-ink-muted">
        {label ? <span>{label}</span> : <span />}
        <span className="font-medium tabular-nums text-ink">{clamped}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-3">
        <div
          ref={fillRef}
          className={cn("h-full rounded-full bg-success", barClassName)}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

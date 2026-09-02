"use client";

import { useEffect, useRef } from "react";

import { animateProgress } from "@/lib/anim/anime";
import { progressToNextLevel } from "@/lib/gamify/rules";
import { cn } from "@/lib/utils";

export function XpBar({
  xp,
  level,
  className,
}: {
  xp: number;
  level: number;
  className?: string;
}) {
  const fillRef = useRef<HTMLDivElement>(null);
  const progress = progressToNextLevel(xp);
  const percent = Math.round(progress.progress * 100);

  useEffect(() => {
    animateProgress(fillRef.current, percent, 0);
  }, [percent]);

  return (
    <div
      className={cn("flex min-w-40 items-center gap-2", className)}
      title={`${progress.xpIntoLevel} / ${progress.xpForNext} XP to level ${progress.level + 1}`}
    >
      <span className="shrink-0 text-xs font-semibold text-xp">
        Lv {level}
      </span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
        <div
          ref={fillRef}
          className="h-full rounded-full bg-xp"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="hidden text-[10px] tabular-nums text-ink-subtle lg:inline">
        {xp} XP
      </span>
    </div>
  );
}

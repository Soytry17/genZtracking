"use client";

import { useEffect, useRef } from "react";

import { animateProgress, killAnime } from "@/lib/anim/anime";
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
  const prevRef = useRef(0);
  const progress = progressToNextLevel(xp);
  const percent = Math.round(progress.progress * 100);

  useEffect(() => {
    const anim = animateProgress(fillRef.current, percent, prevRef.current);
    prevRef.current = percent;
    return () => killAnime(anim);
  }, [percent]);

  return (
    <div
      className={cn("flex min-w-40 items-center gap-2", className)}
      title={`${progress.xpIntoLevel} / ${progress.xpForNext} XP to level ${progress.level + 1}`}
    >
      <span className="shrink-0 text-xs font-semibold text-xp">
        Lv {level}
      </span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full glass-inset">
        <div
          ref={fillRef}
          className="gpu h-full w-full origin-left rounded-full bg-xp"
          style={{ transform: `scaleX(${percent / 100})` }}
        />
      </div>
      <span className="hidden text-[10px] tabular-nums text-ink-subtle lg:inline">
        {xp} XP
      </span>
    </div>
  );
}

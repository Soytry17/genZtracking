"use client";

import { useEffect, useRef } from "react";

import {
  animateFreezeSpend,
  animatePress,
  animateTick,
  killAnime,
} from "@/lib/anim/anime";
import { habitColorHex } from "@/lib/habits/constants";
import { cn } from "@/lib/utils";
import type { HabitDay } from "@/types/database";

export function DayCell({
  day,
  color,
  disabled,
  onSelect,
  onOpenNote,
}: {
  day: HabitDay;
  color: string;
  disabled?: boolean;
  onSelect: (day: HabitDay) => void;
  onOpenNote: (day: HabitDay) => void;
}) {
  const cellRef = useRef<HTMLButtonElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const prevStatus = useRef(day.status);
  const accent = habitColorHex(color);

  useEffect(() => {
    const prev = prevStatus.current;
    const becameDone = day.status === "done" && prev !== "done";
    const becameFrozen = day.status === "frozen" && prev !== "frozen";
    prevStatus.current = day.status;

    const cleanups: Array<() => void> = [];
    if (becameDone) {
      const anim = animateTick(pathRef.current);
      cleanups.push(() => killAnime(anim));
    }
    if (becameFrozen) {
      const anim = animateFreezeSpend(cellRef.current);
      cleanups.push(() => killAnime(anim));
    }
    return () => {
      for (const stop of cleanups) stop();
    };
  }, [day.status, day.date]);

  const future = day.isFuture;
  const frozen = day.status === "frozen";
  const clickable = !disabled && !future && !frozen;

  return (
    <button
      ref={cellRef}
      type="button"
      data-day-cell
      disabled={!clickable && !day.note}
      onPointerDown={(event) => {
        if (clickable && event.button === 0) animatePress(cellRef.current);
      }}
      onClick={() => {
        if (clickable) onSelect(day);
        else onOpenNote(day);
      }}
      onContextMenu={(event) => {
        event.preventDefault();
        if (!future && !disabled) onOpenNote(day);
      }}
      title={`${day.date}${day.note ? " · has note" : ""}`}
      className={cn(
        "relative flex aspect-square min-h-11 min-w-11 items-center justify-center rounded-xl text-[11px] font-medium transition-colors",
        day.status === "done" && "text-white",
        day.status === "skipped" && "glass-tile text-ink-subtle",
        day.status === "frozen" && "bg-freeze-soft text-freeze hairline",
        !day.status && !future && "glass-tile text-ink-muted hover:bg-glass",
        future && "bg-transparent text-ink-subtle/50",
        day.isToday && "ring-2 ring-brand/70 ring-offset-2 ring-offset-canvas",
        clickable && "cursor-pointer",
      )}
      style={
        day.status === "done"
          ? {
              backgroundColor: `${accent}33`,
              color: accent,
              boxShadow: `inset 0 0 0 1px ${accent}66`,
            }
          : undefined
      }
    >
      {day.status === "done" ? (
        <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
          <path
            ref={pathRef}
            d="M5 12.5 9.5 17 19 7"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : day.status === "frozen" ? (
        <span aria-hidden>❄</span>
      ) : day.status === "skipped" ? (
        <span aria-hidden>—</span>
      ) : (
        <span>{day.dayNumber}</span>
      )}
      {day.note ? (
        <span className="absolute bottom-1 right-1 size-1.5 rounded-full bg-ink/80" />
      ) : null}
    </button>
  );
}

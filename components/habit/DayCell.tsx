"use client";

import { useEffect, useRef } from "react";

import { animateTick } from "@/lib/anim/anime";
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
  const pathRef = useRef<SVGPathElement>(null);
  const accent = habitColorHex(color);

  useEffect(() => {
    if (day.status === "done") animateTick(pathRef.current);
  }, [day.status, day.date]);

  const future = day.isFuture;
  const frozen = day.status === "frozen";
  const clickable = !disabled && !future && !frozen;

  return (
    <button
      type="button"
      data-day-cell
      disabled={!clickable && !day.note}
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
        "relative flex aspect-square items-center justify-center rounded-lg text-[11px] font-medium transition-colors",
        day.status === "done" && "text-white",
        day.status === "skipped" && "bg-day-skipped text-ink-subtle",
        day.status === "frozen" && "bg-freeze-soft text-freeze",
        !day.status && !future && "bg-day-empty text-ink-muted hover:bg-surface-3",
        future && "bg-transparent text-ink-subtle/50",
        day.isToday && "ring-2 ring-brand ring-offset-2 ring-offset-canvas",
        clickable && "cursor-pointer",
      )}
      style={
        day.status === "done"
          ? { backgroundColor: accent }
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

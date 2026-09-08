"use client";

import { useEffect, useRef } from "react";

import { CheckIcon } from "@/components/habit/CheckIcon";
import {
  animateFreezeSpend,
  animatePress,
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
  const prevStatus = useRef(day.status);
  const accent = habitColorHex(color);

  useEffect(() => {
    const prev = prevStatus.current;
    const becameFrozen = day.status === "frozen" && prev !== "frozen";
    prevStatus.current = day.status;

    if (!becameFrozen) return;
    const anim = animateFreezeSpend(cellRef.current);
    return () => killAnime(anim);
  }, [day.status, day.date]);

  const future = day.isFuture;
  const frozen = day.status === "frozen";
  const done = day.status === "done";
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
        done && "text-white",
        day.status === "skipped" && "glass-tile text-ink-subtle",
        frozen && "bg-freeze-soft text-freeze hairline",
        !day.status && !future && "glass-tile text-ink-muted hover:bg-glass",
        future && "bg-transparent text-ink-subtle/50",
        day.isToday && "ring-2 ring-brand/70 ring-offset-2 ring-offset-canvas",
        clickable && "cursor-pointer",
      )}
      style={
        done
          ? {
              backgroundColor: `${accent}33`,
              color: accent,
              boxShadow: `inset 0 0 0 1px ${accent}66`,
            }
          : undefined
      }
    >
      {frozen ? (
        <span aria-hidden>❄</span>
      ) : (
        <>
          {done ? null : day.status === "skipped" ? (
            <span aria-hidden>—</span>
          ) : (
            <span>{day.dayNumber}</span>
          )}
          <CheckIcon active={done} className="size-4" />
        </>
      )}
      {day.note ? (
        <span className="absolute bottom-1 right-1 size-1.5 rounded-full bg-ink/80" />
      ) : null}
    </button>
  );
}

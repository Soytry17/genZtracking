"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";

import { enterFromNear, useGsap } from "@/lib/anim/gsap";

import { Button, inputClassName } from "@/components/ui";
import { useGamify } from "@/components/gamify/GamifyProvider";
import {
  saveDayNote,
  skipDay,
  spendFreeze,
  toggleDay,
} from "@/lib/habits/actions";
import { DAY_NOTE_MAX_LENGTH, FREEZE_RETRO_WINDOW_DAYS } from "@/lib/habits/constants";
import { formatISODate, isWithinRetroWindow } from "@/lib/habits/dates";
import type { HabitDay } from "@/types/database";

export function DayNoteSheet({
  day,
  habitId,
  freezeTokens,
  readOnly,
  onClose,
}: {
  day: HabitDay;
  habitId: string;
  freezeTokens: number;
  readOnly?: boolean;
  onClose: () => void;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const { report } = useGamify();

  useGsap(
    panelRef,
    () => {
      enterFromNear(panelRef.current, {
        y: 28,
        opacityFrom: 0.88,
        duration: 0.34,
      });
    },
    [day.date],
  );
  const [note, setNote] = useState(day.note ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    setNote(day.note ?? "");
    setError(null);
  }, [day]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const canFreeze =
    !readOnly &&
    !day.status &&
    !day.isFuture &&
    freezeTokens > 0 &&
    isWithinRetroWindow(day.date, FREEZE_RETRO_WINDOW_DAYS);

  function run(fn: () => Promise<{ ok: true; gamify: Parameters<typeof report>[0] } | { ok: false; error: string }>) {
    start(async () => {
      const result = await fn();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      report(result.gamify);
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="glass-strong relative z-10 w-full max-h-[85dvh] overflow-y-auto rounded-t-panel p-4 pb-[max(1.5rem,var(--safe-bottom))] shadow-glass sm:p-6 md:max-w-md md:rounded-panel md:pb-6"
      >
        <p className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
          Day {day.dayNumber}
        </p>
        <h2 id={titleId} className="mt-1 text-lg font-semibold">
          {formatISODate(day.date, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          {day.status ? `Marked ${day.status}` : "Not logged yet"}
        </p>

        {!readOnly && !day.isFuture ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={pending || day.status === "frozen"}
              onClick={() => run(() => toggleDay(habitId, day.date))}
            >
              {day.status === "done" ? "Uncheck" : "Mark done"}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={pending || day.status === "frozen"}
              onClick={() => run(() => skipDay(habitId, day.date))}
            >
              Skip
            </Button>
            {canFreeze ? (
              <Button
                size="sm"
                variant="secondary"
                disabled={pending}
                onClick={() => run(() => spendFreeze(habitId, day.date))}
              >
                ❄ Freeze
              </Button>
            ) : null}
          </div>
        ) : null}

        <form
          className="mt-4 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (readOnly) return;
            run(() => saveDayNote(habitId, day.date, note));
          }}
        >
          <label htmlFor="day-note" className="text-xs font-medium text-ink-muted">
            Note
          </label>
          <textarea
            id="day-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={DAY_NOTE_MAX_LENGTH}
            rows={4}
            disabled={readOnly || pending || day.isFuture}
            placeholder="What did you actually do today?"
            className={`${inputClassName} h-auto py-3`}
          />
          {!readOnly && !day.isFuture ? (
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Saving…" : "Save note"}
            </Button>
          ) : null}
        </form>

        {error ? (
          <p role="alert" className="mt-3 text-sm text-danger">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}

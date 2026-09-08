"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";

import { animatePress } from "@/lib/anim/anime";

import { CheckIcon } from "@/components/habit/CheckIcon";
import { HabitIcon } from "@/components/habit/HabitIcon";
import { StreakBadge } from "@/components/habit/StreakBadge";
import { useGamify } from "@/components/gamify/GamifyProvider";
import { inputClassName } from "@/components/ui";
import { saveDayNote, spendFreeze, toggleDay } from "@/lib/habits/actions";
import {
  DAY_NOTE_MAX_LENGTH,
  HABIT_COLOR_HEX,
  ROUTES,
  isHabitColor,
} from "@/lib/habits/constants";
import { addDays, todayISO } from "@/lib/habits/dates";
import { cn } from "@/lib/utils";
import type { Habit, HabitLog, HabitLogStatus } from "@/types/database";

type DayStatus = HabitLogStatus | null;

export function TodayRow({
  habit,
  log,
  yesterdayDue,
  yesterdayLog,
  freezeTokens,
  onFreezeSpent,
}: {
  habit: Habit;
  log: HabitLog | null;
  yesterdayDue: boolean;
  yesterdayLog: HabitLog | null;
  freezeTokens: number;
  onFreezeSpent?: (spent: boolean) => void;
}) {
  const { report } = useGamify();
  const checkRef = useRef<HTMLButtonElement>(null);
  const noteInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<DayStatus>(log?.status ?? null);
  const [note, setNote] = useState(log?.note ?? "");
  const [noteOpen, setNoteOpen] = useState(false);
  const [missedYesterday, setMissedYesterday] = useState(
    yesterdayDue && !yesterdayLog,
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const today = todayISO();
  const yesterday = addDays(today, -1);
  const hex = isHabitColor(habit.color)
    ? HABIT_COLOR_HEX[habit.color]
    : HABIT_COLOR_HEX.violet;
  const done = status === "done";
  const frozen = status === "frozen";
  const skipped = status === "skipped";
  const showMissFreeze = missedYesterday && freezeTokens > 0;

  useEffect(() => {
    setStatus(log?.status ?? null);
  }, [log?.status]);

  useEffect(() => {
    setNote(log?.note ?? "");
  }, [log?.note]);

  useEffect(() => {
    setMissedYesterday(yesterdayDue && !yesterdayLog);
  }, [yesterdayDue, yesterdayLog]);

  useEffect(() => {
    if (noteOpen) noteInputRef.current?.focus();
  }, [noteOpen]);

  function run(
    fn: () => Promise<
      | { ok: true; gamify: Parameters<typeof report>[0] }
      | { ok: false; error: string }
    >,
    revert?: () => void,
  ) {
    start(async () => {
      const result = await fn();
      if (!result.ok) {
        revert?.();
        setError(result.error);
        return;
      }
      setError(null);
      report(result.gamify);
    });
  }

  function onCheck() {
    if (pending || frozen) return;
    const previous = status;
    const next: DayStatus = done ? null : "done";
    setStatus(next);
    run(
      () => toggleDay(habit.id, today),
      () => {
        setStatus(previous);
      },
    );
  }

  function onUseFreeze() {
    if (pending || freezeTokens < 1) return;
    setMissedYesterday(false);
    onFreezeSpent?.(true);
    run(
      () => spendFreeze(habit.id, yesterday),
      () => {
        setMissedYesterday(true);
        onFreezeSpent?.(false);
      },
    );
  }

  function persistNote() {
    if ((log?.note ?? "") === note) {
      if (!note.trim()) setNoteOpen(false);
      return;
    }
    run(() => saveDayNote(habit.id, today, note));
    if (!note.trim()) setNoteOpen(false);
  }

  return (
    <div
      data-today-row
      className={cn(
        "min-w-0 rounded-card glass shadow-glass",
        done && "opacity-80",
      )}
    >
      <div className="flex items-center gap-3 px-3 py-3.5 sm:gap-4 sm:px-5 sm:py-4">
        <span
          className="flex size-11 shrink-0 items-center justify-center rounded-2xl glass-thin sm:size-12"
          style={{ color: hex }}
        >
          <HabitIcon name={habit.icon} className="size-5 sm:size-6" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <h2 className="min-w-0 truncate text-base font-semibold text-ink sm:text-lg">
              <Link
                href={ROUTES.habit(habit.id)}
                className="rounded-sm hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/70"
              >
                {habit.title}
              </Link>
            </h2>
            <StreakBadge current={habit.current_streak} size="sm" />
          </div>

          {showMissFreeze ? (
            <button
              type="button"
              disabled={pending}
              onClick={onUseFreeze}
              className="mt-0.5 min-h-11 text-left text-xs text-ink-muted hover:text-freeze disabled:opacity-50 sm:min-h-0 sm:py-0.5"
            >
              Missed yesterday · Use freeze
            </button>
          ) : null}

          {noteOpen ? (
            <input
              ref={noteInputRef}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Note for today"
              maxLength={DAY_NOTE_MAX_LENGTH}
              disabled={pending || frozen}
              className={cn(inputClassName, "mt-2 h-11")}
              onBlur={persistNote}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  event.currentTarget.blur();
                }
                if (event.key === "Escape") {
                  setNote(log?.note ?? "");
                  setNoteOpen(false);
                }
              }}
            />
          ) : (
            <button
              type="button"
              disabled={pending || frozen}
              onClick={() => setNoteOpen(true)}
              className="mt-0.5 flex min-h-11 max-w-full items-center text-left text-xs text-ink-subtle hover:text-ink-muted disabled:opacity-50 sm:min-h-0 sm:py-0.5"
            >
              {note.trim() ? (
                <span className="truncate">Note · {note.trim()}</span>
              ) : (
                "Note"
              )}
            </button>
          )}

          {error ? <p className="mt-1 text-sm text-danger">{error}</p> : null}
        </div>

        <button
          ref={checkRef}
          type="button"
          disabled={pending || frozen}
          onPointerDown={(event) => {
            if (!pending && !frozen && event.button === 0) {
              animatePress(checkRef.current);
            }
          }}
          onClick={onCheck}
          className={cn(
            "relative flex size-14 shrink-0 items-center justify-center rounded-2xl text-lg transition-colors sm:size-12",
            frozen && "bg-freeze-soft text-freeze hairline",
            skipped && "glass-tile text-ink-subtle",
            !status && "glass-tile text-ink-muted hover:bg-glass",
            !frozen && !pending && "cursor-pointer",
          )}
          style={
            done
              ? {
                  backgroundColor: `${hex}33`,
                  color: hex,
                  boxShadow: `inset 0 0 0 1px ${hex}66`,
                }
              : undefined
          }
          aria-label={done ? `Uncheck ${habit.title}` : `Check off ${habit.title}`}
        >
          {frozen ? (
            "❄"
          ) : (
            <>
              {done ? null : skipped ? "—" : null}
              <CheckIcon active={done} className="size-6 sm:size-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

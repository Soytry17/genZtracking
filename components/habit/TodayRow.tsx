"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";

import { animatePress } from "@/lib/anim/anime";

import { CheckIcon } from "@/components/habit/CheckIcon";
import { HabitIcon } from "@/components/habit/HabitIcon";
import { StreakBadge } from "@/components/habit/StreakBadge";
import { useGamify } from "@/components/gamify/GamifyProvider";
import { inputClassName } from "@/components/ui/field";
import { saveDayNote, spendFreeze, toggleDay } from "@/lib/habits/actions";
import {
  DAY_NOTE_MAX_LENGTH,
  HABIT_COLOR_HEX,
  ROUTES,
  isHabitColor,
} from "@/lib/habits/constants";
import type { TodayHabitRow, TodayLogRow } from "@/lib/habits/queries";
import { addDays, todayISO } from "@/lib/habits/dates";
import { cn } from "@/lib/utils";
import type { HabitLogStatus } from "@/types/database";

type DayStatus = HabitLogStatus | null;

export function TodayRow({
  habit,
  log,
  yesterdayDue,
  yesterdayLog,
  freezeTokens,
  onFreezeSpent,
  onPatch,
}: {
  habit: TodayHabitRow;
  log: TodayLogRow | null;
  yesterdayDue: boolean;
  yesterdayLog: TodayLogRow | null;
  freezeTokens: number;
  onFreezeSpent?: (spent: boolean) => void;
  onPatch?: (patch: {
    log?: TodayLogRow | null;
    yesterdayLog?: TodayLogRow | null;
    currentStreak?: number;
  }) => void;
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
    const previousLog = log;
    const next: DayStatus = done ? null : "done";
    setStatus(next);
    onPatch?.({
      log:
        next === "done"
          ? {
              id: log?.id ?? habit.id,
              habit_id: habit.id,
              log_date: today,
              status: "done",
              note: log?.note ?? null,
            }
          : null,
    });
    start(async () => {
      const result = await toggleDay(habit.id, today);
      if (!result.ok) {
        setStatus(previous);
        onPatch?.({ log: previousLog });
        setError(result.error);
        return;
      }
      setError(null);
      report(result.gamify);
      onPatch?.({
        log:
          result.data.status === "done"
            ? {
                id: log?.id ?? habit.id,
                habit_id: habit.id,
                log_date: today,
                status: "done",
                note: note.trim() ? note : (log?.note ?? null),
              }
            : null,
        currentStreak: result.data.currentStreak,
      });
    });
  }

  function onUseFreeze() {
    if (pending || freezeTokens < 1) return;
    setMissedYesterday(false);
    onFreezeSpent?.(true);
    onPatch?.({
      yesterdayLog: {
        id: habit.id,
        habit_id: habit.id,
        log_date: yesterday,
        status: "frozen",
        note: null,
      },
    });
    run(
      () => spendFreeze(habit.id, yesterday),
      () => {
        setMissedYesterday(true);
        onFreezeSpent?.(false);
        onPatch?.({ yesterdayLog: null });
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

  const statusLabel = frozen
    ? "Frozen"
    : done
      ? "Done"
      : skipped
        ? "Skipped"
        : "In progress";
  const statusTone = frozen
    ? "bg-freeze-soft text-freeze"
    : done
      ? "bg-success-soft text-success"
      : skipped
        ? "glass text-ink-subtle"
        : "bg-brand-soft text-brand";

  return (
    <div
      data-today-row
      className={cn(
        "min-w-0 rounded-[1.6rem] glass shadow-glass",
        done && "opacity-90",
      )}
    >
      <div className="flex items-center gap-3 px-3.5 py-4 sm:gap-4 sm:px-5 sm:py-5">
        <span
          className="flex size-12 shrink-0 items-center justify-center rounded-2xl sm:size-14"
          style={{ color: hex, backgroundColor: `${hex}22` }}
        >
          <HabitIcon name={habit.icon} className="size-6 sm:size-7" />
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
            <span
              className={cn(
                "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium",
                statusTone,
              )}
            >
              {statusLabel}
            </span>
          </div>

          <div className="mt-1.5">
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
            "relative flex size-14 shrink-0 items-center justify-center rounded-full text-lg transition-colors sm:size-12",
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

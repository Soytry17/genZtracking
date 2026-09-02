"use client";

import { useState, useTransition } from "react";

import { HabitIcon } from "@/components/habit/HabitIcon";
import { StreakBadge } from "@/components/habit/StreakBadge";
import { useGamify } from "@/components/gamify/GamifyProvider";
import { Button, Card, CardBody, inputClassName } from "@/components/ui";
import { saveDayNote, skipDay, spendFreeze, toggleDay } from "@/lib/habits/actions";
import { FREEZE_RETRO_WINDOW_DAYS, HABIT_COLOR_HEX, isHabitColor } from "@/lib/habits/constants";
import { isWithinRetroWindow, todayISO } from "@/lib/habits/dates";
import { cn } from "@/lib/utils";
import type { Habit, HabitLog } from "@/types/database";

export function TodayRow({
  habit,
  log,
}: {
  habit: Habit;
  log: HabitLog | null;
}) {
  const { report } = useGamify();
  const [note, setNote] = useState(log?.note ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const today = todayISO();
  const hex = isHabitColor(habit.color)
    ? HABIT_COLOR_HEX[habit.color]
    : HABIT_COLOR_HEX.violet;
  const done = log?.status === "done";
  const frozen = log?.status === "frozen";
  const skipped = log?.status === "skipped";
  const canFreeze =
    !log && freezeEligible(today);

  function run(
    fn: () => Promise<
      | { ok: true; gamify: Parameters<typeof report>[0] }
      | { ok: false; error: string }
    >,
  ) {
    start(async () => {
      const result = await fn();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      report(result.gamify);
    });
  }

  return (
    <Card>
      <CardBody className="space-y-3">
        <div className="flex items-start gap-3">
          <button
            type="button"
            disabled={pending || frozen}
            onClick={() => run(() => toggleDay(habit.id, today))}
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-xl border text-lg transition-colors",
              done && "border-transparent text-white",
              frozen && "border-freeze bg-freeze-soft text-freeze",
              skipped && "border-line bg-day-skipped text-ink-subtle",
              !log && "border-line-strong bg-surface-2 text-ink-muted hover:bg-surface-3",
            )}
            style={done ? { backgroundColor: hex, borderColor: hex } : undefined}
            aria-label={done ? `Uncheck ${habit.title}` : `Check off ${habit.title}`}
          >
            {done ? "✓" : frozen ? "❄" : skipped ? "—" : <HabitIcon name={habit.icon} />}
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold text-ink">{habit.title}</h2>
              <StreakBadge current={habit.current_streak} size="sm" />
            </div>
            {habit.description ? (
              <p className="mt-0.5 truncate text-sm text-ink-muted">
                {habit.description}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Add a note for today"
            disabled={pending || frozen}
            className={cn(inputClassName, "flex-1")}
            onBlur={() => {
              if ((log?.note ?? "") === note) return;
              run(() => saveDayNote(habit.id, today, note));
            }}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={pending || frozen}
              onClick={() => run(() => skipDay(habit.id, today))}
            >
              Skip
            </Button>
            {canFreeze ? (
              <Button
                size="sm"
                variant="secondary"
                disabled={pending}
                onClick={() => run(() => spendFreeze(habit.id, today))}
              >
                Freeze
              </Button>
            ) : null}
          </div>
        </div>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </CardBody>
    </Card>
  );
}

function freezeEligible(date: string) {
  return isWithinRetroWindow(date, FREEZE_RETRO_WINDOW_DAYS);
}

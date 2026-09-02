"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";

import { animatePress, animateTick, killAnime } from "@/lib/anim/anime";

import { HabitIcon } from "@/components/habit/HabitIcon";
import { StreakBadge } from "@/components/habit/StreakBadge";
import { useGamify } from "@/components/gamify/GamifyProvider";
import { Button, Card, CardBody, inputClassName } from "@/components/ui";
import { saveDayNote, skipDay, spendFreeze, toggleDay } from "@/lib/habits/actions";
import {
  FREEZE_RETRO_WINDOW_DAYS,
  HABIT_COLOR_HEX,
  ROUTES,
  isHabitColor,
} from "@/lib/habits/constants";
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
  const checkRef = useRef<HTMLButtonElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
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
  const wasDone = useRef(done);

  useEffect(() => {
    if (!done || wasDone.current) {
      wasDone.current = done;
      return;
    }
    wasDone.current = done;
    const anim = animateTick(pathRef.current);
    return () => killAnime(anim);
  }, [done]);

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
    <Card data-today-row>
      <CardBody className="space-y-3">
        <div className="flex min-w-0 items-start gap-3">
          <button
            ref={checkRef}
            type="button"
            disabled={pending || frozen}
            onPointerDown={(event) => {
              if (!pending && !frozen && event.button === 0) {
                animatePress(checkRef.current);
              }
            }}
            onClick={() => run(() => toggleDay(habit.id, today))}
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-2xl text-lg transition-colors",
              done && "text-white",
              frozen && "bg-freeze-soft text-freeze hairline",
              skipped && "glass-tile text-ink-subtle",
              !log && "glass-tile text-ink-muted hover:bg-glass",
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
            {done ? (
              <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
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
            ) : frozen ? (
              "❄"
            ) : skipped ? (
              "—"
            ) : (
              <HabitIcon name={habit.icon} />
            )}
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="min-w-0 truncate font-semibold text-ink">
                <Link
                  href={ROUTES.habit(habit.id)}
                  className="rounded-sm hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/70"
                >
                  {habit.title}
                </Link>
              </h2>
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
              className="h-11 flex-1 sm:h-8 sm:flex-none"
              onClick={() => run(() => skipDay(habit.id, today))}
            >
              Skip
            </Button>
            {canFreeze ? (
              <Button
                size="sm"
                variant="secondary"
                disabled={pending}
                className="h-11 flex-1 sm:h-8 sm:flex-none"
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

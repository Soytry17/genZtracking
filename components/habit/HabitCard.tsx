import Link from "next/link";

import { HabitIcon } from "@/components/habit/HabitIcon";
import { ProgressBar } from "@/components/habit/ProgressBar";
import { StreakBadge } from "@/components/habit/StreakBadge";
import { Card, CardBody, Pill } from "@/components/ui";
import { HABIT_COLOR_HEX, HABIT_STATUS_LABELS, ROUTES, isHabitColor } from "@/lib/habits/constants";
import { daysRemaining, formatISODate } from "@/lib/habits/dates";
import { progressFromDays } from "@/lib/habits/progress";
import type { Habit, HabitDay } from "@/types/database";

export function HabitCard({
  habit,
  days,
}: {
  habit: Habit;
  days: HabitDay[];
}) {
  const progress = progressFromDays(days, habit);
  const remaining = daysRemaining(habit.start_date, habit.end_date);
  const hex = isHabitColor(habit.color)
    ? HABIT_COLOR_HEX[habit.color]
    : HABIT_COLOR_HEX.violet;

  return (
    <Link
      href={ROUTES.habit(habit.id)}
      className="block min-w-0"
      data-habit-card
    >
      <Card className="h-full rounded-[1.6rem] transition-colors hover:bg-glass-strong active:bg-glass-strong">
        <CardBody className="space-y-4">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="flex size-12 shrink-0 items-center justify-center rounded-2xl"
                style={{ color: hex, backgroundColor: `${hex}22` }}
              >
                <HabitIcon name={habit.icon} className="size-6" />
              </span>
              <div className="min-w-0">
                <h2 className="truncate font-semibold tracking-tight text-ink">{habit.title}</h2>
                <p className="text-xs text-ink-muted">
                  {formatISODate(habit.start_date, { month: "short", day: "numeric" })}
                  {" – "}
                  {formatISODate(habit.end_date, { month: "short", day: "numeric" })}
                </p>
              </div>
            </div>
            <StreakBadge current={habit.current_streak} longest={habit.longest_streak} size="sm" className="shrink-0" />
          </div>

          <ProgressBar
            percent={progress.percent}
            label={`${progress.doneDays} / ${progress.totalDays} days`}
            barClassName="bg-brand"
          />

          <div className="flex flex-wrap items-center gap-2">
            {habit.status !== "active" ? (
              <Pill>{HABIT_STATUS_LABELS[habit.status]}</Pill>
            ) : remaining > 0 ? (
              <Pill>{remaining} days left</Pill>
            ) : (
              <Pill tone="success">Range complete</Pill>
            )}
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}

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
    <Link href={ROUTES.habit(habit.id)} className="habit-card-cv block" data-habit-card>
      <Card className="h-full transition-colors hover:bg-glass-strong">
        <CardBody className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                className="flex size-10 items-center justify-center rounded-2xl glass-thin"
                style={{ color: hex }}
              >
                <HabitIcon name={habit.icon} />
              </span>
              <div>
                <h2 className="font-semibold tracking-tight text-ink">{habit.title}</h2>
                <p className="text-xs text-ink-muted">
                  {formatISODate(habit.start_date, { month: "short", day: "numeric" })}
                  {" – "}
                  {formatISODate(habit.end_date, { month: "short", day: "numeric" })}
                </p>
              </div>
            </div>
            <StreakBadge current={habit.current_streak} longest={habit.longest_streak} size="sm" />
          </div>

          <ProgressBar
            percent={progress.percent}
            label={`${progress.doneDays} / ${progress.totalDays} days`}
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

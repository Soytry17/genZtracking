import { daysElapsed, totalDaysInRange } from "@/lib/habits/dates";
import type { HabitDay, ISODate } from "@/types/database";

export type HabitProgress = {
  totalDays: number;
  elapsedDays: number;
  doneDays: number;
  skippedDays: number;
  frozenDays: number;
  loggedDays: number;
  /** 0..1 of the full commitment marked `done`. Frozen does not count. */
  ratio: number;
  percent: number;
};

export function progressFromDays(
  days: readonly HabitDay[],
  range: { start_date: ISODate; end_date: ISODate },
  today?: ISODate,
): HabitProgress {
  const totalDays = days.length || totalDaysInRange(range.start_date, range.end_date);
  let doneDays = 0;
  let skippedDays = 0;
  let frozenDays = 0;

  for (const day of days) {
    if (day.status === "done") doneDays += 1;
    else if (day.status === "skipped") skippedDays += 1;
    else if (day.status === "frozen") frozenDays += 1;
  }

  const loggedDays = doneDays + skippedDays + frozenDays;
  const ratio = totalDays === 0 ? 0 : doneDays / totalDays;

  return {
    totalDays,
    elapsedDays: daysElapsed(range.start_date, range.end_date, today),
    doneDays,
    skippedDays,
    frozenDays,
    loggedDays,
    ratio,
    percent: Math.round(ratio * 100),
  };
}

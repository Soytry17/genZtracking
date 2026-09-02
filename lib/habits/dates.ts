/**
 * Date helpers for habit ranges.
 *
 * Everything here works on ISO `YYYY-MM-DD` strings and does arithmetic in UTC,
 * so a value never shifts by a day depending on where the code runs. The only
 * place a real timezone is consulted is `todayISO()`.
 *
 * `APP_TIME_ZONE` defaults to `Asia/Phnom_Penh` and must match
 * `public.app_time_zone()` in supabase/migrations/0001_init.sql. Change both
 * together or the database and the UI will disagree about which day "today" is.
 */

import type { HabitDay, HabitLog, ISODate } from "@/types/database";

export const APP_TIME_ZONE =
  process.env.NEXT_PUBLIC_APP_TIME_ZONE ?? "Asia/Phnom_Penh";

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MS_PER_DAY = 86_400_000;

const WEEKDAY_LABELS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;

/** Guard for the `YYYY-MM-DD` shape used by every `date` column. */
export function isISODate(value: unknown): value is ISODate {
  if (typeof value !== "string" || !ISO_DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const probe = new Date(Date.UTC(year, month - 1, day));
  return (
    probe.getUTCFullYear() === year &&
    probe.getUTCMonth() === month - 1 &&
    probe.getUTCDate() === day
  );
}

function assertISODate(value: ISODate, label = "date"): ISODate {
  if (!isISODate(value)) {
    throw new RangeError(`Expected ${label} as YYYY-MM-DD, received "${value}"`);
  }
  return value;
}

/** Midnight-UTC `Date` for an ISO date. Useful for `Intl` formatting only. */
export function fromISODate(date: ISODate): Date {
  assertISODate(date);
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/** Formats a `Date` as an ISO date in the given timezone. */
export function toISODate(date: Date, timeZone: string = "UTC"): ISODate {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const lookup = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${lookup("year")}-${lookup("month")}-${lookup("day")}`;
}

/**
 * Today's calendar date in the app's fixed timezone.
 * Server and browser agree because the timezone is not taken from the machine.
 */
export function todayISO(timeZone: string = APP_TIME_ZONE): ISODate {
  return toISODate(new Date(), timeZone);
}

/** Shifts an ISO date by whole days. Negative values go backwards. */
export function addDays(date: ISODate, amount: number): ISODate {
  const shifted = new Date(fromISODate(date).getTime() + amount * MS_PER_DAY);
  return toISODate(shifted, "UTC");
}

/** `-1` when a is earlier, `1` when later, `0` when equal. */
export function compareISODate(a: ISODate, b: ISODate): -1 | 0 | 1 {
  assertISODate(a, "a");
  assertISODate(b, "b");
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Whole days from `from` to `to`. Positive when `to` is later. */
export function differenceInDays(from: ISODate, to: ISODate): number {
  return Math.round(
    (fromISODate(to).getTime() - fromISODate(from).getTime()) / MS_PER_DAY,
  );
}

export function minISODate(a: ISODate, b: ISODate): ISODate {
  return compareISODate(a, b) <= 0 ? a : b;
}

export function maxISODate(a: ISODate, b: ISODate): ISODate {
  return compareISODate(a, b) >= 0 ? a : b;
}

export function clampISODate(
  date: ISODate,
  start: ISODate,
  end: ISODate,
): ISODate {
  return minISODate(maxISODate(date, start), end);
}

/**
 * Converts a commitment length into the last day of the range.
 * Inclusive of the start day: a 1 day habit starts and ends on the same date,
 * and `30` starting on the 1st ends on the 30th.
 */
export function endDateFromDuration(
  startDate: ISODate,
  durationDays: number,
): ISODate {
  if (!Number.isInteger(durationDays) || durationDays < 1) {
    throw new RangeError(
      `durationDays must be a positive integer, received ${durationDays}`,
    );
  }
  return addDays(startDate, durationDays - 1);
}

/** Inverse of `endDateFromDuration`. Inclusive, so start === end returns 1. */
export function durationFromEndDate(
  startDate: ISODate,
  endDate: ISODate,
): number {
  return differenceInDays(startDate, endDate) + 1;
}

/** Inclusive day count of a range. Alias of `durationFromEndDate`. */
export function totalDaysInRange(start: ISODate, end: ISODate): number {
  return durationFromEndDate(start, end);
}

/**
 * Expands an inclusive range into every ISO date it covers.
 * Returns `[]` when `end` is before `start`.
 */
export function expandDateRange(start: ISODate, end: ISODate): ISODate[] {
  assertISODate(start, "start");
  assertISODate(end, "end");
  if (compareISODate(start, end) > 0) return [];

  const days: ISODate[] = [];
  let cursor = start;
  while (compareISODate(cursor, end) <= 0) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return days;
}

export function isWithinRange(
  date: ISODate,
  start: ISODate,
  end: ISODate,
): boolean {
  return compareISODate(date, start) >= 0 && compareISODate(date, end) <= 0;
}

export function isToday(
  date: ISODate,
  timeZone: string = APP_TIME_ZONE,
): boolean {
  return date === todayISO(timeZone);
}

export function isPast(
  date: ISODate,
  timeZone: string = APP_TIME_ZONE,
): boolean {
  return compareISODate(date, todayISO(timeZone)) < 0;
}

export function isFuture(
  date: ISODate,
  timeZone: string = APP_TIME_ZONE,
): boolean {
  return compareISODate(date, todayISO(timeZone)) > 0;
}

/**
 * How many days of a range have already happened, including today.
 * Clamped to `0..totalDaysInRange`.
 */
export function daysElapsed(
  start: ISODate,
  end: ISODate,
  today: ISODate = todayISO(),
): number {
  if (compareISODate(today, start) < 0) return 0;
  return Math.min(
    durationFromEndDate(start, minISODate(today, end)),
    totalDaysInRange(start, end),
  );
}

/** Days left in a range, including today. `0` once the range has passed. */
export function daysRemaining(
  start: ISODate,
  end: ISODate,
  today: ISODate = todayISO(),
): number {
  return Math.max(totalDaysInRange(start, end) - daysElapsed(start, end, today), 0);
}

/** `0` for Sunday through `6` for Saturday. Used to align the day grid. */
export function weekdayIndex(date: ISODate): number {
  return fromISODate(date).getUTCDay();
}

export function weekdayLabel(date: ISODate): string {
  return WEEKDAY_LABELS[weekdayIndex(date)];
}

/** `YYYY-MM` bucket key for a date. */
export function monthKey(date: ISODate): string {
  return assertISODate(date).slice(0, 7);
}

/**
 * Human display for an ISO date, rendered in UTC so it matches the stored day.
 * Defaults to e.g. "Mar 4, 2026".
 */
export function formatISODate(
  date: ISODate,
  options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  },
  locale = "en-US",
): string {
  return new Intl.DateTimeFormat(locale, {
    ...options,
    timeZone: "UTC",
  }).format(fromISODate(date));
}

/** Groups dates into calendar months, preserving order. */
export function groupByMonth(
  dates: readonly ISODate[],
): { key: string; label: string; dates: ISODate[] }[] {
  const groups: { key: string; label: string; dates: ISODate[] }[] = [];

  for (const date of dates) {
    const key = monthKey(date);
    const last = groups.at(-1);
    if (last?.key === key) {
      last.dates.push(date);
    } else {
      groups.push({
        key,
        label: formatISODate(date, { month: "long", year: "numeric" }),
        dates: [date],
      });
    }
  }

  return groups;
}

/**
 * Whether a day is still inside the retroactive window, i.e. today or up to
 * `windowDays` days before it. Future days are never in the window.
 */
export function isWithinRetroWindow(
  date: ISODate,
  windowDays: number,
  today: ISODate = todayISO(),
): boolean {
  return isWithinRange(date, addDays(today, -windowDays), today);
}

/**
 * Joins a habit's date range against its logs to produce one cell per day.
 * Nothing is stored per day, so this is how the grid, the progress bar and the
 * Today list all derive their state.
 */
export function buildHabitDays(
  range: { start_date: ISODate; end_date: ISODate },
  logs: readonly Pick<HabitLog, "id" | "log_date" | "status" | "note">[] = [],
  options: { today?: ISODate } = {},
): HabitDay[] {
  const today = options.today ?? todayISO();
  const byDate = new Map(logs.map((log) => [log.log_date, log]));

  return expandDateRange(range.start_date, range.end_date).map(
    (date, index) => {
      const log = byDate.get(date);
      const comparison = compareISODate(date, today);

      return {
        date,
        status: log?.status ?? null,
        note: log?.note ?? null,
        logId: log?.id ?? null,
        isToday: comparison === 0,
        isPast: comparison < 0,
        isFuture: comparison > 0,
        dayNumber: index + 1,
      };
    },
  );
}

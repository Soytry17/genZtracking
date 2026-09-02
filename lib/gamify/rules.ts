/**
 * Pure gamification rules. Easy to unit-test and tune without touching I/O.
 *
 * XP
 *   10 per completed (`done`) day
 *   +25 bonus whenever the resulting streak is a multiple of 7
 *
 * Levels
 *   Cumulative XP to *reach* level L: 50 * (L - 1) * L
 *   L1 = 0, L2 = 100, L3 = 300, L4 = 600, L5 = 1000, …
 *
 * Badges (ids match the rows seeded in 0001_init.sql)
 *   first_habit, streak_7/21/66/100, perfect_finish, comeback
 */

import { addDays, isWithinRange } from "@/lib/habits/dates";
import type { HabitLogStatus, ISODate } from "@/types/database";

export const XP_PER_DAY = 10;
export const STREAK_BONUS_XP = 25;
export const STREAK_BONUS_EVERY_DAYS = 7;

export const MAX_LEVEL = 99;

export const STREAK_BADGE_THRESHOLDS = [7, 21, 66, 100] as const;

export const STREAK_BADGE_IDS = {
  7: "streak_7",
  21: "streak_21",
  66: "streak_66",
  100: "streak_100",
} as const;

export const BADGE_IDS = {
  firstHabit: "first_habit",
  streak7: "streak_7",
  streak21: "streak_21",
  streak66: "streak_66",
  streak100: "streak_100",
  perfectFinish: "perfect_finish",
  comeback: "comeback",
} as const;

export type BadgeId = (typeof BADGE_IDS)[keyof typeof BADGE_IDS];

/** Cumulative XP required to be this level. Level 1 is 0. */
export function xpForLevel(level: number): number {
  const clamped = Math.max(1, Math.floor(level));
  if (clamped <= 1) return 0;
  return 50 * (clamped - 1) * clamped;
}

/** Highest level whose threshold is <= xp. */
export function levelForXp(xp: number): number {
  const safe = Math.max(0, Math.floor(xp));
  let level = 1;
  while (level < MAX_LEVEL && xpForLevel(level + 1) <= safe) {
    level += 1;
  }
  return level;
}

export type LevelProgress = {
  level: number;
  xp: number;
  xpIntoLevel: number;
  xpForNext: number;
  /** 0..1 progress through the current level. 1 at max level. */
  progress: number;
  nextLevelXp: number;
  isMaxLevel: boolean;
};

export function progressToNextLevel(xp: number): LevelProgress {
  const safe = Math.max(0, Math.floor(xp));
  const level = levelForXp(safe);
  const isMaxLevel = level >= MAX_LEVEL;
  const currentThreshold = xpForLevel(level);
  const nextLevelXp = isMaxLevel ? currentThreshold : xpForLevel(level + 1);
  const xpForNext = Math.max(nextLevelXp - currentThreshold, 1);
  const xpIntoLevel = safe - currentThreshold;

  return {
    level,
    xp: safe,
    xpIntoLevel,
    xpForNext,
    progress: isMaxLevel ? 1 : Math.min(1, Math.max(0, xpIntoLevel / xpForNext)),
    nextLevelXp,
    isMaxLevel,
  };
}

export type DayXpBreakdown = {
  dayXp: number;
  bonusXp: number;
  total: number;
};

/**
 * XP awarded when a day is marked `done`.
 * `streakAfter` is the habit's current_streak *after* the log is written.
 */
export function xpForDayCompletion(streakAfter: number): DayXpBreakdown {
  const dayXp = XP_PER_DAY;
  const bonusXp =
    streakAfter > 0 && streakAfter % STREAK_BONUS_EVERY_DAYS === 0
      ? STREAK_BONUS_XP
      : 0;
  return { dayXp, bonusXp, total: dayXp + bonusXp };
}

export type BadgeStats = {
  habitsCreated: number;
  /** Longest current_streak/longest_streak seen across the user's habits. */
  longestStreak: number;
  perfectHabitCompleted: boolean;
  comebackReady: boolean;
};

/** Which badge ids the given stats qualify for. Does not look at what's already awarded. */
export function badgesEarnedFor(stats: BadgeStats): BadgeId[] {
  const ids: BadgeId[] = [];

  if (stats.habitsCreated >= 1) ids.push(BADGE_IDS.firstHabit);

  for (const threshold of STREAK_BADGE_THRESHOLDS) {
    if (stats.longestStreak >= threshold) {
      ids.push(STREAK_BADGE_IDS[threshold]);
    }
  }

  if (stats.perfectHabitCompleted) ids.push(BADGE_IDS.perfectFinish);
  if (stats.comebackReady) ids.push(BADGE_IDS.comeback);

  return ids;
}

/**
 * True when there are 7 consecutive calendar days marked `done` (not frozen)
 * starting on or after the day *after* a freeze was spent.
 */
export function hasComebackStreak(
  freezeDate: ISODate,
  logs: readonly { log_date: ISODate; status: HabitLogStatus }[],
  windowDays = 7,
): boolean {
  const done = new Set(
    logs.filter((log) => log.status === "done").map((log) => log.log_date),
  );

  const start = addDays(freezeDate, 1);
  const lastPossibleStart = addDays(start, Math.max(logs.length, windowDays));

  let cursor = start;
  while (cursor <= lastPossibleStart) {
    let run = 0;
    for (let i = 0; i < windowDays; i += 1) {
      if (done.has(addDays(cursor, i))) run += 1;
      else break;
    }
    if (run >= windowDays) return true;
    cursor = addDays(cursor, 1);
  }

  return false;
}

export function isPerfectHabit(input: {
  start_date: ISODate;
  end_date: ISODate;
  logs: readonly { log_date: ISODate; status: HabitLogStatus }[];
}): boolean {
  const doneDates = new Set(
    input.logs.filter((log) => log.status === "done").map((log) => log.log_date),
  );

  let cursor = input.start_date;
  while (isWithinRange(cursor, input.start_date, input.end_date)) {
    if (!doneDates.has(cursor)) return false;
    cursor = addDays(cursor, 1);
  }
  return true;
}

export function dayXpDedupeKey(habitId: string, date: ISODate): string {
  return `day:${habitId}:${date}`;
}

export function streakBonusDedupeKey(habitId: string, date: ISODate): string {
  return `streak:${habitId}:${date}`;
}

export function badgeXpDedupeKey(badgeId: string): string {
  return `badge:${badgeId}`;
}

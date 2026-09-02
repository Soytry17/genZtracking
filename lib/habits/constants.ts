/**
 * Shared runtime constants for habits and freezes.
 *
 * Values duplicated in SQL are called out below. If you change one, change the
 * other in supabase/migrations/0001_init.sql too.
 */

import type {
  HabitLogStatus,
  HabitStatus,
  ISODate,
} from "@/types/database";

// ---------------------------------------------------------------------------
// Freeze rules
// ---------------------------------------------------------------------------

/** Consecutive days needed to earn one freeze token. */
export const FREEZE_EARN_EVERY_DAYS = 7;

/** Hard cap on banked tokens. Mirrored by a check constraint on profiles. */
export const FREEZE_MAX_TOKENS = 3;

/** How far back a freeze may be applied. Mirrors `public.freeze_retro_window_days()`. */
export const FREEZE_RETRO_WINDOW_DAYS = 2;

// ---------------------------------------------------------------------------
// Enum presentation
// ---------------------------------------------------------------------------

export const HABIT_STATUSES = [
  "active",
  "paused",
  "completed",
  "archived",
] as const satisfies readonly HabitStatus[];

export const HABIT_LOG_STATUSES = [
  "done",
  "skipped",
  "frozen",
] as const satisfies readonly HabitLogStatus[];

export const HABIT_STATUS_LABELS: Record<HabitStatus, string> = {
  active: "Active",
  paused: "Paused",
  completed: "Completed",
  archived: "Archived",
};

export const HABIT_LOG_STATUS_LABELS: Record<HabitLogStatus, string> = {
  done: "Done",
  skipped: "Skipped",
  frozen: "Frozen",
};

/** Statuses that still show up on the Today dashboard. */
export const ACTIVE_HABIT_STATUSES = ["active"] as const;

/** Statuses shown on the archive page. */
export const ARCHIVED_HABIT_STATUSES = [
  "paused",
  "completed",
  "archived",
] as const;

// ---------------------------------------------------------------------------
// Habit appearance
// ---------------------------------------------------------------------------

/**
 * `habits.color` stores one of these keys, never a hex value, so the palette can
 * be retuned without a migration. Each key has a matching
 * `--color-habit-<key>` token in app/globals.css.
 */
export const HABIT_COLORS = [
  "violet",
  "cyan",
  "emerald",
  "amber",
  "rose",
  "blue",
  "lime",
  "fuchsia",
] as const;

export type HabitColor = (typeof HABIT_COLORS)[number];

export const DEFAULT_HABIT_COLOR: HabitColor = "violet";

export const HABIT_COLOR_HEX: Record<HabitColor, string> = {
  violet: "#7c5cff",
  cyan: "#22d3ee",
  emerald: "#34d399",
  amber: "#fbbf24",
  rose: "#fb7185",
  blue: "#60a5fa",
  lime: "#a3e635",
  fuchsia: "#e879f9",
};

export function isHabitColor(value: string): value is HabitColor {
  return (HABIT_COLORS as readonly string[]).includes(value);
}

/** Resolves any stored color value to a hex string, falling back to the default. */
export function habitColorHex(value: string): string {
  return HABIT_COLOR_HEX[
    isHabitColor(value) ? value : DEFAULT_HABIT_COLOR
  ];
}

/**
 * `habits.icon` and `habit_presets.icon` store one of these keys. Render them
 * however you like; nothing here is tied to a specific icon library.
 */
export const HABIT_ICONS = [
  "sparkles",
  "book",
  "lotus",
  "notebook",
  "dumbbell",
  "footprints",
  "stretch",
  "droplet",
  "moon",
  "phone-off",
  "code",
  "languages",
  "target",
  "broom",
  "pencil",
  "music",
] as const;

export type HabitIcon = (typeof HABIT_ICONS)[number];

export const DEFAULT_HABIT_ICON: HabitIcon = "sparkles";

// ---------------------------------------------------------------------------
// Form limits, matching the SQL check constraints
// ---------------------------------------------------------------------------

export const HABIT_TITLE_MAX_LENGTH = 120;
export const HABIT_DESCRIPTION_MAX_LENGTH = 2000;
export const DAY_NOTE_MAX_LENGTH = 2000;
export const GOAL_BADGE_TITLE_MAX_LENGTH = 80;
export const GOAL_BADGE_DESCRIPTION_MAX_LENGTH = 280;

/** Emoji picker for personal goal badges. Stored as the character itself. */
export const GOAL_BADGE_ICONS = [
  "🏆",
  "⭐",
  "🔥",
  "📚",
  "💪",
  "🎯",
  "🌱",
  "✨",
  "🥇",
  "💎",
  "🌙",
  "🧠",
  "👑",
  "🪄",
] as const;

export type GoalBadgeIcon = (typeof GOAL_BADGE_ICONS)[number];

export const DEFAULT_GOAL_BADGE_ICON: GoalBadgeIcon = "🏆";

export function isGoalBadgeIcon(value: string): value is GoalBadgeIcon {
  return (GOAL_BADGE_ICONS as readonly string[]).includes(value);
}

export const HABIT_DURATION_MIN_DAYS = 1;
export const HABIT_DURATION_MAX_DAYS = 3650;

/** Durations offered as one-tap choices in the create form. */
export const HABIT_DURATION_PRESETS = [7, 21, 30, 66, 100] as const;

// ---------------------------------------------------------------------------
// Route map, so nav links and redirects stay in one place
// ---------------------------------------------------------------------------

export const ROUTES = {
  home: "/",
  login: "/login",
  signup: "/signup",
  today: "/today",
  habits: "/habits",
  newHabit: "/habits/new",
  habit: (id: string) => `/habits/${id}`,
  archive: "/archive",
  profile: "/profile",
} as const;

/** Where a signed-in user lands by default. */
export const DEFAULT_SIGNED_IN_ROUTE: string = ROUTES.today;

export type DateRange = { start_date: ISODate; end_date: ISODate };

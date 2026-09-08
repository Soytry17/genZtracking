import { cache } from "react";

import { ACTIVE_HABIT_STATUSES, ARCHIVED_HABIT_STATUSES } from "@/lib/habits/constants";
import { addDays, isWithinRange, todayISO } from "@/lib/habits/dates";
import { createClient } from "@/lib/supabase/server";
import type {
  Badge,
  GoalBadge,
  Habit,
  HabitLog,
  HabitPreset,
  ISODate,
  UserBadgeWithBadge,
} from "@/types/database";

export const getHabits = cache(async (userId: string, statuses?: Habit["status"][]) => {
  const supabase = await createClient();
  let query = supabase
    .from("habits")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (statuses?.length) {
    query = query.in("status", statuses);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Habit[];
});

export const getActiveHabits = cache(async (userId: string) => {
  return getHabits(userId, [...ACTIVE_HABIT_STATUSES]);
});

export const getArchivedHabits = cache(async (userId: string) => {
  return getHabits(userId, [...ARCHIVED_HABIT_STATUSES]);
});

export const getHabit = cache(async (userId: string, habitId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("habits")
    .select("*")
    .eq("id", habitId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return (data as Habit | null) ?? null;
});

export const getHabitLogs = cache(async (habitId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("habit_logs")
    .select("*")
    .eq("habit_id", habitId)
    .order("log_date", { ascending: true });

  if (error) throw error;
  return (data ?? []) as HabitLog[];
});

export const getLogsForHabits = cache(
  async (habitIds: string[], dates?: ISODate[]) => {
    if (habitIds.length === 0) return [] as HabitLog[];

    const supabase = await createClient();
    let query = supabase.from("habit_logs").select("*").in("habit_id", habitIds);

    if (dates?.length) {
      query = query.in("log_date", dates);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as HabitLog[];
  },
);

export type TodayHabit = {
  habit: Habit;
  log: HabitLog | null;
  yesterdayLog: HabitLog | null;
  yesterdayDue: boolean;
};

/** Active habits whose range includes today, with today's (and yesterday's) logs. */
export const getTodayHabits = cache(async (userId: string, today: ISODate = todayISO()) => {
  const habits = await getActiveHabits(userId);
  const yesterday = addDays(today, -1);
  const due = habits.filter((habit) =>
    isWithinRange(today, habit.start_date, habit.end_date),
  );

  const logs = await getLogsForHabits(
    due.map((habit) => habit.id),
    [today, yesterday],
  );
  const todayByHabit = new Map<string, HabitLog>();
  const yesterdayByHabit = new Map<string, HabitLog>();
  for (const log of logs) {
    if (log.log_date === today) todayByHabit.set(log.habit_id, log);
    else if (log.log_date === yesterday) yesterdayByHabit.set(log.habit_id, log);
  }

  return due.map((habit): TodayHabit => ({
    habit,
    log: todayByHabit.get(habit.id) ?? null,
    yesterdayLog: yesterdayByHabit.get(habit.id) ?? null,
    yesterdayDue: isWithinRange(yesterday, habit.start_date, habit.end_date),
  }));
});

export const getPresets = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("habit_presets")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data ?? []) as HabitPreset[];
});

export const getBadges = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("badges")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Badge[];
});

export const getUserBadges = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_badges")
    .select("*, badges(*)")
    .eq("user_id", userId)
    .order("earned_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as UserBadgeWithBadge[];
});

export const getGoalBadges = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("goal_badges")
    .select("*")
    .eq("user_id", userId)
    .order("awarded_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as GoalBadge[];
});

export const getGoalBadgeForHabit = cache(async (userId: string, habitId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("goal_badges")
    .select("*")
    .eq("user_id", userId)
    .eq("habit_id", habitId)
    .maybeSingle();

  if (error) throw error;
  return (data as GoalBadge | null) ?? null;
});

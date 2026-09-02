"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import {
  badgesEarnedFor,
  dayXpDedupeKey,
  hasComebackStreak,
  isPerfectHabit,
  levelForXp,
  streakBonusDedupeKey,
  xpForDayCompletion,
} from "@/lib/gamify/rules";
import {
  DAY_NOTE_MAX_LENGTH,
  DEFAULT_HABIT_COLOR,
  DEFAULT_HABIT_ICON,
  FREEZE_RETRO_WINDOW_DAYS,
  HABIT_DESCRIPTION_MAX_LENGTH,
  HABIT_DURATION_MAX_DAYS,
  HABIT_DURATION_MIN_DAYS,
  HABIT_TITLE_MAX_LENGTH,
  ROUTES,
  isHabitColor,
} from "@/lib/habits/constants";
import {
  endDateFromDuration,
  isFuture,
  isISODate,
  isWithinRange,
  isWithinRetroWindow,
} from "@/lib/habits/dates";
import { createClient } from "@/lib/supabase/server";
import type {
  Badge,
  Habit,
  HabitLog,
  HabitLogStatus,
  HabitStatus,
  ISODate,
  Profile,
  SpendFreezeResult,
} from "@/types/database";

export type GamifyDelta = {
  xpDelta: number;
  previousXp: number;
  newXp: number;
  previousLevel: number;
  newLevel: number;
  leveledUp: boolean;
  newBadges: Badge[];
  freezeTokens: number;
};

export type ActionOk<T> = { ok: true; data: T; gamify: GamifyDelta };
export type ActionErr = { ok: false; error: string };
export type ActionResult<T = null> = ActionOk<T> | ActionErr;

function fail(error: string): ActionErr {
  return { ok: false, error };
}

function messageFromUnknown(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

function revalidateHabit(habitId?: string) {
  revalidatePath(ROUTES.today);
  revalidatePath(ROUTES.habits);
  revalidatePath(ROUTES.archive);
  revalidatePath(ROUTES.profile);
  if (habitId) revalidatePath(ROUTES.habit(habitId));
}

async function loadHabit(
  habitId: string,
  userId: string,
): Promise<{ habit: Habit } | ActionErr> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("habits")
    .select("*")
    .eq("id", habitId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return fail(error.message);
  if (!data) return fail("Habit not found.");
  return { habit: data as Habit };
}

function assertLoggableDay(habit: Habit, date: ISODate): string | null {
  if (!isISODate(date)) return "That date is not valid.";
  if (!isWithinRange(date, habit.start_date, habit.end_date)) {
    return "That day is outside this habit's range.";
  }
  if (isFuture(date)) return "You can't log a future day.";
  if (habit.status === "archived" || habit.status === "completed") {
    return "Restore this habit before logging days.";
  }
  return null;
}

async function getLog(habitId: string, date: ISODate): Promise<HabitLog | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("habit_logs")
    .select("*")
    .eq("habit_id", habitId)
    .eq("log_date", date)
    .maybeSingle();
  return (data as HabitLog | null) ?? null;
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  return (data as Profile | null) ?? null;
}

async function syncProfileXp(userId: string): Promise<Profile> {
  const supabase = await createClient();
  const { data: events, error } = await supabase
    .from("xp_events")
    .select("amount")
    .eq("user_id", userId);

  if (error) throw error;

  const xp = (events ?? []).reduce((sum, row) => sum + row.amount, 0);
  const level = levelForXp(xp);

  const { data, error: updateError } = await supabase
    .from("profiles")
    .update({ xp, level })
    .eq("id", userId)
    .select("*")
    .single();

  if (updateError) throw updateError;
  return data as Profile;
}

async function insertXpEvent(row: {
  userId: string;
  habitId?: string;
  kind: "day_completed" | "streak_bonus" | "badge_unlocked" | "habit_created" | "habit_completed";
  amount: number;
  logDate?: ISODate;
  dedupeKey: string;
}): Promise<number> {
  const supabase = await createClient();
  const { error } = await supabase.from("xp_events").insert({
    user_id: row.userId,
    habit_id: row.habitId ?? null,
    kind: row.kind,
    amount: row.amount,
    log_date: row.logDate ?? null,
    dedupe_key: row.dedupeKey,
  });

  if (error) {
    if (error.code === "23505") return 0;
    throw error;
  }
  return row.amount;
}

async function deleteXpEvents(userId: string, dedupeKeys: string[]): Promise<void> {
  if (dedupeKeys.length === 0) return;
  const supabase = await createClient();
  await supabase
    .from("xp_events")
    .delete()
    .eq("user_id", userId)
    .in("dedupe_key", dedupeKeys);
}

async function awardDayXp(
  userId: string,
  habitId: string,
  date: ISODate,
  streakAfter: number,
): Promise<number> {
  const breakdown = xpForDayCompletion(streakAfter);
  let awarded = 0;
  awarded += await insertXpEvent({
    userId,
    habitId,
    kind: "day_completed",
    amount: breakdown.dayXp,
    logDate: date,
    dedupeKey: dayXpDedupeKey(habitId, date),
  });
  if (breakdown.bonusXp > 0) {
    awarded += await insertXpEvent({
      userId,
      habitId,
      kind: "streak_bonus",
      amount: breakdown.bonusXp,
      logDate: date,
      dedupeKey: streakBonusDedupeKey(habitId, date),
    });
  }
  return awarded;
}

async function revokeDayXp(userId: string, habitId: string, date: ISODate) {
  await deleteXpEvents(userId, [
    dayXpDedupeKey(habitId, date),
    streakBonusDedupeKey(habitId, date),
  ]);
}

async function collectBadgeStats(userId: string): Promise<{
  habitsCreated: number;
  longestStreak: number;
  perfectHabitCompleted: boolean;
  comebackReady: boolean;
}> {
  const supabase = await createClient();
  const { data: habits } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", userId);

  const list = (habits ?? []) as Habit[];
  const longestStreak = list.reduce(
    (max, habit) => Math.max(max, habit.longest_streak, habit.current_streak),
    0,
  );

  let perfectHabitCompleted = false;
  for (const habit of list.filter((row) => row.status === "completed")) {
    const { data: logs } = await supabase
      .from("habit_logs")
      .select("log_date, status")
      .eq("habit_id", habit.id);
    if (
      isPerfectHabit({
        start_date: habit.start_date,
        end_date: habit.end_date,
        logs: (logs ?? []) as Pick<HabitLog, "log_date" | "status">[],
      })
    ) {
      perfectHabitCompleted = true;
      break;
    }
  }

  const { data: spends } = await supabase
    .from("freeze_ledger")
    .select("habit_id, log_date")
    .eq("user_id", userId)
    .eq("reason", "spent")
    .not("log_date", "is", null)
    .order("created_at", { ascending: false })
    .limit(20);

  let comebackReady = false;
  for (const spend of spends ?? []) {
    if (!spend.habit_id || !spend.log_date) continue;
    const { data: logs } = await supabase
      .from("habit_logs")
      .select("log_date, status")
      .eq("habit_id", spend.habit_id);
    if (
      hasComebackStreak(
        spend.log_date,
        (logs ?? []) as Pick<HabitLog, "log_date" | "status">[],
      )
    ) {
      comebackReady = true;
      break;
    }
  }

  return {
    habitsCreated: list.length,
    longestStreak,
    perfectHabitCompleted,
    comebackReady,
  };
}

async function syncBadges(
  userId: string,
  habitId?: string,
): Promise<Badge[]> {
  const supabase = await createClient();
  const stats = await collectBadgeStats(userId);
  const deserved = badgesEarnedFor(stats);

  const { data: existing } = await supabase
    .from("user_badges")
    .select("badge_id")
    .eq("user_id", userId);

  const have = new Set((existing ?? []).map((row) => row.badge_id));
  const fresh = deserved.filter((id) => !have.has(id));
  if (fresh.length === 0) return [];

  const { data: catalog } = await supabase
    .from("badges")
    .select("*")
    .in("id", fresh);

  const awarded = (catalog ?? []) as Badge[];

  await supabase.from("user_badges").insert(
    fresh.map((badgeId) => ({
      user_id: userId,
      badge_id: badgeId,
      habit_id: habitId ?? null,
    })),
  );

  return awarded;
}

async function captureGamify(
  userId: string,
  previous: Profile | null,
  habitId?: string,
): Promise<GamifyDelta> {
  const before = previous ?? (await fetchProfile(userId));
  const previousXp = before?.xp ?? 0;
  const previousLevel = before?.level ?? 1;

  const newBadges = await syncBadges(userId, habitId);
  const profile = await syncProfileXp(userId);
  const refreshed = (await fetchProfile(userId)) ?? profile;

  return {
    xpDelta: refreshed.xp - previousXp,
    previousXp,
    newXp: refreshed.xp,
    previousLevel,
    newLevel: refreshed.level,
    leveledUp: refreshed.level > previousLevel,
    newBadges,
    freezeTokens: refreshed.freeze_tokens,
  };
}

async function currentStreak(habitId: string): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("habits")
    .select("current_streak")
    .eq("id", habitId)
    .maybeSingle();
  return data?.current_streak ?? 0;
}

export async function createHabit(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const title = String(formData.get("title") ?? "").trim();
  const descriptionRaw = String(formData.get("description") ?? "").trim();
  const startDate = String(formData.get("start_date") ?? "");
  const endDateRaw = String(formData.get("end_date") ?? "");
  const durationRaw = String(formData.get("duration_days") ?? "").trim();
  const colorRaw = String(formData.get("color") ?? DEFAULT_HABIT_COLOR);
  const icon = String(formData.get("icon") ?? DEFAULT_HABIT_ICON).trim() || DEFAULT_HABIT_ICON;

  if (!title) return fail("Give this habit a name.");
  if (title.length > HABIT_TITLE_MAX_LENGTH) {
    return fail(`Keep the title under ${HABIT_TITLE_MAX_LENGTH} characters.`);
  }
  if (descriptionRaw.length > HABIT_DESCRIPTION_MAX_LENGTH) {
    return fail(`Keep the description under ${HABIT_DESCRIPTION_MAX_LENGTH} characters.`);
  }
  if (!isISODate(startDate)) return fail("Pick a valid start date.");

  let durationDays: number | null = null;
  if (durationRaw) {
    durationDays = Number(durationRaw);
    if (
      !Number.isInteger(durationDays) ||
      durationDays < HABIT_DURATION_MIN_DAYS ||
      durationDays > HABIT_DURATION_MAX_DAYS
    ) {
      return fail("Duration must be a whole number of days between 1 and 3650.");
    }
  }

  const endDate = durationDays
    ? endDateFromDuration(startDate, durationDays)
    : endDateRaw;

  if (!isISODate(endDate)) return fail("Pick a valid end date.");
  if (endDate < startDate) return fail("End date can't be before the start date.");

  const color = isHabitColor(colorRaw) ? colorRaw : DEFAULT_HABIT_COLOR;
  const previous = await fetchProfile(user.id);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("habits")
    .insert({
      user_id: user.id,
      title,
      description: descriptionRaw || null,
      duration_days: durationDays,
      start_date: startDate,
      end_date: endDate,
      color,
      icon,
    })
    .select("id")
    .single();

  if (error || !data) return fail(error?.message ?? "Could not create the habit.");

  await captureGamify(user.id, previous, data.id);
  revalidateHabit(data.id);
  redirect(ROUTES.habit(data.id));
}

export async function toggleDay(
  habitId: string,
  date: ISODate,
): Promise<ActionResult<{ status: HabitLogStatus | null }>> {
  const user = await requireUser();
  const loaded = await loadHabit(habitId, user.id);
  if ("ok" in loaded) return loaded;

  const blocked = assertLoggableDay(loaded.habit, date);
  if (blocked) return fail(blocked);

  const existing = await getLog(habitId, date);
  if (existing?.status === "frozen") {
    return fail("Frozen days can't be toggled.");
  }

  const previous = await fetchProfile(user.id);
  const supabase = await createClient();

  if (existing?.status === "done") {
    const { error } = await supabase.from("habit_logs").delete().eq("id", existing.id);
    if (error) return fail(error.message);
    await revokeDayXp(user.id, habitId, date);
    const gamify = await captureGamify(user.id, previous, habitId);
    revalidateHabit(habitId);
    return { ok: true, data: { status: null }, gamify };
  }

  if (existing) {
    const { error } = await supabase
      .from("habit_logs")
      .update({ status: "done" })
      .eq("id", existing.id);
    if (error) return fail(error.message);
  } else {
    const { error } = await supabase.from("habit_logs").insert({
      habit_id: habitId,
      user_id: user.id,
      log_date: date,
      status: "done",
    });
    if (error) return fail(error.message);
  }

  const streak = await currentStreak(habitId);
  await awardDayXp(user.id, habitId, date, streak);
  const gamify = await captureGamify(user.id, previous, habitId);
  revalidateHabit(habitId);
  return { ok: true, data: { status: "done" }, gamify };
}

export async function skipDay(
  habitId: string,
  date: ISODate,
): Promise<ActionResult<{ status: HabitLogStatus }>> {
  const user = await requireUser();
  const loaded = await loadHabit(habitId, user.id);
  if ("ok" in loaded) return loaded;

  const blocked = assertLoggableDay(loaded.habit, date);
  if (blocked) return fail(blocked);

  const existing = await getLog(habitId, date);
  if (existing?.status === "frozen") return fail("Frozen days can't be skipped.");

  const previous = await fetchProfile(user.id);
  const supabase = await createClient();

  if (existing?.status === "done") {
    await revokeDayXp(user.id, habitId, date);
  }

  if (existing) {
    const { error } = await supabase
      .from("habit_logs")
      .update({ status: "skipped" })
      .eq("id", existing.id);
    if (error) return fail(error.message);
  } else {
    const { error } = await supabase.from("habit_logs").insert({
      habit_id: habitId,
      user_id: user.id,
      log_date: date,
      status: "skipped",
    });
    if (error) return fail(error.message);
  }

  const gamify = await captureGamify(user.id, previous, habitId);
  revalidateHabit(habitId);
  return { ok: true, data: { status: "skipped" }, gamify };
}

export async function saveDayNote(
  habitId: string,
  date: ISODate,
  note: string,
): Promise<ActionResult<{ note: string | null }>> {
  const user = await requireUser();
  const loaded = await loadHabit(habitId, user.id);
  if ("ok" in loaded) return loaded;

  const blocked = assertLoggableDay(loaded.habit, date);
  if (blocked) return fail(blocked);

  const trimmed = note.trim();
  if (trimmed.length > DAY_NOTE_MAX_LENGTH) {
    return fail(`Keep notes under ${DAY_NOTE_MAX_LENGTH} characters.`);
  }

  const existing = await getLog(habitId, date);
  const previous = await fetchProfile(user.id);
  const supabase = await createClient();
  const value = trimmed.length === 0 ? null : trimmed;

  if (existing) {
    const { error } = await supabase
      .from("habit_logs")
      .update({ note: value })
      .eq("id", existing.id);
    if (error) return fail(error.message);
    const gamify = await captureGamify(user.id, previous, habitId);
    revalidateHabit(habitId);
    return { ok: true, data: { note: value }, gamify };
  }

  if (!value) {
    const gamify = await captureGamify(user.id, previous, habitId);
    return { ok: true, data: { note: null }, gamify };
  }

  const { error } = await supabase.from("habit_logs").insert({
    habit_id: habitId,
    user_id: user.id,
    log_date: date,
    status: "done",
    note: value,
  });
  if (error) return fail(error.message);

  const streak = await currentStreak(habitId);
  await awardDayXp(user.id, habitId, date, streak);
  const gamify = await captureGamify(user.id, previous, habitId);
  revalidateHabit(habitId);
  return { ok: true, data: { note: value }, gamify };
}

export async function spendFreeze(
  habitId: string,
  date: ISODate,
): Promise<ActionResult<SpendFreezeResult>> {
  const user = await requireUser();
  const loaded = await loadHabit(habitId, user.id);
  if ("ok" in loaded) return loaded;

  const blocked = assertLoggableDay(loaded.habit, date);
  if (blocked) return fail(blocked);

  if (!isWithinRetroWindow(date, FREEZE_RETRO_WINDOW_DAYS)) {
    return fail(`Freezes can only be used on today or the last ${FREEZE_RETRO_WINDOW_DAYS} days.`);
  }

  const existing = await getLog(habitId, date);
  if (existing) return fail("That day is already logged.");

  const previous = await fetchProfile(user.id);
  if (!previous || previous.freeze_tokens < 1) {
    return fail("You don't have a freeze token to spend.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("spend_freeze", {
    p_habit_id: habitId,
    p_log_date: date,
  });

  if (error) return fail(messageFromUnknown(error, "Could not spend a freeze."));

  const result = data as SpendFreezeResult;
  const gamify = await captureGamify(user.id, previous, habitId);
  revalidateHabit(habitId);
  return { ok: true, data: result, gamify };
}

export async function setHabitStatus(
  habitId: string,
  status: HabitStatus,
): Promise<ActionResult<{ status: HabitStatus }>> {
  const user = await requireUser();
  const loaded = await loadHabit(habitId, user.id);
  if ("ok" in loaded) return loaded;

  const previous = await fetchProfile(user.id);
  const supabase = await createClient();
  const patch: Partial<Habit> = { status };

  if (status === "completed") {
    patch.completed_at = new Date().toISOString();
    patch.archived_at = null;
  } else if (status === "archived") {
    patch.archived_at = new Date().toISOString();
  } else if (status === "active" || status === "paused") {
    patch.completed_at = null;
    patch.archived_at = null;
  }

  const { error } = await supabase.from("habits").update(patch).eq("id", habitId);
  if (error) return fail(error.message);

  const gamify = await captureGamify(user.id, previous, habitId);
  revalidateHabit(habitId);
  return { ok: true, data: { status }, gamify };
}

export async function archiveHabit(habitId: string): Promise<ActionResult<{ status: HabitStatus }>> {
  return setHabitStatus(habitId, "archived");
}

export async function pauseHabit(habitId: string): Promise<ActionResult<{ status: HabitStatus }>> {
  return setHabitStatus(habitId, "paused");
}

export async function completeHabit(
  habitId: string,
): Promise<ActionResult<{ status: HabitStatus }>> {
  return setHabitStatus(habitId, "completed");
}

export async function restoreHabit(habitId: string): Promise<ActionResult<{ status: HabitStatus }>> {
  return setHabitStatus(habitId, "active");
}

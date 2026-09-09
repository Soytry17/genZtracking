import { cache } from "react";

import { addDays, startOfAppDayIso, todayISO } from "@/lib/habits/dates";
import { createClient } from "@/lib/supabase/server";
import { sortOpenTasks } from "@/lib/tasks/order";
import type { DailyTask, ISODate } from "@/types/database";

export const TASK_BOARD_COLUMNS =
  "id, user_id, title, description, priority, importance, completed_at, created_at, updated_at" as const;

/** Open tasks roll over: any row with completed_at null, regardless of created day. */
export const getOpenTasks = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("daily_tasks")
    .select(TASK_BOARD_COLUMNS)
    .eq("user_id", userId)
    .is("completed_at", null)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return sortOpenTasks((data ?? []) as DailyTask[]);
});

/** Tasks whose completed_at falls on today's Phnom Penh calendar date. */
export const getDoneTodayTasks = cache(
  async (userId: string, today: ISODate = todayISO()) => {
    const supabase = await createClient();
    const start = startOfAppDayIso(today);
    const end = startOfAppDayIso(addDays(today, 1));

    const { data, error } = await supabase
      .from("daily_tasks")
      .select(TASK_BOARD_COLUMNS)
      .eq("user_id", userId)
      .gte("completed_at", start)
      .lt("completed_at", end)
      .order("completed_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as DailyTask[];
  },
);


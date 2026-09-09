import { cache } from "react";

import {
  getTodayHabits,
  type TodayHabit,
} from "@/lib/habits/queries";
import { todayISO } from "@/lib/habits/dates";
import { getDoneTodayTasks, getOpenTasks } from "@/lib/tasks/queries";
import type { DailyTask, ISODate } from "@/types/database";

export type TodayPageData = {
  items: TodayHabit[];
  activeCount: number;
  openTasks: DailyTask[];
  doneToday: DailyTask[];
};

/**
 * Single Today payload: habits+logs, open tasks, and done-today tasks fire
 * together. Auth/profile stay in the layout's `requireSession` (React cache).
 */
export const getTodayPageData = cache(
  async (
    userId: string,
    today: ISODate = todayISO(),
  ): Promise<TodayPageData> => {
    const [habitBoard, openTasks, doneToday] = await Promise.all([
      getTodayHabits(userId, today),
      getOpenTasks(userId),
      getDoneTodayTasks(userId, today),
    ]);

    return {
      items: habitBoard.items,
      activeCount: habitBoard.activeCount,
      openTasks,
      doneToday,
    };
  },
);

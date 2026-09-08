import type { DailyTask } from "@/types/database";

/** Important first, then created order. Used by the board and by open-task queries. */
export function sortOpenTasks(tasks: DailyTask[]): DailyTask[] {
  return [...tasks].sort((a, b) => {
    if (a.importance !== b.importance) {
      return a.importance === "important" ? -1 : 1;
    }
    return a.created_at.localeCompare(b.created_at);
  });
}

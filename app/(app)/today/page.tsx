import type { Metadata } from "next";

import { TodayWorkspace } from "@/components/today/TodayWorkspace";
import { firstNameFor, requireSession } from "@/lib/auth";
import { todayISO } from "@/lib/habits/dates";
import { getTodayPageData } from "@/lib/today/queries";

export const metadata: Metadata = { title: "Today" };

export default async function TodayPage() {
  const { user, profile } = await requireSession();
  const today = todayISO();
  const { items, activeCount, openTasks, doneToday } = await getTodayPageData(
    user.id,
    today,
  );
  const streak = items.reduce(
    (max, item) => Math.max(max, item.habit.current_streak),
    0,
  );

  return (
    <TodayWorkspace
      name={firstNameFor(user, profile)}
      today={today}
      items={items}
      activeCount={activeCount}
      openTasks={openTasks}
      doneToday={doneToday}
      streak={streak}
    />
  );
}

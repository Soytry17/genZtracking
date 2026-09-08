import type { Metadata } from "next";

import { EmptyState } from "@/components/habit/EmptyState";
import { TodayList } from "@/components/habit/TodayList";
import { TaskBoard } from "@/components/task/TaskBoard";
import { requireSession } from "@/lib/auth";
import { ROUTES } from "@/lib/habits/constants";
import { formatISODate, todayISO } from "@/lib/habits/dates";
import { getActiveHabits, getTodayHabits } from "@/lib/habits/queries";
import { getDoneTodayTasks, getOpenTasks } from "@/lib/tasks/queries";

export const metadata: Metadata = { title: "Today" };

export default async function TodayPage() {
  const { user, profile } = await requireSession();
  const today = todayISO();
  const [items, active, openTasks, doneToday] = await Promise.all([
    getTodayHabits(user.id, today),
    getActiveHabits(user.id),
    getOpenTasks(user.id),
    getDoneTodayTasks(user.id, today),
  ]);
  const remaining = items.filter((item) => item.log?.status !== "done").length;

  return (
    <div className="mx-auto w-full space-y-8">
      <header className="space-y-1">
        <p className="text-sm text-ink-muted">
          {formatISODate(today, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
        <h1 className="text-2xl font-semibold">Today</h1>
      </header>

      <TaskBoard openTasks={openTasks} doneToday={doneToday} />

      <section className="mx-auto w-full max-w-xl space-y-4">
        <header className="space-y-1">
          <h2 className="text-sm font-medium text-ink-muted">Check-in</h2>
          {items.length > 0 ? (
            <p className="text-sm text-ink-muted">
              {remaining === 0 ? "All done." : `${remaining} left.`}
            </p>
          ) : null}
        </header>

        {items.length === 0 ? (
          <EmptyState
            title={
              active.length === 0
                ? "Add a habit to check in here."
                : "Nothing due today."
            }
            action={{ href: ROUTES.newHabit, label: "New habit" }}
          />
        ) : (
          <TodayList
            items={items}
            freezeTokens={profile?.freeze_tokens ?? 0}
          />
        )}
      </section>
    </div>
  );
}

import type { Metadata } from "next";

import { EmptyState } from "@/components/habit/EmptyState";
import { HabitCard } from "@/components/habit/HabitCard";
import { HabitCardGrid } from "@/components/habit/HabitCardGrid";
import { LiveFreezeTokens } from "@/components/gamify/FreezeTokens";
import { requireUser } from "@/lib/auth";
import { HABIT_STATUS_LABELS, ROUTES } from "@/lib/habits/constants";
import { buildHabitDays } from "@/lib/habits/dates";
import { getArchivedHabits, getLogsForUser } from "@/lib/habits/queries";
import type { HabitStatus } from "@/types/database";

export const metadata: Metadata = { title: "Archive" };

const GROUPS: HabitStatus[] = ["paused", "completed", "archived"];

export default async function ArchivePage() {
  const user = await requireUser();
  const [habits, logs] = await Promise.all([
    getArchivedHabits(user.id),
    getLogsForUser(user.id),
  ]);
  const logsByHabit = new Map<string, typeof logs>();
  for (const log of logs) {
    const list = logsByHabit.get(log.habit_id) ?? [];
    list.push(log);
    logsByHabit.set(log.habit_id, list);
  }

  return (
    <div className="w-full space-y-8">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Archive</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Paused, completed, and archived habits. Restore any of them from the
            panel.
          </p>
        </div>
        <LiveFreezeTokens className="mt-1 shrink-0 md:hidden" />
      </header>

      {habits.length === 0 ? (
        <EmptyState
          title="Nothing parked here"
          body="Pause, complete, or archive a habit from its panel and it will land on this page."
          action={{ href: ROUTES.habits, label: "Back to habits" }}
        />
      ) : (
        GROUPS.map((status) => {
          const group = habits.filter((habit) => habit.status === status);
          if (group.length === 0) return null;
          return (
            <section key={status} className="space-y-3">
              <h2 className="text-sm font-medium text-ink-muted">
                {HABIT_STATUS_LABELS[status]}
              </h2>
              <HabitCardGrid>
                {group.map((habit) => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    days={buildHabitDays(habit, logsByHabit.get(habit.id) ?? [])}
                  />
                ))}
              </HabitCardGrid>
            </section>
          );
        })
      )}
    </div>
  );
}

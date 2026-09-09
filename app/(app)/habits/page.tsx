import type { Metadata } from "next";

import { EmptyState, HabitCardSkeleton } from "@/components/habit/EmptyState";
import { HabitCard } from "@/components/habit/HabitCard";
import { HabitCardGrid } from "@/components/habit/HabitCardGrid";
import { LiveFreezeTokens } from "@/components/gamify/FreezeTokens";
import { RippleCta } from "@/components/ui/ripple-cta";
import { requireUser } from "@/lib/auth";
import { ROUTES } from "@/lib/habits/constants";
import { buildHabitDays } from "@/lib/habits/dates";
import { getActiveHabits, getLogsForUser } from "@/lib/habits/queries";

export const metadata: Metadata = { title: "Habits" };

export default async function HabitsPage() {
  const user = await requireUser();
  const [habits, logs] = await Promise.all([
    getActiveHabits(user.id),
    getLogsForUser(user.id),
  ]);
  const logsByHabit = new Map<string, typeof logs>();
  for (const log of logs) {
    const list = logsByHabit.get(log.habit_id) ?? [];
    list.push(log);
    logsByHabit.set(log.habit_id, list);
  }

  return (
    <div className="w-full space-y-6">
      <header className="flex min-w-0 items-center justify-between gap-3">
        <h1 className="min-w-0 text-2xl font-semibold tracking-tight md:text-3xl">
          Habits
        </h1>
        <div className="flex shrink-0 items-center gap-2">
          <LiveFreezeTokens className="md:hidden" />
          <RippleCta
            href={ROUTES.newHabit}
            size="sm"
            className="h-11 shrink-0 rounded-full px-4 md:h-10 md:px-4"
          >
            New habit
          </RippleCta>
        </div>
      </header>

      {habits.length === 0 ? (
        <EmptyState
          title="No active habits"
          body="Start from a template or write your own. You'll get a panel with a box for every day of the commitment."
          action={{ href: ROUTES.newHabit, label: "Create a habit" }}
        />
      ) : (
        <HabitCardGrid>
          {habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              days={buildHabitDays(habit, logsByHabit.get(habit.id) ?? [])}
            />
          ))}
        </HabitCardGrid>
      )}
    </div>
  );
}

export function HabitsFallback() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <HabitCardSkeleton />
      <HabitCardSkeleton />
    </div>
  );
}

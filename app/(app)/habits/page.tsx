import type { Metadata } from "next";

import { EmptyState, HabitCardSkeleton } from "@/components/habit/EmptyState";
import { HabitCard } from "@/components/habit/HabitCard";
import { HabitCardGrid } from "@/components/habit/HabitCardGrid";
import { RippleCta } from "@/components/ui/ripple-cta";
import { requireSession } from "@/lib/auth";
import { ROUTES } from "@/lib/habits/constants";
import { buildHabitDays } from "@/lib/habits/dates";
import { getActiveHabits, getLogsForHabits } from "@/lib/habits/queries";

export const metadata: Metadata = { title: "Habits" };

export default async function HabitsPage() {
  const { user } = await requireSession();
  const habits = await getActiveHabits(user.id);
  const logs = await getLogsForHabits(habits.map((habit) => habit.id));
  const logsByHabit = new Map<string, typeof logs>();
  for (const log of logs) {
    const list = logsByHabit.get(log.habit_id) ?? [];
    list.push(log);
    logsByHabit.set(log.habit_id, list);
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Habits</h1>
        <RippleCta href={ROUTES.newHabit} size="sm">
          New habit
        </RippleCta>
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
    <div className="grid gap-4 sm:grid-cols-2">
      <HabitCardSkeleton />
      <HabitCardSkeleton />
    </div>
  );
}

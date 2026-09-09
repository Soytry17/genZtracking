import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HabitPanel } from "@/components/habit/HabitPanel";
import { requireSession } from "@/lib/auth";
import { buildHabitDays } from "@/lib/habits/dates";
import { getHabit, getHabitLogs, getGoalBadgeForHabit } from "@/lib/habits/queries";

export const metadata: Metadata = { title: "Habit" };

export default async function HabitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, profile } = await requireSession();
  const [habit, logs, goalBadge] = await Promise.all([
    getHabit(user.id, id),
    getHabitLogs(id),
    getGoalBadgeForHabit(user.id, id),
  ]);
  if (!habit) notFound();
  const days = buildHabitDays(habit, logs);

  return (
    <HabitPanel
      habit={habit}
      days={days}
      freezeTokens={profile?.freeze_tokens ?? 0}
      goalBadge={goalBadge}
    />
  );
}

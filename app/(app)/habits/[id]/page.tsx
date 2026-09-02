import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HabitPanel } from "@/components/habit/HabitPanel";
import { requireSession } from "@/lib/auth";
import { buildHabitDays } from "@/lib/habits/dates";
import { getHabit, getHabitLogs } from "@/lib/habits/queries";

export const metadata: Metadata = { title: "Habit" };

export default async function HabitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, profile } = await requireSession();
  const habit = await getHabit(user.id, id);
  if (!habit) notFound();

  const logs = await getHabitLogs(habit.id);
  const days = buildHabitDays(habit, logs);

  return (
    <HabitPanel
      habit={habit}
      days={days}
      freezeTokens={profile?.freeze_tokens ?? 0}
    />
  );
}

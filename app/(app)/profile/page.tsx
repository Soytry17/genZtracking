import type { Metadata } from "next";

import { BadgeGrid } from "@/components/gamify/BadgeGrid";
import { GoalBadgeGrid } from "@/components/gamify/GoalBadgeGrid";
import { LiveFreezeTokens } from "@/components/gamify/FreezeTokens";
import { Card, CardBody } from "@/components/ui";
import { displayNameFor, firstNameFor, requireSession } from "@/lib/auth";
import { getActiveHabits, getBadges, getGoalBadges, getUserBadges } from "@/lib/habits/queries";
import { getTodayPageData } from "@/lib/today/queries";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const { user, profile } = await requireSession();
  const name = displayNameFor(user, profile);
  const first = firstNameFor(user, profile);
  const initial = (first[0] ?? "Y").toUpperCase();
  const [badges, earned, goalBadges, habits, today] = await Promise.all([
    getBadges(),
    getUserBadges(user.id),
    getGoalBadges(user.id),
    getActiveHabits(user.id),
    getTodayPageData(user.id),
  ]);
  const streak = Math.max(0, ...habits.map((habit) => habit.current_streak));
  const taskTotal = today.openTasks.length + today.doneToday.length;
  const taskDone = today.doneToday.length;
  const completion = taskTotal === 0 ? 0 : Math.round((taskDone / taskTotal) * 100);

  return (
    <div className="w-full space-y-6">
      <header className="flex items-center gap-4">
        <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-brand text-xl font-semibold text-brand-ink">
          {initial}
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight">{name}</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Keep going, you&apos;re doing great! 🔥
          </p>
          <div className="mt-2">
            <LiveFreezeTokens />
          </div>
          {user.email ? (
            <p className="mt-0.5 truncate text-xs text-ink-subtle">{user.email}</p>
          ) : null}
        </div>
      </header>

      <div className="grid w-full grid-cols-3 gap-2 sm:gap-3">
        <StatCard
          label="Day Streak"
          value={`${streak}`}
          hint={streak === 1 ? "day" : "days"}
        />
        <StatCard
          label="Today's Tasks"
          value={`${taskTotal}`}
          hint="open + done"
        />
        <StatCard
          label="Completion"
          value={`${completion}%`}
          hint="today"
        />
      </div>

      <div data-slot="goal-badge-grid">
        <GoalBadgeGrid badges={goalBadges} />
      </div>

      <div data-slot="badge-grid">
        <BadgeGrid badges={badges} earned={earned} />
      </div>

      <Card>
        <CardBody className="p-2 sm:p-3">
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="flex min-h-12 w-full items-center justify-between rounded-2xl px-3 text-sm text-ink-muted hover:bg-glass hover:text-ink"
            >
              Sign out
              <span aria-hidden>→</span>
            </button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-[1.35rem] glass px-3 py-4 text-center sm:px-4">
      <p className="text-lg font-semibold tabular-nums tracking-tight sm:text-xl">
        {value}
      </p>
      <p className="mt-1 text-[11px] font-medium text-ink-muted">{label}</p>
      <p className="text-[10px] text-ink-subtle">{hint}</p>
    </div>
  );
}

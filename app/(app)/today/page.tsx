import type { Metadata } from "next";

import { EmptyState } from "@/components/habit/EmptyState";
import { TodayRow } from "@/components/habit/TodayRow";
import { requireSession } from "@/lib/auth";
import { ROUTES } from "@/lib/habits/constants";
import { formatISODate, todayISO } from "@/lib/habits/dates";
import { getTodayHabits } from "@/lib/habits/queries";

export const metadata: Metadata = { title: "Today" };

export default async function TodayPage() {
  const { user } = await requireSession();
  const today = todayISO();
  const items = await getTodayHabits(user.id, today);
  const remaining = items.filter((item) => item.log?.status !== "done").length;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-sm text-ink-muted">
          {formatISODate(today, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
        <h1 className="text-2xl font-semibold">Today</h1>
        {items.length > 0 ? (
          <p className="text-sm text-ink-muted">
            {remaining === 0
              ? "Everything due today is done."
              : `${remaining} habit${remaining === 1 ? "" : "s"} still open.`}
          </p>
        ) : null}
      </header>

      {items.length === 0 ? (
        <EmptyState
          title="Nothing due today"
          body="Create a habit whose range includes today, or check the Habits tab for ones that haven't started yet."
          action={{ href: ROUTES.newHabit, label: "New habit" }}
        />
      ) : (
        <ul className="space-y-3">
          {items.map(({ habit, log }) => (
            <li key={habit.id}>
              <TodayRow habit={habit} log={log} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

"use client";

import { DailyProgress } from "@/components/today/DailyProgress";
import { TodayOverview } from "@/components/today/TodayOverview";
import { BrandMark } from "@/components/nav/BrandMark";
import { EmptyState } from "@/components/habit/EmptyState";
import { TodayList } from "@/components/habit/TodayList";
import { FreezeTokens } from "@/components/gamify/FreezeTokens";
import { useGamify } from "@/components/gamify/GamifyProvider";
import { TaskBoard } from "@/components/task/TaskBoard";
import { useTodayTasks } from "@/components/task/useTodayTasks";
import { ROUTES } from "@/lib/habits/constants";
import { formatISODate, greetingForNow } from "@/lib/habits/dates";
import type { TodayHabit } from "@/lib/habits/queries";
import type { DailyTask, ISODate } from "@/types/database";

export function TodayWorkspace({
  name,
  today,
  items,
  activeCount,
  openTasks,
  doneToday,
  streak,
}: {
  name: string;
  today: ISODate;
  items: TodayHabit[];
  activeCount: number;
  openTasks: DailyTask[];
  doneToday: DailyTask[];
  streak: number;
}) {
  const tasks = useTodayTasks(openTasks, doneToday);
  const { freezeTokens } = useGamify();
  const dateLabel = formatISODate(today, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const greeting = greetingForNow();

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_var(--app-overview)] lg:items-start lg:gap-4">
      <div className="space-y-6">
        <header className="space-y-3 md:hidden">
          <div className="flex items-center justify-between gap-3">
            <BrandMark compact />
            <FreezeTokens count={freezeTokens} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {greeting}, {name}!
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              Small steps make big changes.
            </p>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-subtle">
              <CalendarIcon />
              {dateLabel}
            </p>
          </div>
        </header>

        <header className="hidden items-end justify-between gap-4 md:flex">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Today</h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-muted">
              <CalendarIcon />
              {dateLabel}
            </p>
          </div>
          <p className="text-xs font-medium tracking-wide text-ink-subtle">
            Focus • Build • Grow
          </p>
        </header>

        <DailyProgress done={tasks.doneCount} total={tasks.totalCount} />

        <TaskBoard tasks={tasks} />

        <section className="space-y-4">
          {items.length === 0 ? (
            <>
              <header className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold tracking-tight">Habits</h2>
              </header>
              <EmptyState
                title={
                  activeCount === 0
                    ? "Add a habit to check in here."
                    : "Nothing due today."
                }
                action={{ href: ROUTES.newHabit, label: "New habit" }}
              />
            </>
          ) : (
            <TodayList items={items} />
          )}
        </section>
      </div>

      <div className="sticky top-6 hidden lg:block">
        <TodayOverview
          done={tasks.doneCount}
          total={tasks.totalCount}
          streak={streak}
          habits={items}
        />
      </div>
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-3.5" fill="none" aria-hidden>
      <rect
        x="4"
        y="5"
        width="16"
        height="15"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M8 3.5V7M16 3.5V7M4 10h16"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

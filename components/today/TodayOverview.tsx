"use client";

import Link from "next/link";

import { CheckIcon } from "@/components/habit/CheckIcon";
import { HabitIcon } from "@/components/habit/HabitIcon";
import { useGamify } from "@/components/gamify/GamifyProvider";
import { progressToNextLevel } from "@/lib/gamify/rules";
import {
  HABIT_COLOR_HEX,
  isHabitColor,
  ROUTES,
} from "@/lib/habits/constants";
import type { TodayHabit } from "@/lib/habits/queries";
import { cn } from "@/lib/utils";

export function TodayOverview({
  done,
  total,
  streak,
  habits,
}: {
  done: number;
  total: number;
  streak: number;
  habits: TodayHabit[];
}) {
  const { xp, level } = useGamify();
  const progress = progressToNextLevel(xp);
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  const onTrack = total === 0 ? streak > 0 : done >= Math.ceil(total / 2);

  return (
    <aside className="flex min-w-0 flex-col gap-4">
      <section className="rounded-[1.75rem] glass p-4 sm:p-5">
        <header className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold tracking-tight">Today Overview</h2>
          <SunIcon />
        </header>

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span>Task Completion</span>
            <span className="tabular-nums text-ink">
              {done}/{total} tasks
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full glass-inset">
            <div
              className="h-full rounded-full bg-brand"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="mt-1.5 text-right text-[11px] tabular-nums text-ink-subtle">
            {percent}%
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <div className="rounded-2xl glass-thin p-3">
            <p className="flex items-center justify-between text-[11px] text-ink-subtle">
              Current Streak
              <span aria-hidden>🔥</span>
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums">
              {streak}
              <span className="ml-1 text-xs font-medium text-ink-muted">
                {streak === 1 ? "day" : "days"}
              </span>
            </p>
          </div>
          <div className="rounded-2xl glass-thin p-3">
            <p className="flex items-center justify-between text-[11px] text-ink-subtle">
              XP & Level
              <span aria-hidden>⭐</span>
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums">
              {xp}
              <span className="ml-1 text-xs font-medium text-ink-muted">
                XP
              </span>
            </p>
            <p className="text-[11px] text-ink-subtle">Lv. {level}</p>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full glass-inset">
              <div
                className="h-full rounded-full bg-brand"
                style={{ width: `${Math.round(progress.progress * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[1.75rem] glass p-4 sm:p-5">
        <header className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Today&apos;s Habits</h2>
          <Link
            href={ROUTES.habits}
            className="text-[11px] font-medium text-brand hover:text-brand-hover"
          >
            View all
          </Link>
        </header>
        {habits.length === 0 ? (
          <p className="text-xs text-ink-muted">Nothing due today.</p>
        ) : (
          <ul className="space-y-2">
            {habits.map((item) => {
              const hex = isHabitColor(item.habit.color)
                ? HABIT_COLOR_HEX[item.habit.color]
                : HABIT_COLOR_HEX.violet;
              const doneHabit = item.log?.status === "done";
              return (
                <li key={item.habit.id}>
                  <Link
                    href={ROUTES.habit(item.habit.id)}
                    className="flex items-center gap-2.5 rounded-2xl glass-thin px-2.5 py-2 hover:bg-glass"
                  >
                    <span
                      className="flex size-8 shrink-0 items-center justify-center rounded-xl"
                      style={{ color: hex, backgroundColor: `${hex}22` }}
                    >
                      <HabitIcon name={item.habit.icon} className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {item.habit.title}
                    </span>
                    <span
                      className={cn(
                        "relative flex size-7 shrink-0 items-center justify-center rounded-full",
                        doneHabit
                          ? "bg-success-soft text-success"
                          : "border border-hairline text-ink-subtle",
                      )}
                    >
                      {doneHabit ? (
                        <CheckIcon active className="size-3.5" />
                      ) : null}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="relative overflow-hidden rounded-[1.75rem] glass p-5">
        <MountainArt />
        <p className="relative text-sm font-semibold">
          {onTrack ? "You're on track!" : "One check at a time"}
        </p>
        <p className="relative mt-1 text-xs leading-relaxed text-ink-muted">
          Consistency today builds the life you want tomorrow.
        </p>
      </section>
    </aside>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 text-warning" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 3.5v2M12 18.5v2M4.8 4.8l1.4 1.4M17.8 17.8l1.4 1.4M3.5 12h2M18.5 12h2M4.8 19.2l1.4-1.4M17.8 6.2l1.4-1.4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MountainArt() {
  return (
    <svg
      viewBox="0 0 240 120"
      className="pointer-events-none absolute inset-x-0 -top-2 h-28 w-full opacity-80"
      aria-hidden
    >
      <defs>
        <linearGradient id="mtn" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#4F46E5" stopOpacity="0.12" />
        </linearGradient>
      </defs>
      <path
        d="M0 120 70 48l28 22 42-52 100 82v20H0Z"
        fill="url(#mtn)"
      />
      <circle cx="188" cy="22" r="7" fill="#E2E8F0" opacity="0.7" />
      <path d="M138 18 148 40H128Z" fill="#A5B4FC" />
    </svg>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { TodayRow } from "@/components/habit/TodayRow";
import { useGamify } from "@/components/gamify/GamifyProvider";
import { ROUTES } from "@/lib/habits/constants";
import type { TodayHabit, TodayLogRow } from "@/lib/habits/queries";

export function TodayList({ items: initialItems }: { items: TodayHabit[] }) {
  const { freezeTokens } = useGamify();
  const [items, setItems] = useState(initialItems);
  const [tokens, setTokens] = useState(freezeTokens);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  useEffect(() => {
    setTokens(freezeTokens);
  }, [freezeTokens]);

  function patchItem(
    habitId: string,
    patch: {
      log?: TodayLogRow | null;
      yesterdayLog?: TodayLogRow | null;
      currentStreak?: number;
    },
  ) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.habit.id !== habitId) return item;
        return {
          ...item,
          log: patch.log !== undefined ? patch.log : item.log,
          yesterdayLog:
            patch.yesterdayLog !== undefined
              ? patch.yesterdayLog
              : item.yesterdayLog,
          habit:
            patch.currentStreak !== undefined
              ? { ...item.habit, current_streak: patch.currentStreak }
              : item.habit,
        };
      }),
    );
  }

  return (
    <>
      <header className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Habits</h2>
        <Link
          href={ROUTES.habits}
          className="text-sm font-medium text-brand hover:text-brand-hover"
        >
          View all →
        </Link>
      </header>

      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {items.map((item) => (
          <li key={item.habit.id} className="min-w-0">
            <TodayRow
              habit={item.habit}
              log={item.log}
              yesterdayDue={item.yesterdayDue}
              yesterdayLog={item.yesterdayLog}
              freezeTokens={tokens}
              onPatch={(patch) => patchItem(item.habit.id, patch)}
              onFreezeSpent={(spent) =>
                setTokens((count) => Math.max(0, count + (spent ? -1 : 1)))
              }
            />
          </li>
        ))}
      </ul>
    </>
  );
}

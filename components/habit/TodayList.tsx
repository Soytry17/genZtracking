"use client";

import { useEffect, useState } from "react";

import { TodayRow } from "@/components/habit/TodayRow";
import type { TodayHabit } from "@/lib/habits/queries";

export function TodayList({
  items,
  freezeTokens,
}: {
  items: TodayHabit[];
  freezeTokens: number;
}) {
  const [tokens, setTokens] = useState(freezeTokens);

  useEffect(() => {
    setTokens(freezeTokens);
  }, [freezeTokens]);

  const open = items.filter((item) => item.log?.status !== "done");
  const done = items.filter((item) => item.log?.status === "done");

  return (
    <ul className="flex flex-col gap-3">
      {open.map((item) => (
        <li key={item.habit.id} className="min-w-0">
          <Row
            item={item}
            freezeTokens={tokens}
            onFreezeSpent={(spent) =>
              setTokens((count) => Math.max(0, count + (spent ? -1 : 1)))
            }
          />
        </li>
      ))}

      {done.length > 0 ? (
        <li className="pt-2">
          <p className="text-sm text-ink-muted">Done</p>
        </li>
      ) : null}

      {done.map((item) => (
        <li key={item.habit.id} className="min-w-0">
          <Row
            item={item}
            freezeTokens={tokens}
            onFreezeSpent={(spent) =>
              setTokens((count) => Math.max(0, count + (spent ? -1 : 1)))
            }
          />
        </li>
      ))}
    </ul>
  );
}

function Row({
  item,
  freezeTokens,
  onFreezeSpent,
}: {
  item: TodayHabit;
  freezeTokens: number;
  onFreezeSpent: (spent: boolean) => void;
}) {
  return (
    <TodayRow
      habit={item.habit}
      log={item.log}
      yesterdayDue={item.yesterdayDue}
      yesterdayLog={item.yesterdayLog}
      freezeTokens={freezeTokens}
      onFreezeSpent={onFreezeSpent}
    />
  );
}

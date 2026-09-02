"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui";
import { useGamify } from "@/components/gamify/GamifyProvider";
import {
  archiveHabit,
  completeHabit,
  pauseHabit,
  restoreHabit,
} from "@/lib/habits/actions";
import type { HabitStatus } from "@/types/database";

export function HabitStatusMenu({
  habitId,
  status,
}: {
  habitId: string;
  status: HabitStatus;
}) {
  const { report } = useGamify();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function run(fn: () => ReturnType<typeof pauseHabit>) {
    start(async () => {
      const result = await fn();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      report(result.gamify);
      if (result.data.goalBadgeBlockedReason) {
        setError(result.data.goalBadgeBlockedReason);
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "active" ? (
        <>
          <Button size="sm" variant="secondary" disabled={pending} className="h-11 md:h-8" onClick={() => run(() => pauseHabit(habitId))}>
            Pause
          </Button>
          <Button size="sm" variant="secondary" disabled={pending} className="h-11 md:h-8" onClick={() => run(() => completeHabit(habitId))}>
            Complete
          </Button>
          <Button size="sm" variant="ghost" disabled={pending} className="h-11 md:h-8" onClick={() => run(() => archiveHabit(habitId))}>
            Archive
          </Button>
        </>
      ) : (
        <Button size="sm" disabled={pending} className="h-11 md:h-8" onClick={() => run(() => restoreHabit(habitId))}>
          Restore
        </Button>
      )}
      {status === "paused" ? (
        <>
          <Button size="sm" variant="secondary" disabled={pending} className="h-11 md:h-8" onClick={() => run(() => completeHabit(habitId))}>
            Complete
          </Button>
          <Button size="sm" variant="ghost" disabled={pending} className="h-11 md:h-8" onClick={() => run(() => archiveHabit(habitId))}>
            Archive
          </Button>
        </>
      ) : null}
      {error ? <p className="w-full text-sm text-danger">{error}</p> : null}
    </div>
  );
}

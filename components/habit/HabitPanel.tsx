"use client";

import { useRef, useState, useTransition } from "react";

import { DayGrid } from "@/components/habit/DayGrid";
import { DayNoteSheet } from "@/components/habit/DayNoteSheet";
import { HabitIcon } from "@/components/habit/HabitIcon";
import { HabitStatusMenu } from "@/components/habit/HabitStatusMenu";
import { ProgressBar } from "@/components/habit/ProgressBar";
import { StreakBadge } from "@/components/habit/StreakBadge";
import { FreezeTokens } from "@/components/gamify/FreezeTokens";
import { useGamify } from "@/components/gamify/GamifyProvider";
import { enterFromNear, staggerInChunks, useGsap } from "@/lib/anim";
import { spendFreeze, toggleDay } from "@/lib/habits/actions";
import { FREEZE_RETRO_WINDOW_DAYS, HABIT_STATUS_LABELS } from "@/lib/habits/constants";
import { formatISODate, isWithinRetroWindow } from "@/lib/habits/dates";
import { progressFromDays } from "@/lib/habits/progress";
import { Pill } from "@/components/ui";
import type { Habit, HabitDay } from "@/types/database";

export function HabitPanel({
  habit,
  days,
  freezeTokens,
}: {
  habit: Habit;
  days: HabitDay[];
  freezeTokens: number;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const { report } = useGamify();
  const [sheetDay, setSheetDay] = useState<HabitDay | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const progress = progressFromDays(days, habit);
  const readOnly = habit.status === "archived" || habit.status === "completed";

  useGsap(
    rootRef,
    (gsap) => {
      enterFromNear("[data-panel-head]", {
        y: 12,
        opacityFrom: 0.8,
        duration: 0.42,
      });
      const cells = gsap.utils.toArray<HTMLElement>("[data-day-cell]");
      staggerInChunks(cells, {
        chunkSize: 7,
        chunkDelay: 0.05,
        delay: 0.14,
        y: 8,
        opacityFrom: 0.78,
        duration: 0.3,
        maxItems: 42,
      });
    },
    [habit.id],
  );

  function onSelect(day: HabitDay) {
    if (readOnly || pending) return;
    start(async () => {
      const result = await toggleDay(habit.id, day.date);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      report(result.gamify);
    });
  }

  const freezeHint = days.some(
    (day) =>
      !day.status &&
      !day.isFuture &&
      isWithinRetroWindow(day.date, FREEZE_RETRO_WINDOW_DAYS),
  );

  return (
    <div ref={rootRef} className="space-y-8">
      <header data-panel-head className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="mt-1 flex size-11 items-center justify-center rounded-2xl glass-thin text-brand">
              <HabitIcon name={habit.icon} className="size-6" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">{habit.title}</h1>
                {habit.status !== "active" ? (
                  <Pill>{HABIT_STATUS_LABELS[habit.status]}</Pill>
                ) : null}
              </div>
              {habit.description ? (
                <p className="mt-1 max-w-xl text-sm text-ink-muted">
                  {habit.description}
                </p>
              ) : null}
              <p className="mt-2 text-xs text-ink-subtle">
                {formatISODate(habit.start_date)} – {formatISODate(habit.end_date)}
                {habit.duration_days ? ` · ${habit.duration_days} days` : ""}
              </p>
            </div>
          </div>
          <HabitStatusMenu habitId={habit.id} status={habit.status} />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <StreakBadge current={habit.current_streak} longest={habit.longest_streak} />
          <div className="flex items-center gap-2 text-sm text-ink-muted">
            <FreezeTokens count={freezeTokens} />
            <span>
              {freezeTokens} freeze{freezeTokens === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        <ProgressBar
          percent={progress.percent}
          label={`${progress.doneDays} done · ${progress.frozenDays} frozen · ${progress.skippedDays} skipped`}
        />

        {freezeHint && freezeTokens > 0 && !readOnly ? (
          <p className="text-xs text-freeze">
            Open a recent empty day to spend a freeze (today or the last{" "}
            {FREEZE_RETRO_WINDOW_DAYS} days). Right-click a cell, or long-press on
            mobile.
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}
      </header>

      <DayGrid
        days={days}
        color={habit.color}
        disabled={readOnly}
        onSelect={onSelect}
        onOpenNote={setSheetDay}
      />

      {sheetDay ? (
        <DayNoteSheet
          day={sheetDay}
          habitId={habit.id}
          freezeTokens={freezeTokens}
          readOnly={readOnly}
          onClose={() => setSheetDay(null)}
        />
      ) : null}

      {freezeTokens > 0 && !readOnly ? (
        <FreezeQuickActions
          habitId={habit.id}
          days={days}
          pending={pending}
          onSpend={(date) => {
            start(async () => {
              const result = await spendFreeze(habit.id, date);
              if (!result.ok) {
                setError(result.error);
                return;
              }
              report(result.gamify);
            });
          }}
        />
      ) : null}
    </div>
  );
}

function FreezeQuickActions({
  habitId,
  days,
  pending,
  onSpend,
}: {
  habitId: string;
  days: HabitDay[];
  pending: boolean;
  onSpend: (date: string) => void;
}) {
  const eligible = days.filter(
    (day) =>
      !day.status &&
      !day.isFuture &&
      isWithinRetroWindow(day.date, FREEZE_RETRO_WINDOW_DAYS),
  );
  if (eligible.length === 0) return null;
  void habitId;

  return (
    <div className="rounded-card glass-thin p-4">
      <p className="text-sm font-medium text-freeze">Spend a freeze</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {eligible.map((day) => (
          <button
            key={day.date}
            type="button"
            data-freeze-spend
            disabled={pending}
            onClick={() => onSpend(day.date)}
            className="rounded-full glass px-3 py-1.5 text-xs text-ink hover:bg-glass-strong"
          >
            ❄ {formatISODate(day.date, { month: "short", day: "numeric" })}
          </button>
        ))}
      </div>
    </div>
  );
}

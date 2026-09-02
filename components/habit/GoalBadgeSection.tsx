"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { GoalBadgeFields } from "@/components/habit/GoalBadgeFields";
import { GoalBadgeIcon } from "@/components/habit/GoalBadgeIcon";
import { useGamify } from "@/components/gamify/GamifyProvider";
import { Pill } from "@/components/ui";
import { RippleCta } from "@/components/ui/ripple-cta";
import { evaluateGoalBadgeRule } from "@/lib/gamify/rules";
import {
  archiveHabit,
  completeHabit,
  deleteGoalBadge,
  saveGoalBadge,
} from "@/lib/habits/actions";
import { DEFAULT_GOAL_BADGE_ICON } from "@/lib/habits/constants";
import { cn } from "@/lib/utils";
import type { GoalBadge, Habit, HabitDay } from "@/types/database";

export function GoalBadgeSection({
  habit,
  days,
  badge,
}: {
  habit: Habit;
  days: HabitDay[];
  badge: GoalBadge | null;
}) {
  const { report } = useGamify();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(badge?.title ?? "");
  const [description, setDescription] = useState(badge?.description ?? "");
  const [icon, setIcon] = useState(badge?.icon ?? DEFAULT_GOAL_BADGE_ICON);

  const rule = evaluateGoalBadgeRule({
    start_date: habit.start_date,
    end_date: habit.end_date,
    logs: days
      .filter((day) => day.status)
      .map((day) => ({ log_date: day.date, status: day.status! })),
    currentStreak: habit.current_streak,
  });

  const unlocked = Boolean(badge?.awarded_at);
  const canAct = habit.status === "active" || habit.status === "paused";

  function refreshAfter(
    result: Awaited<ReturnType<typeof completeHabit>>,
  ) {
    if (!result.ok) {
      setError(result.error);
      return;
    }
    report(result.gamify);
    if (result.data.goalBadgeBlockedReason) {
      setHint(result.data.goalBadgeBlockedReason);
    } else {
      setHint(null);
    }
    router.refresh();
  }

  function onComplete() {
    if (!badge || unlocked || pending) return;
    setError(null);
    setHint(null);
    start(async () => {
      const result = await completeHabit(habit.id, { requireGoal: true });
      if (!result.ok) {
        setHint(result.error);
        return;
      }
      refreshAfter(result);
    });
  }

  function onArchiveAsCompleted() {
    if (!badge || unlocked || pending || !rule.met) return;
    setError(null);
    start(async () => {
      refreshAfter(await archiveHabit(habit.id));
    });
  }

  function onSave(formData: FormData) {
    if (pending) return;
    setError(null);
    start(async () => {
      const result = await saveGoalBadge(habit.id, formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  function onRemove() {
    if (!badge || unlocked || pending) return;
    setError(null);
    start(async () => {
      const result = await deleteGoalBadge(habit.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setTitle("");
      setDescription("");
      setIcon(DEFAULT_GOAL_BADGE_ICON);
      setEditing(true);
      router.refresh();
    });
  }

  return (
    <section className="rounded-card glass p-5 shadow-glass">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">Goal badge</p>
          <p className="mt-1 text-xs text-ink-muted">
            Unlocks when every day in the range is done or frozen.
          </p>
        </div>
        {badge ? (
          <Pill tone={unlocked ? "success" : "neutral"}>
            {unlocked ? "Unlocked" : "Locked"}
          </Pill>
        ) : null}
      </div>

      {badge ? (
        <div
          className={cn(
            "mt-4 flex items-start gap-3 rounded-2xl glass-thin p-3",
            !unlocked && "opacity-80",
          )}
        >
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-soft">
            <GoalBadgeIcon icon={badge.icon} className="size-7" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink">{badge.title}</p>
            {badge.description ? (
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                {badge.description}
              </p>
            ) : null}
            <p className="mt-2 text-xs text-ink-subtle">
              {unlocked
                ? "Earned — it lives on your profile."
                : `${rule.filledDays} of ${rule.totalDays} days counted`}
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-ink-muted">
          Attach a personal badge to this habit. Finish the range, then complete
          it to unlock.
        </p>
      )}

      {badge && !unlocked ? (
        <p className="mt-3 text-xs leading-relaxed text-ink-muted">{rule.reason}</p>
      ) : null}

      {badge && !unlocked && canAct ? (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <RippleCta
            type="button"
            size="md"
            className="w-full sm:flex-1"
            disabled={pending}
            onClick={onComplete}
          >
            Complete habit
          </RippleCta>
          {rule.met ? (
            <RippleCta
              type="button"
              tone="secondary"
              size="md"
              className="w-full sm:flex-1"
              disabled={pending}
              onClick={onArchiveAsCompleted}
            >
              Archive as completed
            </RippleCta>
          ) : null}
        </div>
      ) : null}

      {hint ? (
        <p role="status" className="mt-3 text-sm text-warning">
          {hint}
        </p>
      ) : null}

      {editing ? (
        <form action={onSave} className="mt-5 space-y-4">
          <GoalBadgeFields
            title={title}
            description={description}
            icon={icon}
            onTitle={setTitle}
            onDescription={setDescription}
            onIcon={setIcon}
            disabled={pending}
          />
          <div className="flex flex-wrap gap-2">
            <RippleCta type="submit" size="sm" disabled={pending || !title.trim()}>
              {pending ? "Saving…" : badge ? "Save badge" : "Attach badge"}
            </RippleCta>
            {badge ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setTitle(badge.title);
                  setDescription(badge.description ?? "");
                  setIcon(badge.icon);
                  setEditing(false);
                }}
                className="rounded-full px-3.5 py-1.5 text-xs text-ink-muted hover:bg-glass hover:text-ink"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setTitle(badge?.title ?? "");
              setDescription(badge?.description ?? "");
              setIcon(badge?.icon ?? DEFAULT_GOAL_BADGE_ICON);
              setEditing(true);
            }}
            className="rounded-full glass px-3.5 py-1.5 text-xs text-ink hover:bg-glass-strong"
          >
            {badge ? "Edit badge" : "Add a goal badge"}
          </button>
          {badge && !unlocked ? (
            <button
              type="button"
              disabled={pending}
              onClick={onRemove}
              className="rounded-full px-3.5 py-1.5 text-xs text-ink-muted hover:bg-glass hover:text-danger"
            >
              Remove
            </button>
          ) : null}
        </div>
      )}

      {error ? (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </section>
  );
}

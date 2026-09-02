"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { animatePress, enterFromNear, useGsap } from "@/lib/anim";

import { GoalBadgeFields } from "@/components/habit/GoalBadgeFields";
import { HabitIcon } from "@/components/habit/HabitIcon";
import { TemplateAssistiveTouch } from "@/components/habit/TemplateAssistiveTouch";
import {
  Card,
  CardBody,
  Field,
  Pill,
  inputClassName,
} from "@/components/ui";
import { RippleCta } from "@/components/ui/ripple-cta";
import {
  DEFAULT_GOAL_BADGE_ICON,
  DEFAULT_HABIT_COLOR,
  DEFAULT_HABIT_ICON,
  HABIT_COLORS,
  HABIT_COLOR_HEX,
  HABIT_DESCRIPTION_MAX_LENGTH,
  HABIT_DURATION_PRESETS,
  HABIT_ICONS,
  HABIT_TITLE_MAX_LENGTH,
  habitColorHex,
} from "@/lib/habits/constants";
import {
  durationFromEndDate,
  endDateFromDuration,
  todayISO,
} from "@/lib/habits/dates";
import { createHabit, type ActionErr } from "@/lib/habits/actions";
import { cn } from "@/lib/utils";
import type { HabitPreset } from "@/types/database";

async function createHabitAction(
  _prev: ActionErr | null,
  formData: FormData,
): Promise<ActionErr | null> {
  const result = await createHabit(formData);
  if (!result.ok) return result;
  return null;
}

function isPresetSelected(
  preset: HabitPreset,
  values: {
    title: string;
    color: string;
    icon: string;
    duration: number | "";
  },
) {
  if (preset.title !== values.title) return false;
  if (preset.color !== values.color) return false;
  if (preset.icon !== values.icon) return false;
  if (
    preset.suggested_duration_days != null &&
    preset.suggested_duration_days !== values.duration
  ) {
    return false;
  }
  return true;
}

function chipClassName(selected: boolean) {
  return cn(
    "inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border px-3 py-2 text-xs",
    selected
      ? "border-brand bg-brand-soft text-brand"
      : "glass text-ink-muted hover:bg-glass-strong",
  );
}

export function CreateHabitForm({ presets }: { presets: HabitPreset[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [state, action, pending] = useActionState(createHabitAction, null);
  const today = todayISO();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [duration, setDuration] = useState<number | "">(30);
  const [endDate, setEndDate] = useState(endDateFromDuration(today, 30));
  const [color, setColor] = useState<string>(DEFAULT_HABIT_COLOR);
  const [icon, setIcon] = useState<string>(DEFAULT_HABIT_ICON);
  const [styleOpen, setStyleOpen] = useState(false);
  const [goalBadgeOn, setGoalBadgeOn] = useState(false);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDescription, setGoalDescription] = useState("");
  const [goalIcon, setGoalIcon] = useState<string>(DEFAULT_GOAL_BADGE_ICON);

  function applyDuration(days: number) {
    setDuration(days);
    setEndDate(endDateFromDuration(startDate, days));
  }

  function applyStart(next: string) {
    setStartDate(next);
    if (typeof duration === "number") {
      setEndDate(endDateFromDuration(next, duration));
    }
  }

  function applyEnd(next: string) {
    setEndDate(next);
    if (next >= startDate) {
      setDuration(durationFromEndDate(startDate, next));
    }
  }

  useGsap(
    rootRef,
    () => {
      enterFromNear("[data-form-section]", {
        y: 12,
        opacityFrom: 0.8,
        duration: 0.4,
        stagger: 0.08,
      });
    },
    [],
  );

  useEffect(() => {
    if (!pending) return;
    const card = rootRef.current?.querySelector<HTMLElement>("[data-create-card]") ?? null;
    animatePress(card, 0.985);
  }, [pending]);

  function applyPreset(preset: HabitPreset) {
    setTitle(preset.title);
    setDescription(preset.description ?? "");
    setColor(preset.color);
    setIcon(preset.icon);
    if (preset.suggested_duration_days) {
      applyDuration(preset.suggested_duration_days);
    }
  }

  const selectedPreset =
    presets.find((preset) =>
      isPresetSelected(preset, { title, color, icon, duration }),
    ) ?? null;

  return (
    <div ref={rootRef} className="relative pb-28 md:pb-8">
      <TemplateAssistiveTouch
        presets={presets}
        selectedId={selectedPreset?.id ?? null}
        onPick={applyPreset}
      />
      <Card data-form-section data-create-card>
        <CardBody className="p-5">
          <form action={action} className="space-y-4">
            <input type="hidden" name="color" value={color} />
            <input type="hidden" name="icon" value={icon} />
            <input type="hidden" name="goal_badge_enabled" value={goalBadgeOn ? "1" : ""} />

            <Field label="Title" htmlFor="title">
              <input
                id="title"
                name="title"
                required
                maxLength={HABIT_TITLE_MAX_LENGTH}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Read 20 pages"
                className={inputClassName}
              />
            </Field>

            <Field
              label="Description"
              htmlFor="description"
              hint="Optional. The overall why, not the per-day note."
            >
              <textarea
                id="description"
                name="description"
                maxLength={HABIT_DESCRIPTION_MAX_LENGTH}
                rows={2}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className={`${inputClassName} h-auto py-3`}
              />
            </Field>

            <div className="grid grid-cols-1 gap-4">
              <Field label="Start date" htmlFor="start_date">
                <input
                  id="start_date"
                  name="start_date"
                  type="date"
                  required
                  value={startDate}
                  onChange={(event) => applyStart(event.target.value)}
                  className={inputClassName}
                />
              </Field>
              <Field
                label="Duration (days)"
                htmlFor="duration_days"
                hint="Fills the end date for you. Leave blank to set the range directly."
              >
                <input
                  id="duration_days"
                  name="duration_days"
                  type="number"
                  min={1}
                  max={3650}
                  value={duration}
                  onChange={(event) => {
                    const raw = event.target.value;
                    if (raw === "") {
                      setDuration("");
                      return;
                    }
                    applyDuration(Number(raw));
                  }}
                  className={inputClassName}
                />
              </Field>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {HABIT_DURATION_PRESETS.map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => applyDuration(days)}
                  aria-pressed={duration === days}
                  className={chipClassName(duration === days)}
                >
                  {days}d
                </button>
              ))}
            </div>

            <Field label="End date" htmlFor="end_date">
              <input
                id="end_date"
                name="end_date"
                type="date"
                required
                value={endDate}
                onChange={(event) => applyEnd(event.target.value)}
                className={inputClassName}
              />
            </Field>

            <div className="rounded-2xl glass-thin">
              <button
                type="button"
                aria-expanded={styleOpen}
                onClick={() => setStyleOpen((open) => !open)}
                className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 px-3.5 py-2.5 text-left"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="text-sm font-medium text-ink">Color & icon</span>
                  {!styleOpen ? (
                    <span className="inline-flex items-center gap-1.5 text-ink-muted">
                      <span
                        className="size-3 rounded-full"
                        style={{ backgroundColor: habitColorHex(color) }}
                      />
                      <HabitIcon name={icon} className="size-3.5" />
                    </span>
                  ) : null}
                </span>
                <span className="text-xs text-ink-muted">
                  {styleOpen ? "Hide" : "Show"}
                </span>
              </button>
              {styleOpen ? (
                <div className="space-y-4 border-t border-hairline px-3.5 py-3">
                  <Field label="Color">
                    <div className="flex flex-wrap gap-2">
                      {HABIT_COLORS.map((key) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setColor(key)}
                          aria-label={key}
                          aria-pressed={color === key}
                          className={cn(
                            "size-11 cursor-pointer rounded-full border-2",
                            color === key
                              ? "border-ink ring-2 ring-ink ring-offset-2 ring-offset-canvas"
                              : "border-transparent",
                          )}
                          style={{ backgroundColor: HABIT_COLOR_HEX[key] }}
                        />
                      ))}
                    </div>
                  </Field>

                  <Field label="Icon">
                    <div className="flex flex-wrap gap-1.5">
                      {HABIT_ICONS.map((key) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setIcon(key)}
                          className={cn(
                            "flex size-11 cursor-pointer items-center justify-center rounded-lg border",
                            icon === key
                              ? "border-brand bg-brand-soft text-brand"
                              : "glass text-ink-muted hover:bg-glass-strong",
                          )}
                          aria-label={key}
                          aria-pressed={icon === key}
                        >
                          <HabitIcon name={key} />
                        </button>
                      ))}
                    </div>
                  </Field>
                </div>
              ) : null}
            </div>

            <section className="space-y-3 rounded-2xl glass-thin px-3.5 py-2.5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-ink">Goal badge</p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    Optional. Unlocks when you complete every day in the range.
                  </p>
                </div>
                <button
                  type="button"
                  aria-pressed={goalBadgeOn}
                  onClick={() => setGoalBadgeOn((open) => !open)}
                  className={chipClassName(goalBadgeOn)}
                >
                  {goalBadgeOn ? "On" : "Off"}
                </button>
              </div>
              {goalBadgeOn ? (
                <GoalBadgeFields
                  title={goalTitle}
                  description={goalDescription}
                  icon={goalIcon}
                  onTitle={setGoalTitle}
                  onDescription={setGoalDescription}
                  onIcon={setGoalIcon}
                  disabled={pending}
                />
              ) : null}
            </section>

            {state?.error ? (
              <p
                role="alert"
                className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger"
              >
                {state.error}
              </p>
            ) : null}

            <RippleCta type="submit" size="lg" className="w-full" disabled={pending}>
              {pending ? "Building panel…" : "Create habit"}
            </RippleCta>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

export function PresetCount({ count }: { count: number }) {
  return <Pill>{count} templates</Pill>;
}

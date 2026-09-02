"use client";

import { useActionState, useMemo, useState } from "react";

import { HabitIcon } from "@/components/habit/HabitIcon";
import {
  Button,
  Card,
  CardBody,
  Field,
  Pill,
  inputClassName,
} from "@/components/ui";
import {
  DEFAULT_HABIT_COLOR,
  DEFAULT_HABIT_ICON,
  HABIT_COLORS,
  HABIT_COLOR_HEX,
  HABIT_DESCRIPTION_MAX_LENGTH,
  HABIT_DURATION_PRESETS,
  HABIT_ICONS,
  HABIT_TITLE_MAX_LENGTH,
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

export function CreateHabitForm({ presets }: { presets: HabitPreset[] }) {
  const [state, action, pending] = useActionState(createHabitAction, null);
  const today = todayISO();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [duration, setDuration] = useState<number | "">(30);
  const [endDate, setEndDate] = useState(endDateFromDuration(today, 30));
  const [color, setColor] = useState<string>(DEFAULT_HABIT_COLOR);
  const [icon, setIcon] = useState<string>(DEFAULT_HABIT_ICON);

  const categories = useMemo(() => {
    const map = new Map<string, HabitPreset[]>();
    for (const preset of presets) {
      const list = map.get(preset.category) ?? [];
      list.push(preset);
      map.set(preset.category, list);
    }
    return [...map.entries()];
  }, [presets]);

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

  function applyPreset(preset: HabitPreset) {
    setTitle(preset.title);
    setDescription(preset.description ?? "");
    setColor(preset.color);
    setIcon(preset.icon);
    if (preset.suggested_duration_days) {
      applyDuration(preset.suggested_duration_days);
    }
  }

  return (
    <div className="space-y-8">
      {categories.length > 0 ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold">Start from a template</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Pick one to fill the form. You can still edit everything.
            </p>
          </div>
          {categories.map(([category, items]) => (
            <div key={category}>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-ink-subtle">
                {category}
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {items.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="flex items-start gap-3 rounded-xl border border-line bg-surface p-3 text-left transition-colors hover:border-line-strong hover:bg-surface-2"
                  >
                    <span
                      className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg"
                      style={{
                        backgroundColor: `${HABIT_COLOR_HEX[preset.color as keyof typeof HABIT_COLOR_HEX] ?? HABIT_COLOR_HEX.violet}22`,
                        color:
                          HABIT_COLOR_HEX[preset.color as keyof typeof HABIT_COLOR_HEX] ??
                          HABIT_COLOR_HEX.violet,
                      }}
                    >
                      <HabitIcon name={preset.icon} />
                    </span>
                    <span>
                      <span className="block text-sm font-medium text-ink">
                        {preset.title}
                      </span>
                      <span className="mt-0.5 block text-xs text-ink-muted">
                        {preset.suggested_duration_days
                          ? `${preset.suggested_duration_days} days`
                          : "Open-ended"}
                        {preset.description ? ` · ${preset.description}` : ""}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>
      ) : null}

      <Card>
        <CardBody>
          <form action={action} className="space-y-5">
            <input type="hidden" name="color" value={color} />
            <input type="hidden" name="icon" value={icon} />

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
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className={`${inputClassName} h-auto py-3`}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
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
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs",
                    duration === days
                      ? "border-brand bg-brand-soft text-brand"
                      : "border-line text-ink-muted hover:bg-surface-2",
                  )}
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

            <Field label="Color">
              <div className="flex flex-wrap gap-2">
                {HABIT_COLORS.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setColor(key)}
                    aria-label={key}
                    className={cn(
                      "size-8 rounded-full border-2",
                      color === key ? "border-ink" : "border-transparent",
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
                      "flex size-9 items-center justify-center rounded-lg border",
                      icon === key
                        ? "border-brand bg-brand-soft text-brand"
                        : "border-line text-ink-muted hover:bg-surface-2",
                    )}
                    aria-label={key}
                  >
                    <HabitIcon name={key} />
                  </button>
                ))}
              </div>
            </Field>

            {state?.error ? (
              <p
                role="alert"
                className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger"
              >
                {state.error}
              </p>
            ) : null}

            <Button type="submit" size="lg" className="w-full" disabled={pending}>
              {pending ? "Creating…" : "Create habit"}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

export function PresetCount({ count }: { count: number }) {
  return <Pill>{count} templates</Pill>;
}

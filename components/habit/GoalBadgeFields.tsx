"use client";

import { Field, inputClassName } from "@/components/ui";
import {
  GOAL_BADGE_DESCRIPTION_MAX_LENGTH,
  GOAL_BADGE_ICONS,
  GOAL_BADGE_TITLE_MAX_LENGTH,
} from "@/lib/habits/constants";
import { cn } from "@/lib/utils";

export function GoalBadgeFields({
  title,
  description,
  icon,
  onTitle,
  onDescription,
  onIcon,
  disabled,
}: {
  title: string;
  description: string;
  icon: string;
  onTitle: (value: string) => void;
  onDescription: (value: string) => void;
  onIcon: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-4">
      <input type="hidden" name="goal_badge_icon" value={icon} />

      <Field
        label="Badge title"
        htmlFor="goal_badge_title"
        hint="What you'll unlock when this habit is finished."
      >
        <input
          id="goal_badge_title"
          name="goal_badge_title"
          maxLength={GOAL_BADGE_TITLE_MAX_LENGTH}
          value={title}
          onChange={(event) => onTitle(event.target.value)}
          placeholder="Finished Atomic Habits"
          disabled={disabled}
          className={inputClassName}
        />
      </Field>

      <Field
        label="Description"
        htmlFor="goal_badge_description"
        hint="Optional. A line you'll see on your profile."
      >
        <textarea
          id="goal_badge_description"
          name="goal_badge_description"
          maxLength={GOAL_BADGE_DESCRIPTION_MAX_LENGTH}
          rows={2}
          value={description}
          onChange={(event) => onDescription(event.target.value)}
          placeholder="Read the whole book, every day in the range."
          disabled={disabled}
          className={`${inputClassName} h-auto py-3`}
        />
      </Field>

      <Field label="Icon">
        <div className="flex flex-wrap gap-1.5">
          {GOAL_BADGE_ICONS.map((key) => (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => onIcon(key)}
              aria-label={`Badge icon ${key}`}
              aria-pressed={icon === key}
              className={cn(
                "flex size-11 items-center justify-center rounded-lg border text-lg",
                icon === key
                  ? "border-brand bg-brand-soft"
                  : "glass text-ink-muted hover:bg-glass-strong",
              )}
            >
              {key}
            </button>
          ))}
        </div>
      </Field>
    </div>
  );
}

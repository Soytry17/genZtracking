"use client";

import { useRef, useState, useTransition } from "react";

import { animatePress } from "@/lib/anim/anime";
import { inputClassName } from "@/components/ui/field";
import {
  DEFAULT_TASK_IMPORTANCE,
  DEFAULT_TASK_PRIORITY,
  TASK_DESCRIPTION_MAX_LENGTH,
  TASK_IMPORTANCE_LABELS,
  TASK_IMPORTANCES,
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_TONE,
  TASK_TITLE_MAX_LENGTH,
} from "@/lib/tasks/constants";
import { createTask } from "@/lib/tasks/actions";
import { cn } from "@/lib/utils";
import type { DailyTask, TaskImportance, TaskPriority } from "@/types/database";

export function AddTaskForm({
  priority: defaultPriority = DEFAULT_TASK_PRIORITY,
  onCreated,
}: {
  priority?: TaskPriority;
  onCreated: (task: DailyTask) => void;
}) {
  const addRef = useRef<HTMLButtonElement>(null);
  const moreRef = useRef<HTMLButtonElement>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>(defaultPriority);
  const [importance, setImportance] =
    useState<TaskImportance>(DEFAULT_TASK_IMPORTANCE);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit() {
    const trimmed = title.trim();
    if (!trimmed) return;
    setError(null);
    start(async () => {
      const result = await createTask({
        title: trimmed,
        description,
        priority,
        importance,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setTitle("");
      setDescription("");
      setImportance(DEFAULT_TASK_IMPORTANCE);
      setExpanded(false);
      onCreated(result.data);
    });
  }

  return (
    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <div className="flex gap-1.5">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={TASK_TITLE_MAX_LENGTH}
          placeholder="Add a task"
          disabled={pending}
          className={cn(
            inputClassName,
            "h-11 min-w-0 flex-1 rounded-2xl px-3 text-sm sm:h-10",
          )}
          aria-label="New task title"
        />
        <button
          ref={addRef}
          type="submit"
          disabled={pending || !title.trim()}
          onPointerDown={(event) => {
            if (!pending && title.trim() && event.button === 0) {
              animatePress(addRef.current, 0.92);
            }
          }}
          className="h-11 shrink-0 rounded-2xl bg-brand px-3.5 text-sm font-medium text-brand-ink hover:bg-brand-hover disabled:opacity-40 sm:h-10"
          aria-label="Add task"
        >
          Add
        </button>
        <button
          ref={moreRef}
          type="button"
          onPointerDown={(event) => {
            if (event.button === 0) animatePress(moreRef.current, 0.92);
          }}
          onClick={() => setExpanded((open) => !open)}
          className="h-11 shrink-0 rounded-2xl px-2.5 text-xs text-ink-subtle hover:bg-glass hover:text-ink sm:h-10"
          aria-expanded={expanded}
        >
          {expanded ? "Less" : "More"}
        </button>
      </div>

      <div className="flex flex-wrap gap-1">
        {TASK_PRIORITIES.map((value) => {
          const tone = TASK_PRIORITY_TONE[value];
          const selected = priority === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setPriority(value)}
              className={cn(
                "inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-medium",
                selected ? cn(tone.soft, tone.text) : "glass text-ink-muted",
              )}
              aria-pressed={selected}
            >
              <span className={cn("size-1.5 rounded-full", tone.dot)} />
              {TASK_PRIORITY_LABELS[value]}
            </button>
          );
        })}
      </div>

      {expanded ? (
        <div className="space-y-2">
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={TASK_DESCRIPTION_MAX_LENGTH}
            rows={2}
            placeholder="Description (optional)"
            disabled={pending}
            className={cn(inputClassName, "h-auto py-2 text-xs")}
          />
          <div className="flex flex-wrap gap-1">
            {TASK_IMPORTANCES.map((value) => (
              <ImportanceChip
                key={value}
                label={TASK_IMPORTANCE_LABELS[value]}
                selected={importance === value}
                onSelect={() => setImportance(value)}
              />
            ))}
          </div>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : null}
    </form>
  );
}

function ImportanceChip({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <button
      ref={ref}
      type="button"
      onPointerDown={(event) => {
        if (event.button === 0) animatePress(ref.current, 0.92);
      }}
      onClick={onSelect}
      className={cn(
        "rounded-full px-2 py-1 text-[11px]",
        selected
          ? "bg-brand-soft text-brand"
          : "glass text-ink-muted hover:bg-glass-strong",
      )}
    >
      {label}
    </button>
  );
}

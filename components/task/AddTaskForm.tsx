"use client";

import { useState, useTransition } from "react";

import { inputClassName } from "@/components/ui";
import {
  DEFAULT_TASK_IMPORTANCE,
  TASK_DESCRIPTION_MAX_LENGTH,
  TASK_IMPORTANCE_LABELS,
  TASK_IMPORTANCES,
  TASK_TITLE_MAX_LENGTH,
} from "@/lib/tasks/constants";
import { createTask } from "@/lib/tasks/actions";
import { cn } from "@/lib/utils";
import type { DailyTask, TaskImportance, TaskPriority } from "@/types/database";

export function AddTaskForm({
  priority,
  onCreated,
}: {
  priority: TaskPriority;
  onCreated: (task: DailyTask) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
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
          placeholder="Add task"
          disabled={pending}
          className={cn(inputClassName, "h-9 min-w-0 flex-1 rounded-xl px-2.5 text-xs")}
          aria-label="New task title"
        />
        <button
          type="submit"
          disabled={pending || !title.trim()}
          className="h-9 shrink-0 rounded-xl px-2.5 text-xs font-medium text-ink-muted hover:bg-glass hover:text-ink disabled:opacity-40"
          aria-label="Add task"
        >
          Add
        </button>
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          className="h-9 shrink-0 rounded-xl px-2 text-[11px] text-ink-subtle hover:bg-glass hover:text-ink"
          aria-expanded={expanded}
        >
          {expanded ? "Less" : "More"}
        </button>
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
              <button
                key={value}
                type="button"
                onClick={() => setImportance(value)}
                className={cn(
                  "rounded-full px-2 py-1 text-[11px]",
                  importance === value
                    ? "bg-brand-soft text-brand"
                    : "glass text-ink-muted hover:bg-glass-strong",
                )}
              >
                {TASK_IMPORTANCE_LABELS[value]}
              </button>
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

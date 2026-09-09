"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";

import { animatePress } from "@/lib/anim/anime";
import { enterFromNear, useGsap } from "@/lib/anim/gsap";

import { Button } from "@/components/ui/button";
import { Field, inputClassName } from "@/components/ui/field";
import {
  TASK_DESCRIPTION_MAX_LENGTH,
  TASK_IMPORTANCE_LABELS,
  TASK_IMPORTANCES,
  TASK_TITLE_MAX_LENGTH,
} from "@/lib/tasks/constants";
import { deleteTask, updateTask } from "@/lib/tasks/actions";
import { cn } from "@/lib/utils";
import type { DailyTask, TaskImportance } from "@/types/database";

export function TaskSheet({
  task,
  onClose,
  onUpdated,
  onDeleted,
}: {
  task: DailyTask;
  onClose: () => void;
  onUpdated: (task: DailyTask) => void;
  onDeleted: (taskId: string) => void;
}) {
  const titleId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLButtonElement>(null);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [importance, setImportance] = useState<TaskImportance>(task.importance);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, start] = useTransition();

  useGsap(
    rootRef,
    () => {
      enterFromNear(backdropRef.current, {
        y: 0,
        opacityFrom: 0.72,
        duration: 0.28,
      });
      enterFromNear(panelRef.current, {
        y: 28,
        opacityFrom: 0.88,
        duration: 0.34,
      });
    },
    [task.id],
  );

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description ?? "");
    setImportance(task.importance);
    setError(null);
    setConfirmDelete(false);
  }, [task]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-50 flex items-end justify-center md:items-center"
    >
      <button
        ref={backdropRef}
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="glass-strong relative z-10 w-full max-h-[85dvh] overflow-y-auto rounded-t-panel p-4 pb-[max(1.5rem,var(--safe-bottom))] shadow-glass sm:p-6 md:max-w-md md:rounded-panel md:pb-6"
      >
        <p className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
          Edit task
        </p>
        <h2 id={titleId} className="mt-1 text-lg font-semibold">
          {task.title}
        </h2>

        <form
          className="mt-4 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            start(async () => {
              const result = await updateTask(task.id, {
                title,
                description,
                importance,
              });
              if (!result.ok) {
                setError(result.error);
                return;
              }
              onUpdated(result.data);
              onClose();
            });
          }}
        >
          <Field label="Title" htmlFor="task-title">
            <input
              id="task-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={TASK_TITLE_MAX_LENGTH}
              required
              disabled={pending}
              className={inputClassName}
            />
          </Field>
          <Field label="Description" htmlFor="task-description">
            <textarea
              id="task-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={TASK_DESCRIPTION_MAX_LENGTH}
              rows={3}
              disabled={pending}
              placeholder="Optional"
              className={`${inputClassName} h-auto py-3`}
            />
          </Field>
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-ink-muted">Importance</p>
            <div className="flex flex-wrap gap-1.5">
              {TASK_IMPORTANCES.map((value) => (
                <ImportanceChoice
                  key={value}
                  label={TASK_IMPORTANCE_LABELS[value]}
                  selected={importance === value}
                  onSelect={() => setImportance(value)}
                />
              ))}
            </div>
          </div>

          {error ? (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          ) : null}

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Saving…" : "Save"}
          </Button>
        </form>

        <div className="mt-3">
          {confirmDelete ? (
            <Button
              variant="danger"
              className="w-full"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const result = await deleteTask(task.id);
                  if (!result.ok) {
                    setError(result.error);
                    return;
                  }
                  onDeleted(task.id);
                  onClose();
                })
              }
            >
              Confirm delete
            </Button>
          ) : (
            <Button
              variant="ghost"
              className="w-full text-danger"
              disabled={pending}
              onClick={() => setConfirmDelete(true)}
            >
              Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ImportanceChoice({
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
        "rounded-full px-3 py-1.5 text-xs",
        selected
          ? "bg-brand-soft text-brand"
          : "glass text-ink-muted hover:bg-glass-strong",
      )}
    >
      {label}
    </button>
  );
}

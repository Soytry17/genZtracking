"use client";

import type { ReactNode } from "react";

import { DoneToday } from "@/components/task/DoneToday";
import { AddTaskForm } from "@/components/task/AddTaskForm";
import { TaskCard } from "@/components/task/TaskCard";
import { TaskSheet } from "@/components/task/TaskSheet";
import type { TodayTasksApi } from "@/components/task/useTodayTasks";
import {
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_TONE,
} from "@/lib/tasks/constants";
import { cn } from "@/lib/utils";
import type { TaskPriority } from "@/types/database";

export function TaskBoard({ tasks }: { tasks: TodayTasksApi }) {
  const {
    done,
    byPriority,
    visiblePriorities,
    editing,
    freshIds,
    error,
    totalCount,
    applyTask,
    removeTask,
    openTask,
    closeEditor,
    handleCreated,
    movePriority,
    toggleImportance,
    toggle,
  } = tasks;

  return (
    <section className="space-y-4" aria-label="Today's tasks">
      <header className="flex items-center gap-2">
        <h2 className="text-lg font-semibold tracking-tight">
          <span className="md:hidden">Today&apos;s Tasks</span>
          <span className="hidden md:inline">Tasks</span>
        </h2>
        <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold tabular-nums text-brand">
          {totalCount}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden rounded-full glass px-2.5 py-1 text-[11px] font-medium text-ink-muted sm:inline">
            Sort by Priority
          </span>
          <DoneToday tasks={done} onUndo={toggle} />
        </div>
      </header>

      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}

      <AddTaskForm onCreated={handleCreated} />

      {visiblePriorities.length === 0 ? (
        <p className="rounded-[1.5rem] glass px-4 py-8 text-center text-sm text-ink-muted">
          Nothing on the list yet. Add a task above — unfinished ones roll over.
        </p>
      ) : (
        <div className="space-y-5">
          {visiblePriorities.map((priority) => (
            <PriorityGroup
              key={priority}
              priority={priority}
              count={byPriority[priority].length}
            >
              {byPriority[priority].map((task) => (
                <li key={task.id}>
                  <TaskCard
                    task={task}
                    fresh={freshIds.has(task.id)}
                    onOpen={() => openTask(task)}
                    onToggle={() => toggle(task)}
                    onPriorityChange={(next) => movePriority(task, next)}
                    onImportanceToggle={() => toggleImportance(task)}
                  />
                </li>
              ))}
            </PriorityGroup>
          ))}
        </div>
      )}

      {editing ? (
        <TaskSheet
          task={editing}
          onClose={closeEditor}
          onUpdated={applyTask}
          onDeleted={removeTask}
        />
      ) : null}
    </section>
  );
}

function PriorityGroup({
  priority,
  count,
  children,
}: {
  priority: TaskPriority;
  count: number;
  children: ReactNode;
}) {
  const tone = TASK_PRIORITY_TONE[priority];
  return (
    <section aria-label={`${TASK_PRIORITY_LABELS[priority]} tasks`}>
      <header className="mb-2 flex items-center gap-2">
        <span className={cn("size-2 shrink-0 rounded-full", tone.dot)} />
        <h3 className={cn("text-sm font-semibold", tone.text)}>
          {TASK_PRIORITY_LABELS[priority]}
        </h3>
        <span className="text-xs tabular-nums text-ink-subtle">{count}</span>
      </header>
      <ul className="space-y-2">{children}</ul>
    </section>
  );
}

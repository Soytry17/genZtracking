"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

import { AddTaskForm } from "@/components/task/AddTaskForm";
import { DraggableTaskCard } from "@/components/task/TaskCard";
import {
  TASK_PRIORITY_EMPTY,
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_TONE,
  columnDroppableId,
} from "@/lib/tasks/constants";
import { cn } from "@/lib/utils";
import type { DailyTask, TaskPriority } from "@/types/database";

export function TaskColumn({
  priority,
  tasks,
  onOpen,
  onToggle,
  onPriorityChange,
  onCreated,
}: {
  priority: TaskPriority;
  tasks: DailyTask[];
  onOpen: (task: DailyTask) => void;
  onToggle: (task: DailyTask) => void;
  onPriorityChange: (task: DailyTask, priority: TaskPriority) => void;
  onCreated: (task: DailyTask) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: columnDroppableId(priority),
    data: { type: "column", priority },
  });
  const tone = TASK_PRIORITY_TONE[priority];

  return (
    <section
      ref={setNodeRef}
      aria-label={`${TASK_PRIORITY_LABELS[priority]} tasks`}
      className={cn(
        "flex w-[min(82vw,19rem)] shrink-0 snap-start flex-col overflow-hidden rounded-card glass md:w-auto md:min-w-0",
        isOver && `ring-2 ${tone.ring}`,
      )}
    >
      <div className={cn("h-0.5", tone.bar)} />
      <header className="flex items-center gap-2 border-b border-hairline px-3 py-2.5">
        <span className={cn("size-2 shrink-0 rounded-full", tone.dot)} />
        <h3 className={cn("text-sm font-semibold", tone.text)}>
          {TASK_PRIORITY_LABELS[priority]}
        </h3>
        <span className="ml-auto text-xs tabular-nums text-ink-subtle">
          {tasks.length}
        </span>
      </header>

      <div className="flex min-h-36 flex-1 flex-col gap-2 p-2 sm:min-h-44">
        <SortableContext
          id={`sortable:${priority}`}
          items={tasks.map((task) => task.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.length === 0 ? (
            <p className="px-1 py-3 text-center text-xs text-ink-subtle">
              {TASK_PRIORITY_EMPTY[priority]}
            </p>
          ) : (
            tasks.map((task) => (
              <DraggableTaskCard
                key={task.id}
                task={task}
                onOpen={() => onOpen(task)}
                onToggle={() => onToggle(task)}
                onPriorityChange={(next) => onPriorityChange(task, next)}
              />
            ))
          )}
        </SortableContext>
        <div className="mt-auto pt-1">
          <AddTaskForm priority={priority} onCreated={onCreated} />
        </div>
      </div>
    </section>
  );
}

"use client";

import { useSortable } from "@dnd-kit/sortable";
import { useRef, useTransition } from "react";

import { animatePress } from "@/lib/anim/anime";

import { CheckIcon } from "@/components/habit/CheckIcon";
import {
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_TONE,
} from "@/lib/tasks/constants";
import { cn } from "@/lib/utils";
import type { DailyTask, TaskPriority } from "@/types/database";

export function TaskCard({
  task,
  onToggle,
  onOpen,
  onPriorityChange,
  dragHandleProps,
  isDragging,
  compact = false,
}: {
  task: DailyTask;
  onToggle: () => void;
  onOpen: () => void;
  onPriorityChange?: (priority: TaskPriority) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement> & {
    role?: string;
    tabIndex?: number;
    "aria-disabled"?: boolean;
    "aria-pressed"?: boolean | "mixed";
    "aria-roledescription"?: string;
  };
  isDragging?: boolean;
  compact?: boolean;
}) {
  const checkRef = useRef<HTMLButtonElement>(null);
  const [pending, start] = useTransition();
  const done = Boolean(task.completed_at);
  const tone = TASK_PRIORITY_TONE[task.priority];
  const important = task.importance === "important";

  return (
    <div
      className={cn(
        "rounded-2xl glass px-2.5 py-2 sm:px-3",
        isDragging && "opacity-40",
        done && "opacity-70",
      )}
    >
      <div className="flex items-start gap-1.5">
        {dragHandleProps ? (
          <button
            type="button"
            className="mt-1 hidden size-8 shrink-0 cursor-grab items-center justify-center rounded-lg text-ink-subtle hover:bg-glass hover:text-ink active:cursor-grabbing md:inline-flex"
            aria-label={`Drag ${task.title}`}
            {...dragHandleProps}
          >
            <DragGrip />
          </button>
        ) : null}

        <button
          type="button"
          onClick={onOpen}
          className="min-w-0 flex-1 rounded-lg py-0.5 text-left"
        >
          <span
            className={cn(
              "block text-sm font-medium leading-snug text-ink",
              done && "text-ink-muted line-through",
            )}
          >
            {task.title}
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                important
                  ? "bg-brand-soft text-brand"
                  : "bg-glass text-ink-subtle",
              )}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  important ? "bg-brand" : "bg-ink-subtle",
                )}
              />
              {important ? "Important" : "Not important"}
            </span>
            {task.description ? (
              <span className="truncate text-[11px] text-ink-subtle">
                {task.description}
              </span>
            ) : null}
          </span>
        </button>

        <button
          ref={checkRef}
          type="button"
          disabled={pending}
          onPointerDown={(event) => {
            if (!pending && event.button === 0) {
              animatePress(checkRef.current);
            }
          }}
          onClick={() => start(onToggle)}
          className={cn(
            "relative mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors",
            done ? cn(tone.soft, tone.text) : "glass-tile text-ink-muted hover:bg-glass",
          )}
          aria-label={done ? `Uncheck ${task.title}` : `Complete ${task.title}`}
        >
          <CheckIcon active={done} className="size-4" />
        </button>
      </div>

      {onPriorityChange && !compact ? (
        <div className="mt-2 flex items-center gap-1 md:hidden">
          {TASK_PRIORITIES.map((priority) => (
            <button
              key={priority}
              type="button"
              disabled={pending}
              onClick={() => start(() => onPriorityChange(priority))}
              className={cn(
                "size-6 rounded-full",
                TASK_PRIORITY_TONE[priority].soft,
                task.priority === priority &&
                  `ring-2 ring-offset-1 ring-offset-transparent ${TASK_PRIORITY_TONE[priority].ring}`,
              )}
              aria-label={`Set priority ${TASK_PRIORITY_LABELS[priority]}`}
              aria-pressed={task.priority === priority}
              title={TASK_PRIORITY_LABELS[priority]}
            >
              <span
                className={cn(
                  "mx-auto block size-2 rounded-full",
                  TASK_PRIORITY_TONE[priority].dot,
                )}
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function DraggableTaskCard({
  task,
  onToggle,
  onOpen,
  onPriorityChange,
}: {
  task: DailyTask;
  onToggle: () => void;
  onOpen: () => void;
  onPriorityChange: (priority: TaskPriority) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({
    id: task.id,
    data: { type: "task", priority: task.priority },
    animateLayoutChanges: () => false,
  });

  return (
    <div ref={setNodeRef} className={isDragging ? "z-10" : undefined}>
      <TaskCard
        task={task}
        isDragging={isDragging}
        onToggle={onToggle}
        onOpen={onOpen}
        onPriorityChange={onPriorityChange}
        dragHandleProps={{ ...listeners, ...attributes }}
      />
    </div>
  );
}

function DragGrip() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
      <circle cx="5" cy="4" r="1.15" fill="currentColor" />
      <circle cx="11" cy="4" r="1.15" fill="currentColor" />
      <circle cx="5" cy="8" r="1.15" fill="currentColor" />
      <circle cx="11" cy="8" r="1.15" fill="currentColor" />
      <circle cx="5" cy="12" r="1.15" fill="currentColor" />
      <circle cx="11" cy="12" r="1.15" fill="currentColor" />
    </svg>
  );
}

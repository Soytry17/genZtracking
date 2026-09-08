"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import { DoneToday } from "@/components/task/DoneToday";
import { TaskCard } from "@/components/task/TaskCard";
import { TaskColumn } from "@/components/task/TaskColumn";
import { TaskSheet } from "@/components/task/TaskSheet";
import {
  TASK_PRIORITIES,
  parseColumnDroppableId,
} from "@/lib/tasks/constants";
import { setTaskPriority, toggleTaskComplete } from "@/lib/tasks/actions";
import { sortOpenTasks } from "@/lib/tasks/order";
import type { DailyTask, TaskPriority } from "@/types/database";

export function TaskBoard({
  openTasks,
  doneToday,
}: {
  openTasks: DailyTask[];
  doneToday: DailyTask[];
}) {
  const [tasks, setTasks] = useState(openTasks);
  const [done, setDone] = useState(doneToday);
  const [editing, setEditing] = useState<DailyTask | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const skipClick = useRef(false);
  const [, start] = useTransition();

  useEffect(() => {
    setTasks(sortOpenTasks(openTasks));
  }, [openTasks]);

  useEffect(() => {
    setDone(doneToday);
  }, [doneToday]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const byPriority = useMemo(() => {
    const grouped: Record<TaskPriority, DailyTask[]> = {
      urgent: [],
      high: [],
      medium: [],
      low: [],
    };
    for (const task of tasks) grouped[task.priority].push(task);
    return grouped;
  }, [tasks]);

  const activeTask = activeId
    ? (tasks.find((task) => task.id === activeId) ?? null)
    : null;

  function applyTask(next: DailyTask) {
    if (next.completed_at) {
      setTasks((prev) => prev.filter((task) => task.id !== next.id));
      setDone((prev) => [next, ...prev.filter((task) => task.id !== next.id)]);
    } else {
      setDone((prev) => prev.filter((task) => task.id !== next.id));
      setTasks((prev) =>
        sortOpenTasks([...prev.filter((task) => task.id !== next.id), next]),
      );
    }
    setEditing((current) => (current?.id === next.id ? next : current));
  }

  function removeTask(taskId: string) {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
    setDone((prev) => prev.filter((task) => task.id !== taskId));
    setEditing((current) => (current?.id === taskId ? null : current));
  }

  function openTask(task: DailyTask) {
    if (skipClick.current) {
      skipClick.current = false;
      return;
    }
    setEditing(task);
  }

  function movePriority(task: DailyTask, priority: TaskPriority) {
    if (task.priority === priority) return;
    const next = { ...task, priority };
    applyTask(next);
    setError(null);
    start(async () => {
      const result = await setTaskPriority(task.id, priority);
      if (!result.ok) {
        applyTask(task);
        setError(result.error);
        return;
      }
      applyTask(result.data);
    });
  }

  function toggle(task: DailyTask) {
    const next: DailyTask = {
      ...task,
      completed_at: task.completed_at ? null : new Date().toISOString(),
    };
    applyTask(next);
    setError(null);
    start(async () => {
      const result = await toggleTaskComplete(task.id);
      if (!result.ok) {
        applyTask(task);
        setError(result.error);
        return;
      }
      applyTask(result.data);
    });
  }

  function onDragStart(event: DragStartEvent) {
    skipClick.current = true;
    setActiveId(String(event.active.id));
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const overData = over.data.current as { priority?: TaskPriority } | undefined;
    const overTask = tasks.find((row) => row.id === String(over.id));
    const priority =
      parseColumnDroppableId(String(over.id)) ??
      overData?.priority ??
      overTask?.priority ??
      null;
    if (!priority) return;

    const task = tasks.find((row) => row.id === String(active.id));
    if (!task) return;
    movePriority(task, priority);
  }

  const openCount = tasks.length;

  return (
    <section className="space-y-3" aria-label="Priority tasks">
      <header className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-medium text-ink-muted">Tasks</h2>
        <p className="text-xs text-ink-subtle">
          {openCount === 0
            ? "Nothing open"
            : `${openCount} open · unfinished roll over`}
        </p>
      </header>

      <p className="text-xs text-ink-subtle md:hidden">
        Swipe for other priorities. Use the dots on a card to change priority.
      </p>

      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragCancel={() => setActiveId(null)}
        onDragEnd={onDragEnd}
      >
        <div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory md:grid md:grid-cols-4 md:overflow-visible md:pb-0">
          {TASK_PRIORITIES.map((priority) => (
            <TaskColumn
              key={priority}
              priority={priority}
              tasks={byPriority[priority]}
              onOpen={openTask}
              onToggle={toggle}
              onPriorityChange={movePriority}
              onCreated={applyTask}
            />
          ))}
        </div>
        <DragOverlay dropAnimation={null}>
          {activeTask ? (
            <div className="w-[min(82vw,19rem)] md:w-64">
              <TaskCard
                task={activeTask}
                compact
                onOpen={() => undefined}
                onToggle={() => undefined}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <DoneToday tasks={done} onToggle={toggle} onOpen={openTask} />

      {editing ? (
        <TaskSheet
          task={editing}
          onClose={() => setEditing(null)}
          onUpdated={applyTask}
          onDeleted={removeTask}
        />
      ) : null}
    </section>
  );
}

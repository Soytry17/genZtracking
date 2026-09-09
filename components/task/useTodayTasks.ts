"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

import { sortOpenTasks } from "@/lib/tasks/order";
import {
  setTaskImportance,
  setTaskPriority,
  toggleTaskComplete,
} from "@/lib/tasks/actions";
import { TASK_PRIORITIES } from "@/lib/tasks/constants";
import type { DailyTask, TaskImportance, TaskPriority } from "@/types/database";

export function useTodayTasks(openTasks: DailyTask[], doneToday: DailyTask[]) {
  const tasksRef = useRef(openTasks);
  const [tasks, setTasks] = useState(openTasks);
  const [done, setDone] = useState(doneToday);
  const [editing, setEditing] = useState<DailyTask | null>(null);
  const [freshIds, setFreshIds] = useState<ReadonlySet<string>>(() => new Set());
  const [error, setError] = useState<string | null>(null);
  const genRef = useRef(new Map<string, number>());
  const chainRef = useRef(new Map<string, Promise<void>>());
  const [, start] = useTransition();

  useEffect(() => {
    setTasks(sortOpenTasks(openTasks));
  }, [openTasks]);

  tasksRef.current = tasks;

  useEffect(() => {
    setDone(doneToday);
  }, [doneToday]);

  function markFresh(id: string) {
    setFreshIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    window.setTimeout(() => {
      setFreshIds((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 420);
  }

  function bumpGen(id: string) {
    const next = (genRef.current.get(id) ?? 0) + 1;
    genRef.current.set(id, next);
    return next;
  }

  function enqueueTask(id: string, work: () => Promise<void>) {
    const prev = chainRef.current.get(id) ?? Promise.resolve();
    const next = prev.then(work, work);
    chainRef.current.set(id, next);
    void next.finally(() => {
      if (chainRef.current.get(id) === next) chainRef.current.delete(id);
    });
  }

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
    setEditing(task);
  }

  function handleCreated(task: DailyTask) {
    markFresh(task.id);
    applyTask(task);
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

  function toggleImportance(task: DailyTask) {
    const importance: TaskImportance =
      task.importance === "important" ? "not_important" : "important";
    const next = { ...task, importance };
    applyTask(next);
    setError(null);
    start(async () => {
      const result = await setTaskImportance(task.id, importance);
      if (!result.ok) {
        applyTask(task);
        setError(result.error);
        return;
      }
      applyTask(result.data);
    });
  }

  function toggle(task: DailyTask) {
    const completing = !task.completed_at;
    const next: DailyTask = {
      ...task,
      completed_at: completing ? new Date().toISOString() : null,
    };
    const gen = bumpGen(task.id);
    setError(null);
    applyTask(next);

    enqueueTask(task.id, async () => {
      const result = await toggleTaskComplete(task.id, completing);
      if (genRef.current.get(task.id) !== gen) return;
      if (!result.ok) {
        applyTask(task);
        setError(result.error);
        return;
      }
      applyTask(result.data);
    });
  }

  const listed = useMemo(() => {
    const byId = new Map<string, DailyTask>();
    for (const task of tasks) byId.set(task.id, task);
    for (const task of done) byId.set(task.id, task);
    return sortOpenTasks([...byId.values()]);
  }, [tasks, done]);

  const byPriority = useMemo(() => {
    const grouped: Record<TaskPriority, DailyTask[]> = {
      urgent: [],
      high: [],
      medium: [],
      low: [],
    };
    for (const task of listed) grouped[task.priority].push(task);
    return grouped;
  }, [listed]);

  const visiblePriorities = useMemo(
    () => TASK_PRIORITIES.filter((priority) => byPriority[priority].length > 0),
    [byPriority],
  );

  const closeEditor = useCallback(() => setEditing(null), []);

  return {
    tasks,
    done,
    listed,
    byPriority,
    visiblePriorities,
    editing,
    freshIds,
    error,
    doneCount: done.length,
    totalCount: listed.length,
    openCount: tasks.length,
    applyTask,
    removeTask,
    openTask,
    closeEditor,
    handleCreated,
    movePriority,
    toggleImportance,
    toggle,
  };
}

export type TodayTasksApi = ReturnType<typeof useTodayTasks>;

import type { TaskImportance, TaskPriority } from "@/types/database";

export const TASK_PRIORITIES = [
  "urgent",
  "high",
  "medium",
  "low",
] as const satisfies readonly TaskPriority[];

export const TASK_IMPORTANCES = [
  "important",
  "not_important",
] as const satisfies readonly TaskImportance[];

export const DEFAULT_TASK_PRIORITY: TaskPriority = "medium";
export const DEFAULT_TASK_IMPORTANCE: TaskImportance = "not_important";

export const TASK_TITLE_MAX_LENGTH = 120;
export const TASK_DESCRIPTION_MAX_LENGTH = 2000;

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export const TASK_PRIORITY_EMPTY: Record<TaskPriority, string> = {
  urgent: "No urgent tasks",
  high: "No high-priority tasks",
  medium: "No medium-priority tasks",
  low: "No low-priority tasks",
};

export const TASK_IMPORTANCE_LABELS: Record<TaskImportance, string> = {
  important: "Important",
  not_important: "Not important",
};

/** Column accent: urgent red, high yellow, medium green, low gray. */
export const TASK_PRIORITY_TONE: Record<
  TaskPriority,
  {
    dot: string;
    text: string;
    soft: string;
    ring: string;
    bar: string;
  }
> = {
  urgent: {
    dot: "bg-danger",
    text: "text-danger",
    soft: "bg-danger-soft",
    ring: "ring-danger/35",
    bar: "bg-danger",
  },
  high: {
    dot: "bg-warning",
    text: "text-warning",
    soft: "bg-warning-soft",
    ring: "ring-warning/35",
    bar: "bg-warning",
  },
  medium: {
    dot: "bg-success",
    text: "text-success",
    soft: "bg-success-soft",
    ring: "ring-success/35",
    bar: "bg-success",
  },
  low: {
    dot: "bg-ink-subtle",
    text: "text-ink-muted",
    soft: "bg-glass",
    ring: "ring-ink-subtle/40",
    bar: "bg-ink-subtle",
  },
};

export function isTaskPriority(value: string): value is TaskPriority {
  return (TASK_PRIORITIES as readonly string[]).includes(value);
}

export function isTaskImportance(value: string): value is TaskImportance {
  return (TASK_IMPORTANCES as readonly string[]).includes(value);
}

export function columnDroppableId(priority: TaskPriority): string {
  return `column:${priority}`;
}

export function parseColumnDroppableId(id: string): TaskPriority | null {
  if (!id.startsWith("column:")) return null;
  const value = id.slice("column:".length);
  return isTaskPriority(value) ? value : null;
}

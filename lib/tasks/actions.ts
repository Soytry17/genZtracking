"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { ROUTES } from "@/lib/habits/constants";
import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_TASK_IMPORTANCE,
  DEFAULT_TASK_PRIORITY,
  TASK_DESCRIPTION_MAX_LENGTH,
  TASK_TITLE_MAX_LENGTH,
  isTaskImportance,
  isTaskPriority,
} from "@/lib/tasks/constants";
import { TASK_BOARD_COLUMNS } from "@/lib/tasks/queries";
import type {
  DailyTask,
  TaskImportance,
  TaskPriority,
} from "@/types/database";

export type TaskActionOk<T> = { ok: true; data: T };
export type TaskActionErr = { ok: false; error: string };
export type TaskActionResult<T = null> = TaskActionOk<T> | TaskActionErr;

function fail(error: string): TaskActionErr {
  return { ok: false, error };
}

function revalidateTasks() {
  revalidatePath(ROUTES.today);
}

function parseTitle(raw: string): string | TaskActionErr {
  const title = raw.trim();
  if (!title) return fail("Give this task a name.");
  if (title.length > TASK_TITLE_MAX_LENGTH) {
    return fail(`Keep the title under ${TASK_TITLE_MAX_LENGTH} characters.`);
  }
  return title;
}

function parseDescription(raw: string): string | null | TaskActionErr {
  const description = raw.trim();
  if (description.length > TASK_DESCRIPTION_MAX_LENGTH) {
    return fail(
      `Keep the description under ${TASK_DESCRIPTION_MAX_LENGTH} characters.`,
    );
  }
  return description || null;
}

function isActionErr(value: unknown): value is TaskActionErr {
  return Boolean(
    value &&
      typeof value === "object" &&
      "ok" in value &&
      (value as TaskActionErr).ok === false,
  );
}

async function loadOwnedTask(
  taskId: string,
  userId: string,
): Promise<{ task: DailyTask } | TaskActionErr> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("daily_tasks")
    .select(TASK_BOARD_COLUMNS)
    .eq("id", taskId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return fail(error.message);
  if (!data) return fail("Task not found.");
  return { task: data as DailyTask };
}

export async function createTask(input: {
  title: string;
  description?: string;
  priority?: string;
  importance?: string;
}): Promise<TaskActionResult<DailyTask>> {
  const user = await requireUser();
  const title = parseTitle(input.title);
  if (isActionErr(title)) return title;

  const description = parseDescription(input.description ?? "");
  if (isActionErr(description)) return description;

  const rawPriority = input.priority ?? "";
  const rawImportance = input.importance ?? "";
  const priority = isTaskPriority(rawPriority)
    ? rawPriority
    : DEFAULT_TASK_PRIORITY;
  const importance = isTaskImportance(rawImportance)
    ? rawImportance
    : DEFAULT_TASK_IMPORTANCE;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("daily_tasks")
    .insert({
      user_id: user.id,
      title,
      description,
      priority,
      importance,
    })
    .select(TASK_BOARD_COLUMNS)
    .single();

  if (error || !data) return fail(error?.message ?? "Could not create the task.");
  revalidateTasks();
  return { ok: true, data: data as DailyTask };
}

export async function updateTask(
  taskId: string,
  input: {
    title: string;
    description?: string;
    importance?: string;
  },
): Promise<TaskActionResult<DailyTask>> {
  const user = await requireUser();
  const loaded = await loadOwnedTask(taskId, user.id);
  if ("ok" in loaded) return loaded;

  const title = parseTitle(input.title);
  if (isActionErr(title)) return title;

  const description = parseDescription(input.description ?? "");
  if (isActionErr(description)) return description;

  const importanceRaw = input.importance ?? "";
  const importance: TaskImportance = isTaskImportance(importanceRaw)
    ? importanceRaw
    : loaded.task.importance;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("daily_tasks")
    .update({ title, description, importance })
    .eq("id", taskId)
    .eq("user_id", user.id)
    .select(TASK_BOARD_COLUMNS)
    .single();

  if (error || !data) return fail(error?.message ?? "Could not update the task.");
  revalidateTasks();
  return { ok: true, data: data as DailyTask };
}

export async function setTaskPriority(
  taskId: string,
  priority: TaskPriority,
): Promise<TaskActionResult<DailyTask>> {
  const user = await requireUser();
  if (!isTaskPriority(priority)) return fail("That priority is not valid.");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("daily_tasks")
    .update({ priority })
    .eq("id", taskId)
    .eq("user_id", user.id)
    .select(TASK_BOARD_COLUMNS)
    .maybeSingle();

  if (error) return fail(error.message);
  if (!data) return fail("Task not found.");
  return { ok: true, data: data as DailyTask };
}

export async function setTaskImportance(
  taskId: string,
  importance: TaskImportance,
): Promise<TaskActionResult<DailyTask>> {
  const user = await requireUser();
  if (!isTaskImportance(importance)) return fail("That importance is not valid.");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("daily_tasks")
    .update({ importance })
    .eq("id", taskId)
    .eq("user_id", user.id)
    .select(TASK_BOARD_COLUMNS)
    .maybeSingle();

  if (error) return fail(error.message);
  if (!data) return fail("Task not found.");
  return { ok: true, data: data as DailyTask };
}

export async function toggleTaskComplete(
  taskId: string,
  complete: boolean,
): Promise<TaskActionResult<DailyTask>> {
  const user = await requireUser();
  const completedAt = complete ? new Date().toISOString() : null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("daily_tasks")
    .update({ completed_at: completedAt })
    .eq("id", taskId)
    .eq("user_id", user.id)
    .select(TASK_BOARD_COLUMNS)
    .maybeSingle();

  if (error) return fail(error.message);
  if (!data) return fail("Task not found.");
  return { ok: true, data: data as DailyTask };
}

export async function deleteTask(taskId: string): Promise<TaskActionResult<null>> {
  const user = await requireUser();
  const loaded = await loadOwnedTask(taskId, user.id);
  if ("ok" in loaded) return loaded;

  const supabase = await createClient();
  const { error } = await supabase
    .from("daily_tasks")
    .delete()
    .eq("id", taskId)
    .eq("user_id", user.id);

  if (error) return fail(error.message);
  revalidateTasks();
  return { ok: true, data: null };
}

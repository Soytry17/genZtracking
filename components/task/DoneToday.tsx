"use client";

import { TaskCard } from "@/components/task/TaskCard";
import type { DailyTask } from "@/types/database";

export function DoneToday({
  tasks,
  onToggle,
  onOpen,
}: {
  tasks: DailyTask[];
  onToggle: (task: DailyTask) => void;
  onOpen: (task: DailyTask) => void;
}) {
  if (tasks.length === 0) return null;

  return (
    <details className="rounded-card glass">
      <summary className="cursor-pointer list-none px-4 py-3 text-sm text-ink-muted marker:content-none [&::-webkit-details-marker]:hidden">
        <span className="flex items-center justify-between gap-2">
          <span>Done today</span>
          <span className="tabular-nums text-ink-subtle">{tasks.length}</span>
        </span>
      </summary>
      <ul className="space-y-2 border-t border-hairline px-2 py-2">
        {tasks.map((task) => (
          <li key={task.id}>
            <TaskCard
              task={task}
              compact
              onOpen={() => onOpen(task)}
              onToggle={() => onToggle(task)}
            />
          </li>
        ))}
      </ul>
    </details>
  );
}

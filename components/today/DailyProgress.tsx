"use client";

import { ProgressRing } from "@/components/today/ProgressRing";

export function DailyProgress({
  done,
  total,
  compact = false,
}: {
  done: number;
  total: number;
  compact?: boolean;
}) {
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <section className="rounded-[1.75rem] glass px-4 py-4 sm:px-5 sm:py-5">
      <div className="flex items-center gap-4">
        <ProgressRing
          value={done}
          max={total}
          size={compact ? 84 : 96}
          stroke={9}
        />
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold tracking-tight">Daily Progress</h2>
          <p className="mt-0.5 text-sm text-ink-muted">
            {total === 0
              ? "No tasks yet today"
              : `${done} of ${total} tasks completed`}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-subtle">
            <span className="inline-flex items-center gap-1.5">
              <ChartIcon />
              {percent}% Completion
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-3.5 text-brand" fill="none" aria-hidden>
      <path
        d="M5 19V10M12 19V5M19 19v-7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

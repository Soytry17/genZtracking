"use client";

import { DayCell } from "@/components/habit/DayCell";
import { groupByMonth, weekdayIndex } from "@/lib/habits/dates";
import type { HabitDay } from "@/types/database";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function DayGrid({
  days,
  color,
  disabled,
  onSelect,
  onOpenNote,
}: {
  days: HabitDay[];
  color: string;
  disabled?: boolean;
  onSelect: (day: HabitDay) => void;
  onOpenNote: (day: HabitDay) => void;
}) {
  const months = groupByMonth(days.map((day) => day.date));
  const byDate = new Map(days.map((day) => [day.date, day]));

  return (
    <div className="space-y-8">
      {months.map((month) => {
        const pad = weekdayIndex(month.dates[0]);
        return (
          <section key={month.key} data-month className="gpu min-w-0">
            <h3 className="mb-3 text-sm font-medium text-ink-muted">
              {month.label}
            </h3>
            <div className="day-grid-scroll -mx-1 px-1 md:mx-0 md:px-0">
              <div className="day-grid">
                {WEEKDAYS.map((label) => (
                  <div
                    key={label}
                    className="pb-1 text-center text-[10px] font-medium uppercase tracking-wider text-ink-subtle"
                  >
                    <span className="md:hidden">{label[0]}</span>
                    <span className="hidden md:inline">{label}</span>
                  </div>
                ))}
                {Array.from({ length: pad }).map((_, i) => (
                  <div key={`pad-${month.key}-${i}`} />
                ))}
                {month.dates.map((date) => {
                  const day = byDate.get(date);
                  if (!day) return null;
                  return (
                    <DayCell
                      key={date}
                      day={day}
                      color={color}
                      disabled={disabled}
                      onSelect={onSelect}
                      onOpenNote={onOpenNote}
                    />
                  );
                })}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}

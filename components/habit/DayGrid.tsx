"use client";

import { useRef } from "react";

import { DayCell } from "@/components/habit/DayCell";
import { useGsap } from "@/lib/anim/gsap";
import { groupByMonth, weekdayIndex } from "@/lib/habits/dates";
import type { HabitDay } from "@/types/database";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
  const rootRef = useRef<HTMLDivElement>(null);
  const months = groupByMonth(days.map((day) => day.date));
  const byDate = new Map(days.map((day) => [day.date, day]));

  useGsap(
    rootRef,
    (gsap) => {
      gsap.from("[data-day-cell]", {
        opacity: 0,
        scale: 0.86,
        duration: 0.35,
        stagger: { each: 0.012, from: "start" },
        ease: "power2.out",
      });
      gsap.utils.toArray<HTMLElement>("[data-month]").forEach((section) => {
        gsap.from(section, {
          y: 16,
          opacity: 0.65,
          duration: 0.4,
          scrollTrigger: {
            trigger: section,
            start: "top 92%",
            toggleActions: "play none none none",
          },
        });
      });
    },
    [days.length],
  );

  return (
    <div ref={rootRef} className="space-y-8">
      {months.map((month) => {
        const pad = weekdayIndex(month.dates[0]);
        return (
          <section key={month.key} data-month>
            <h3 className="mb-3 text-sm font-medium text-ink-muted">
              {month.label}
            </h3>
            <div className="grid grid-cols-7 gap-1.5">
              {WEEKDAYS.map((label) => (
                <div
                  key={label}
                  className="pb-1 text-center text-[10px] font-medium uppercase tracking-wider text-ink-subtle"
                >
                  {label}
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
          </section>
        );
      })}
    </div>
  );
}

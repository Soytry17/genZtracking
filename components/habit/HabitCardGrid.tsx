"use client";

import { useRef, type ReactNode } from "react";

import { enterFromNear, useGsap } from "@/lib/anim";
import { cn } from "@/lib/utils";

export function HabitCardGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useGsap(
    rootRef,
    () => {
      enterFromNear("[data-habit-card]", {
        y: 14,
        opacityFrom: 0.78,
        duration: 0.4,
        stagger: 0.07,
      });
    },
    [],
  );

  return (
    <div
      ref={rootRef}
      className={cn("grid gap-4 sm:grid-cols-2", className)}
    >
      {children}
    </div>
  );
}

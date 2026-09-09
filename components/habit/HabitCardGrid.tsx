"use client";

import { useRef, type ReactNode } from "react";

import { enterFromNear, useGsap } from "@/lib/anim/gsap";
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
      className={cn("grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3", className)}
    >
      {children}
    </div>
  );
}

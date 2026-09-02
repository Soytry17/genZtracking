"use client";

import { useRef, type ReactNode } from "react";

import { enterFromNear, useGsap } from "@/lib/anim";

export function TodayList({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLUListElement>(null);

  useGsap(
    rootRef,
    () => {
      enterFromNear("[data-today-row]", {
        y: 10,
        opacityFrom: 0.8,
        duration: 0.38,
        stagger: 0.06,
      });
    },
    [],
  );

  return (
    <ul ref={rootRef} className="space-y-3">
      {children}
    </ul>
  );
}

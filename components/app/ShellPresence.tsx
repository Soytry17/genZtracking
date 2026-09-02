"use client";

import { useRef, type ReactNode } from "react";

import { enterFromNear, useGsap } from "@/lib/anim";

/** Nav / XP bar presence on first paint. */
export function ShellPresence({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useGsap(
    rootRef,
    () => {
      enterFromNear("[data-shell]", {
        y: -8,
        opacityFrom: 0.86,
        duration: 0.4,
      });
      enterFromNear("[data-slot='xp-bar']", {
        y: -4,
        opacityFrom: 0.82,
        duration: 0.36,
        delay: 0.08,
      });
    },
    [],
  );

  return <div ref={rootRef}>{children}</div>;
}

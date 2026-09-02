"use client";

import { useRef, type ReactNode } from "react";

import { enterFromNear, useGsap } from "@/lib/anim";

/** Short card + field mount for login / signup. Visible-first. */
export function AuthMount({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useGsap(
    rootRef,
    () => {
      enterFromNear("[data-auth-card]", {
        y: 14,
        opacityFrom: 0.82,
        duration: 0.42,
      });
      enterFromNear("[data-auth-field]", {
        y: 8,
        opacityFrom: 0.8,
        duration: 0.36,
        delay: 0.1,
        stagger: 0.055,
      });
    },
    [],
  );

  return (
    <div ref={rootRef} className="w-full">
      {children}
    </div>
  );
}

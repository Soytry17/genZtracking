"use client";

import { usePathname } from "next/navigation";
import { useRef, type ReactNode } from "react";

import { enterFromNear, useGsap } from "@/lib/anim";

/**
 * Soft fade/slide on app route changes. Children stay RSC — this only
 * wraps the already-rendered tree.
 */
export function PageEnter({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);

  useGsap(
    rootRef,
    () => {
      if (!rootRef.current) return;
      enterFromNear(rootRef.current, {
        y: 8,
        opacityFrom: 0.88,
        duration: 0.34,
      });
    },
    [pathname],
  );

  return <div ref={rootRef}>{children}</div>;
}

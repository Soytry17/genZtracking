"use client";

import { useLayoutEffect, useRef, useState } from "react";

import { animateTick, animateTickOut, killAnime } from "@/lib/anim/anime";
import { cn } from "@/lib/utils";

export function CheckIcon({
  active,
  className,
}: {
  active: boolean;
  className?: string;
}) {
  const wrapRef = useRef<HTMLSpanElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const wasActive = useRef(active);
  const [shown, setShown] = useState(active);

  if (active && !shown) setShown(true);

  useLayoutEffect(() => {
    const prev = wasActive.current;
    wasActive.current = active;

    if (active && !prev) {
      const anim = animateTick(pathRef.current, wrapRef.current);
      return () => killAnime(anim);
    }

    if (!active && prev) {
      const anim = animateTickOut(pathRef.current, wrapRef.current, () => {
        setShown(false);
      });
      return () => killAnime(anim);
    }
  }, [active]);

  if (!active && !shown) return null;

  return (
    <span
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
      aria-hidden
    >
      <span
        ref={wrapRef}
        className={cn("inline-flex origin-center items-center justify-center", className)}
      >
        <svg viewBox="0 0 24 24" className="size-full overflow-visible">
          <path
            ref={pathRef}
            d="M5 12.5 9.5 17 19 7"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </span>
  );
}

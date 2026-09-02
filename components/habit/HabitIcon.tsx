import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { HabitIcon as HabitIconKey } from "@/lib/habits/constants";

const iconProps = {
  "aria-hidden": true,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const PATHS: Record<string, ReactNode> = {
  sparkles: (
    <>
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
      <path d="m6.5 6.5 2 2M15.5 15.5l2 2M17.5 6.5l-2 2M8.5 15.5l-2 2" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5Z" />
      <path d="M4 5.5v16" />
    </>
  ),
  lotus: (
    <>
      <path d="M12 20s-7-4-7-10 4-6 7-2c3-4 7-2 7 2s-7 10-7 10Z" />
      <path d="M12 20V10" />
    </>
  ),
  notebook: (
    <>
      <rect x="6" y="3" width="13" height="18" rx="2" />
      <path d="M10 7h5M10 11h5M10 15h3M6 8H4M6 12H4M6 16H4" />
    </>
  ),
  dumbbell: (
    <>
      <path d="M6 9v6M18 9v6M6 12h12M4 10v4M20 10v4" />
    </>
  ),
  footprints: (
    <>
      <ellipse cx="8" cy="9" rx="2" ry="3" />
      <ellipse cx="16" cy="15" rx="2" ry="3" />
    </>
  ),
  stretch: (
    <>
      <circle cx="12" cy="5" r="2" />
      <path d="M8 22l4-8 4 8M6 12h12" />
    </>
  ),
  droplet: <path d="M12 3s6 7 6 11a6 6 0 1 1-12 0c0-4 6-11 6-11Z" />,
  moon: <path d="M20 14.5A8 8 0 1 1 10 4a7 7 0 0 0 10 10.5Z" />,
  "phone-off": (
    <>
      <rect x="7" y="3" width="10" height="18" rx="2" />
      <path d="m5 5 14 14" />
    </>
  ),
  code: (
    <>
      <path d="m8 8-4 4 4 4M16 8l4 4-4 4" />
    </>
  ),
  languages: (
    <>
      <path d="M4 6h10M9 6c0 8-5 12-5 12M14 6c-1 6-5 12-8 14" />
      <path d="M12 18h8M16 18l3 4" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  broom: (
    <>
      <path d="M8 21h8M12 21V9M7 9h10l-1.5-5h-7Z" />
    </>
  ),
  pencil: (
    <>
      <path d="M4 20h4L19 9l-4-4L4 16v4Z" />
      <path d="m12 8 4 4" />
    </>
  ),
  music: (
    <>
      <path d="M9 18V6l10-2v12" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="16" r="2" />
    </>
  ),
  seedling: (
    <>
      <path d="M12 22V11" />
      <path d="M12 11c0-5 5-7 8-7-1 5-5 7-8 7Z" />
      <path d="M12 14c0-4-4-6-7-6 1 4 4 6 7 6Z" />
    </>
  ),
  flame: (
    <path d="M12 3c2 4-2 5-1 9 4-2 6 1 6 5a5 5 0 1 1-10 0c0-4 3-6 5-14Z" />
  ),
  sprout: (
    <>
      <path d="M12 22V12" />
      <path d="M12 12c-4-1-6-5-6-8 5 0 6 4 6 8Z" />
      <path d="M12 14c4-1 6-4 7-8-4 0-6 4-7 8Z" />
    </>
  ),
  brain: (
    <>
      <path d="M9 6a3 3 0 0 1 6 0 3 3 0 0 1 3 3c0 1.5-1 2-1 3s1 1.5 1 3a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3c0-1.5 1-2 1-3S6 10.5 6 9a3 3 0 0 1 3-3Z" />
      <path d="M12 6v12" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 5h8v5a4 4 0 0 1-8 0V5Z" />
      <path d="M8 7H5a3 3 0 0 0 3 4M16 7h3a3 3 0 0 1-3 4" />
      <path d="M12 14v3M9 21h6M10 21v-4h4v4" />
    </>
  ),
  medal: (
    <>
      <circle cx="12" cy="14" r="5" />
      <path d="m8 4 4 5 4-5" />
    </>
  ),
  snowflake: (
    <>
      <path d="M12 3v18M4.5 7.5l15 9M4.5 16.5l15-9" />
      <path d="m8 5 4 2 4-2M8 19l4-2 4 2" />
    </>
  ),
};

export function HabitIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <svg {...iconProps} className={cn("size-5", className)}>
      {PATHS[name] ?? PATHS.sparkles}
    </svg>
  );
}

export type { HabitIconKey };

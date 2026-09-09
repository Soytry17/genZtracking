import type { ReactNode } from "react";

import { ROUTES } from "@/lib/habits/constants";

export type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  primary?: boolean;
};

const iconProps = {
  "aria-hidden": true,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  className: "size-5 shrink-0",
} as const;

/** Single source of truth for the authenticated nav, used by sidebar and tab bar. */
export const NAV_ITEMS: NavItem[] = [
  {
    href: ROUTES.today,
    label: "Today",
    primary: true,
    icon: (
      <svg {...iconProps}>
        <path d="M3 10.5 12 4l9 6.5" />
        <path d="M5 10v9a1 1 0 0 0 1 1h4.5v-5h3v5H18a1 1 0 0 0 1-1v-9" />
      </svg>
    ),
  },
  {
    href: ROUTES.habits,
    label: "Habits",
    icon: (
      <svg {...iconProps}>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="3" />
        <path d="M12 4v2.5M12 17.5V20M4 12h2.5M17.5 12H20" />
      </svg>
    ),
  },
  {
    href: ROUTES.archive,
    label: "Archive",
    icon: (
      <svg {...iconProps}>
        <path d="M3 7h18v3H3z" />
        <path d="M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9" />
        <path d="M10 14h4" />
      </svg>
    ),
  },
  {
    href: ROUTES.profile,
    label: "Profile",
    icon: (
      <svg {...iconProps}>
        <circle cx="12" cy="8.5" r="3.5" />
        <path d="M5 20c0-3.3 3.1-5.5 7-5.5s7 2.2 7 5.5" />
      </svg>
    ),
  },
];

export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

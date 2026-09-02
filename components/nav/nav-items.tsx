import type { ReactNode } from "react";

import { ROUTES } from "@/lib/habits/constants";

export type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
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

/** Single source of truth for the authenticated nav, used by header and tab bar. */
export const NAV_ITEMS: NavItem[] = [
  {
    href: ROUTES.today,
    label: "Today",
    icon: (
      <svg {...iconProps}>
        <path d="M9 12.5l2 2 4.5-4.5" />
        <rect x="3" y="4.5" width="18" height="16" rx="3" />
        <path d="M8 3v3M16 3v3" />
      </svg>
    ),
  },
  {
    href: ROUTES.habits,
    label: "Habits",
    icon: (
      <svg {...iconProps}>
        <rect x="3" y="3" width="7.5" height="7.5" rx="2" />
        <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" />
        <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" />
        <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" />
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

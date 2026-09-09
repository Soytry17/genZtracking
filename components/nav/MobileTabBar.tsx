"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";

import { isNavItemActive, NAV_ITEMS } from "@/components/nav/nav-items";
import { enterFromNear, useGsap } from "@/lib/anim/gsap";
import { cn } from "@/lib/utils";

/** Floating glass tab bar, shown only below `md`. */
export function MobileTabBar() {
  const pathname = usePathname();
  const rootRef = useRef<HTMLElement>(null);

  useGsap(
    rootRef,
    () => {
      if (!rootRef.current) return;
      enterFromNear(rootRef.current, {
        y: 10,
        opacityFrom: 0.86,
        duration: 0.4,
      });
    },
    [],
  );

  return (
    <nav
      ref={rootRef}
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 px-app pt-2 pb-[max(0.5rem,var(--safe-bottom))] md:hidden"
    >
      <ul className="glass-strong mx-auto flex max-w-md items-stretch justify-between rounded-[1.75rem] px-1.5 py-1.5">
        {NAV_ITEMS.map((item) => {
          const active = isNavItemActive(pathname, item.href);
          return (
            <li key={item.href} className="min-w-0 flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1.5 text-[11px] transition-colors",
                  item.primary ? "font-semibold" : "font-medium",
                  active
                    ? "text-brand [filter:drop-shadow(0_6px_10px_color-mix(in_oklab,var(--t-brand)_55%,transparent))]"
                    : item.primary
                      ? "text-ink hover:text-ink"
                      : "text-ink-subtle hover:text-ink",
                )}
              >
                {item.icon}
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

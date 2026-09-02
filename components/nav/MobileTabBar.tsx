"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";

import { isNavItemActive, NAV_ITEMS } from "@/components/nav/nav-items";
import { enterFromNear, useGsap } from "@/lib/anim";
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
      className="fixed inset-x-3 bottom-3 z-40 md:hidden"
    >
      <ul className="glass-strong mx-auto flex max-w-md items-stretch justify-between rounded-full px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
        {NAV_ITEMS.map((item) => {
          const active = isNavItemActive(pathname, item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-full px-2 py-2 text-[11px] font-medium transition-colors",
                  active
                    ? "bg-brand-soft text-brand"
                    : "text-ink-subtle hover:text-ink",
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

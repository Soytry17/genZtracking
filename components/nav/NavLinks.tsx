"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { isNavItemActive, NAV_ITEMS } from "@/components/nav/nav-items";
import { cn } from "@/lib/utils";

/** Desktop nav. Hidden below `md`, where MobileTabBar takes over. */
export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className="hidden items-center gap-0.5 md:flex">
      {NAV_ITEMS.map((item) => {
        const active = isNavItemActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-full px-2.5 py-1.5 text-sm transition-colors lg:px-3",
              item.primary ? "font-semibold" : "font-medium",
              active
                ? "bg-brand-soft text-brand"
                : item.primary
                  ? "text-ink hover:bg-glass"
                  : "text-ink-muted hover:bg-glass hover:text-ink",
            )}
          >
            {item.icon}
            <span className="sr-only lg:not-sr-only">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { isNavItemActive, NAV_ITEMS } from "@/components/nav/nav-items";
import { cn } from "@/lib/utils";

/** Desktop sidebar nav. Hidden below `md`, where MobileTabBar takes over. */
export function NavLinks({
  orientation = "vertical",
}: {
  orientation?: "horizontal" | "vertical";
}) {
  const pathname = usePathname();
  const vertical = orientation === "vertical";

  return (
    <nav
      aria-label="Main"
      className={cn(
        vertical ? "flex flex-col gap-1" : "hidden items-center gap-0.5 md:flex",
      )}
    >
      {NAV_ITEMS.map((item) => {
        const active = isNavItemActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-full text-sm transition-colors",
              vertical ? "px-3 py-2.5" : "px-2.5 py-1.5 lg:px-3",
              item.primary ? "font-semibold" : "font-medium",
              active
                ? "bg-brand text-brand-ink shadow-[0_10px_24px_-12px_var(--t-brand)]"
                : item.primary
                  ? "text-ink hover:bg-glass"
                  : "text-ink-muted hover:bg-glass hover:text-ink",
            )}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

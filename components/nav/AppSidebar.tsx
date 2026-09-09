"use client";

import { FreezeTokens } from "@/components/gamify/FreezeTokens";
import { useGamify } from "@/components/gamify/GamifyProvider";
import { BrandMark } from "@/components/nav/BrandMark";
import { NavLinks } from "@/components/nav/NavLinks";

export function AppSidebar({ name }: { name: string }) {
  const { freezeTokens } = useGamify();

  return (
    <aside
      data-shell
      className="fixed inset-y-0 left-0 z-40 hidden w-[var(--app-sidebar)] flex-col border-r border-hairline bg-[color-mix(in_oklab,var(--t-canvas)_88%,transparent)] px-4 py-5 md:flex"
    >
      <BrandMark showTagline />

      <div className="mt-8 min-h-0 flex-1">
        <NavLinks orientation="vertical" />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 rounded-2xl glass px-3 py-2.5">
          <span className="truncate text-xs text-ink-muted">{name}</span>
          <FreezeTokens count={freezeTokens} />
        </div>
        <p className="flex items-start gap-2 px-1 text-[11px] leading-relaxed text-ink-subtle">
          <SparklesIcon />
          <span>Small steps, deep changes.</span>
        </p>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="w-full rounded-full px-3 py-2 text-left text-sm text-ink-subtle transition-colors hover:bg-glass hover:text-ink"
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}

function SparklesIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="mt-0.5 size-3.5 shrink-0 text-brand"
      fill="none"
      aria-hidden
    >
      <path
        d="M12 3v3M12 18v3M3 12h3M18 12h3M6.5 6.5l2 2M15.5 15.5l2 2M17.5 6.5l-2 2M8.5 15.5l-2 2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

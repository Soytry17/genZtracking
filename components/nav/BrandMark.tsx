import Link from "next/link";

import { ROUTES } from "@/lib/habits/constants";
import { cn } from "@/lib/utils";

export function BrandMark({
  href = ROUTES.today,
  showTagline = false,
  compact = false,
  className,
}: {
  href?: string;
  showTagline?: boolean;
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn("flex min-w-0 items-center gap-2.5", className)}
    >
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand",
          compact ? "size-9" : "size-10",
        )}
        aria-hidden
      >
        <WaveIcon className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold tracking-tight text-ink">
          genZ<span className="text-brand">tracking</span>
        </span>
        {showTagline ? (
          <span className="mt-0.5 block truncate text-[11px] text-ink-subtle">
            Better Habits. Bigger You.
          </span>
        ) : null}
      </span>
    </Link>
  );
}

function WaveIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path
        d="M3 12c1.6-3.4 2.7-5 4.2-5 2.2 0 2.6 6 4.8 6s2.6-6 4.8-6c1.5 0 2.6 1.6 4.2 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

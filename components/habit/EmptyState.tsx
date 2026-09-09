import Link from "next/link";

import { buttonClassName } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  body,
  action,
  className,
}: {
  title: string;
  body?: string;
  action?: { href: string; label: string };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-panel glass px-4 py-12 text-center sm:px-6 sm:py-14",
        className,
      )}
    >
      <p className="text-base font-semibold tracking-tight text-ink">{title}</p>
      {body ? (
        <p className="mt-2 max-w-sm text-sm text-ink-muted">{body}</p>
      ) : null}
      {action ? (
        <Link
          href={action.href}
          className={buttonClassName({ className: "mt-6 min-h-11" })}
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-2xl bg-glass", className)}
      aria-hidden
    />
  );
}

export function HabitCardSkeleton() {
  return (
    <div className="rounded-card glass p-6">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-3 h-6 w-40" />
      <Skeleton className="mt-6 h-2 w-full" />
    </div>
  );
}

export function DayGridSkeleton() {
  return (
    <div className="day-grid-scroll">
      <div className="day-grid">
        {Array.from({ length: 28 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square min-h-11 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

import Link from "next/link";

import { buttonClassName } from "@/components/ui";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  body,
  action,
  className,
}: {
  title: string;
  body: string;
  action?: { href: string; label: string };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-panel border border-dashed border-line-strong bg-surface/50 px-6 py-14 text-center",
        className,
      )}
    >
      <p className="text-base font-semibold text-ink">{title}</p>
      <p className="mt-2 max-w-sm text-sm text-ink-muted">{body}</p>
      {action ? (
        <Link
          href={action.href}
          className={buttonClassName({ className: "mt-6" })}
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
      className={cn("animate-pulse rounded-xl bg-surface-3", className)}
      aria-hidden
    />
  );
}

export function HabitCardSkeleton() {
  return (
    <div className="rounded-card border border-line bg-surface p-5">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-3 h-6 w-40" />
      <Skeleton className="mt-6 h-2 w-full" />
    </div>
  );
}

export function DayGridSkeleton() {
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {Array.from({ length: 28 }).map((_, i) => (
        <Skeleton key={i} className="aspect-square" />
      ))}
    </div>
  );
}

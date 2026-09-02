import { cn } from "@/lib/utils";

export function StreakBadge({
  current,
  longest,
  size = "md",
  className,
}: {
  current: number;
  longest?: number;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-warning-soft font-medium text-streak",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        className,
      )}
      title={longest != null ? `Longest streak: ${longest}` : undefined}
    >
      <span aria-hidden>🔥</span>
      {current}
      {size === "md" ? <span className="text-ink-subtle">day streak</span> : null}
    </span>
  );
}

import { HabitIcon } from "@/components/habit/HabitIcon";
import { cn } from "@/lib/utils";

/** True when `icon` is a named SVG key (habit icons, seeded badges). */
export function isNamedIcon(icon: string): boolean {
  return /^[a-z0-9-]+$/i.test(icon);
}

export function GoalBadgeIcon({
  icon,
  className,
}: {
  icon: string;
  className?: string;
}) {
  if (isNamedIcon(icon)) {
    return <HabitIcon name={icon} className={className} />;
  }

  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex items-center justify-center text-2xl leading-none",
        className,
      )}
    >
      {icon}
    </span>
  );
}

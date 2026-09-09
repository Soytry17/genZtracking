import { GoalBadgeIcon } from "@/components/habit/GoalBadgeIcon";
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { GoalBadge } from "@/types/database";

export function GoalBadgeGrid({ badges }: { badges: GoalBadge[] }) {
  const earned = badges.filter((badge) => badge.awarded_at);

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Goals</CardTitle>
        <CardDescription>
          {badges.length === 0
            ? "Attach a badge when you create a habit, then complete the range to unlock it."
            : `${earned.length} of ${badges.length} unlocked`}
        </CardDescription>
      </CardHeader>
      <CardBody>
        {badges.length === 0 ? (
          <p className="text-sm text-ink-muted">
            Personal trophies live here — one per habit you decide is worth a
            badge.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {badges.map((badge) => {
              const got = Boolean(badge.awarded_at);
              return (
                <li
                  key={badge.id}
                  className={cn(
                    "min-w-0 rounded-2xl glass-thin p-3",
                    !got && "opacity-45",
                  )}
                >
                  <div className="flex size-9 items-center justify-center rounded-full bg-brand-soft text-brand">
                    <GoalBadgeIcon icon={badge.icon} />
                  </div>
                  <p className="mt-2 truncate text-sm font-medium text-ink">{badge.title}</p>
                  {badge.description ? (
                    <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                      {badge.description}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

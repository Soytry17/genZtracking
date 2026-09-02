import { HabitIcon } from "@/components/habit/HabitIcon";
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Badge, UserBadgeWithBadge } from "@/types/database";

export function BadgeGrid({
  badges,
  earned,
}: {
  badges: Badge[];
  earned: UserBadgeWithBadge[];
}) {
  const earnedById = new Map(earned.map((row) => [row.badge_id, row]));

  if (badges.length === 0) {
    return (
      <Card>
        <CardBody className="text-sm text-ink-muted">
          Badges will show up here once the catalog is seeded.
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Badges</CardTitle>
        <CardDescription>
          {earned.length} of {badges.length} unlocked
        </CardDescription>
      </CardHeader>
      <CardBody>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {badges.map((badge) => {
            const got = earnedById.get(badge.id);
            return (
              <li
                key={badge.id}
                className={cn(
                  "rounded-2xl glass-thin p-3",
                  !got && "opacity-45",
                )}
              >
                <div className="flex size-9 items-center justify-center rounded-full bg-brand-soft text-brand">
                  <HabitIcon name={badge.icon} />
                </div>
                <p className="mt-2 text-sm font-medium text-ink">{badge.name}</p>
                <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                  {badge.description}
                </p>
              </li>
            );
          })}
        </ul>
      </CardBody>
    </Card>
  );
}

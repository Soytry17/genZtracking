import { HabitCardSkeleton } from "@/components/habit/EmptyState";

export default function Loading() {
  return (
    <div className="space-y-4">
      <HabitCardSkeleton />
      <HabitCardSkeleton />
    </div>
  );
}

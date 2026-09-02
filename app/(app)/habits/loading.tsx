import { HabitCardSkeleton } from "@/components/habit/EmptyState";

export default function Loading() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <HabitCardSkeleton />
      <HabitCardSkeleton />
      <HabitCardSkeleton />
    </div>
  );
}

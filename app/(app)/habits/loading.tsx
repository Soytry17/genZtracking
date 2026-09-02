import { HabitCardSkeleton } from "@/components/habit/EmptyState";

export default function Loading() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <HabitCardSkeleton />
      <HabitCardSkeleton />
      <HabitCardSkeleton />
    </div>
  );
}

import { EmptyState, HabitCardSkeleton } from "@/components/habit/EmptyState";

export default function Loading() {
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <HabitCardSkeleton />
      <HabitCardSkeleton />
    </div>
  );
}

export function EmptyFallback(props: {
  title: string;
  body: string;
}) {
  return <EmptyState {...props} />;
}

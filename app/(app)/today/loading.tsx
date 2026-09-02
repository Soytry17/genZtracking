import { EmptyState, HabitCardSkeleton } from "@/components/habit/EmptyState";

export default function Loading() {
  return (
    <div className="space-y-4">
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

import { DayGridSkeleton, Skeleton } from "@/components/habit/EmptyState";

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-full max-w-md" />
      <Skeleton className="h-2 w-full" />
      <DayGridSkeleton />
    </div>
  );
}

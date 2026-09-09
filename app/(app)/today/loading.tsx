import { Skeleton } from "@/components/habit/EmptyState";

export default function Loading() {
  return (
    <div className="space-y-6 lg:grid lg:grid-cols-[minmax(0,1fr)_var(--app-overview)] lg:gap-4">
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex items-center gap-4 rounded-[1.75rem] glass p-5">
          <Skeleton className="size-24 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-5 w-24" />
          <TodayRowSkeleton />
          <TodayRowSkeleton />
          <TodayRowSkeleton />
        </div>
      </div>
      <div className="hidden space-y-4 lg:block">
        <Skeleton className="h-64 w-full rounded-[1.75rem]" />
        <Skeleton className="h-40 w-full rounded-[1.75rem]" />
      </div>
    </div>
  );
}

function TodayRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-[1.35rem] glass px-3 py-3.5 sm:px-5 sm:py-4">
      <Skeleton className="size-11 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

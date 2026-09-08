import { Skeleton } from "@/components/habit/EmptyState";

export default function Loading() {
  return (
    <div className="mx-auto w-full space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-24" />
      </div>

      <div className="flex gap-3 overflow-hidden md:grid md:grid-cols-4">
        <ColumnSkeleton />
        <ColumnSkeleton />
        <ColumnSkeleton className="hidden md:block" />
        <ColumnSkeleton className="hidden md:block" />
      </div>

      <div className="mx-auto w-full max-w-xl space-y-3">
        <Skeleton className="h-4 w-20" />
        <TodayRowSkeleton />
        <TodayRowSkeleton />
        <TodayRowSkeleton />
      </div>
    </div>
  );
}

function ColumnSkeleton({ className }: { className?: string }) {
  return (
    <div className={`min-h-44 w-[min(82vw,19rem)] shrink-0 rounded-card glass p-3 md:w-auto ${className ?? ""}`}>
      <Skeleton className="h-4 w-16" />
      <Skeleton className="mt-3 h-14 w-full" />
      <Skeleton className="mt-2 h-14 w-full" />
    </div>
  );
}

function TodayRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-card glass px-3 py-3.5 sm:px-5 sm:py-4">
      <Skeleton className="size-11 shrink-0 rounded-2xl sm:size-12" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="size-14 shrink-0 rounded-2xl sm:size-12" />
    </div>
  );
}

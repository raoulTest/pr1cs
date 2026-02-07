/**
 * Notification Skeleton Components
 * Loading states for notification UI
 */
import { Skeleton } from "@/components/ui/skeleton";

export function NotificationSkeleton() {
  return (
    <div className="flex gap-3 p-3">
      <Skeleton className="size-8 shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-2 w-16" />
      </div>
    </div>
  );
}

export function NotificationListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: count }).map((_, i) => (
        <NotificationSkeleton key={i} />
      ))}
    </div>
  );
}

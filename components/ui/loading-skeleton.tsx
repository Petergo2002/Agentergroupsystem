import { cn } from "@/lib/utils";

const SKELETON_KEYS = [
  "skeleton-1",
  "skeleton-2",
  "skeleton-3",
  "skeleton-4",
  "skeleton-5",
  "skeleton-6",
  "skeleton-7",
  "skeleton-8",
  "skeleton-9",
  "skeleton-10",
];

interface LoadingSkeletonProps {
  className?: string;
  variant?: "card" | "text" | "circle" | "button";
  count?: number;
}

export function LoadingSkeleton({
  className,
  variant = "text",
  count = 1,
}: LoadingSkeletonProps) {
  const baseClasses = "animate-pulse bg-gray-200 rounded";

  const variantClasses = {
    card: "h-32 w-full",
    text: "h-4 w-full",
    circle: "h-12 w-12 rounded-full",
    button: "h-10 w-24",
  };

  const items = SKELETON_KEYS.slice(0, count).map((key) => (
    <div
      key={key}
      className={cn(baseClasses, variantClasses[variant], className)}
    />
  ));

  if (count <= 1) {
    return (
      items[0] ?? (
        <div className={cn(baseClasses, variantClasses[variant], className)} />
      )
    );
  }

  return <div className="space-y-3">{items}</div>;
}

// Specific skeleton components for common use cases
export function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <LoadingSkeleton className="h-8 w-64" />
        <LoadingSkeleton className="h-4 w-96" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <LoadingSkeleton variant="card" count={4} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LoadingSkeleton className="h-96" />
        <LoadingSkeleton className="h-96" />
      </div>
    </div>
  );
}

export function ContactsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <LoadingSkeleton className="h-8 w-48" />
          <LoadingSkeleton className="h-4 w-64" />
        </div>
        <LoadingSkeleton variant="button" />
      </div>

      <LoadingSkeleton className="h-10 w-full" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <LoadingSkeleton variant="card" count={3} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <LoadingSkeleton className="h-48" count={6} />
      </div>
    </div>
  );
}

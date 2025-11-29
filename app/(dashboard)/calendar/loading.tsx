import { Skeleton } from "@/components/ui/skeleton";

const DAY_SKELETON_KEYS = Array.from(
  { length: 7 },
  (_unused, index) => `day-${index + 1}`,
);

const CELL_SKELETON_KEYS = Array.from(
  { length: 35 },
  (_unused, index) => `cell-${index + 1}`,
);

export default function CalendarLoading() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {DAY_SKELETON_KEYS.map((key) => (
          <Skeleton key={key} className="h-8 w-full" />
        ))}
        {CELL_SKELETON_KEYS.map((key) => (
          <Skeleton key={key} className="h-24 w-full" />
        ))}
      </div>
    </div>
  );
}

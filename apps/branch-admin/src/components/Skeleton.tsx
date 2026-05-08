import { cn } from '@/lib/cn';

/**
 * Generic shimmer placeholder. Use as `<Skeleton className="h-4 w-32" />`
 * for inline blocks, or `<Skeleton.Chart />` for the charts dynamic-import
 * fallback.
 */
export default function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse bg-brand-cream/60 rounded', className)}
    />
  );
}

Skeleton.Chart = function ChartSkeleton() {
  return (
    <div className="h-60 flex flex-col gap-3" aria-busy="true" aria-label="Đang tải biểu đồ">
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="flex-1 w-full" />
    </div>
  );
};

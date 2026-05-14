export type DashboardSkeletonVariant = 'full' | 'region'

export interface DashboardSkeletonProps {
  variant?: DashboardSkeletonVariant
}

function ShimmerBlock({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-2xl bg-[var(--db-border-default)] animate-pulse ${className}`} />
  )
}

/** Skeleton for a single region (4-col KPI row + chart) */
function RegionSkeleton() {
  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <div className="w-1 h-6 rounded-full bg-[var(--db-border-default)] animate-pulse" />
        <div className="h-3 w-32 rounded bg-[var(--db-border-default)] animate-pulse" />
      </div>
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ShimmerBlock className="h-32" />
        <ShimmerBlock className="h-32" />
        <ShimmerBlock className="h-32" />
        <ShimmerBlock className="h-32" />
      </div>
    </div>
  )
}

/**
 * Skeleton de chargement du dashboard.
 * - 'full' : reproduit la structure bento complete (bande superieure + 4 regions)
 * - 'region' : une seule region (KPI row)
 */
export function DashboardSkeleton({ variant = 'full' }: DashboardSkeletonProps) {
  if (variant === 'region') {
    return <RegionSkeleton />
  }

  return (
    <div className="space-y-8 p-6">
      {/* Band superieure — hero header */}
      <ShimmerBlock className="h-24" />

      {/* KPI band — 6 KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <ShimmerBlock key={i} className="h-24" />
        ))}
      </div>

      {/* Alert bar */}
      <div className="flex gap-2">
        <ShimmerBlock className="h-10 w-48" />
        <ShimmerBlock className="h-10 w-40" />
      </div>

      {/* Region Operations */}
      <RegionSkeleton />

      {/* Region QSHE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <ShimmerBlock className="lg:col-span-2 h-72" />
        <ShimmerBlock className="h-72" />
      </div>

      {/* Region Qualite + Finances */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ShimmerBlock className="h-40" />
        <ShimmerBlock className="h-40" />
        <ShimmerBlock className="h-40" />
        <ShimmerBlock className="h-40" />
      </div>
    </div>
  )
}

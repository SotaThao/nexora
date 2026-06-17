import Skeleton from '../../ui/skeleton/Skeleton'
import { SkeletonKpiCard, SkeletonList } from '../../ui/skeleton'
import Panel from '../../ui/Panel'

export default function OverviewSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading dashboard overview">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton width={220} height={24} borderRadius={8} />
        <Skeleton width={248} height={40} borderRadius={8} />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <SkeletonKpiCard key={index} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(340px,1fr)]">
        <Panel className="p-7">
          <div className="flex items-center justify-between gap-4">
            <Skeleton width="38%" height={16} borderRadius={6} />
            <Skeleton width={280} height={32} borderRadius={8} />
          </div>
          <Skeleton height={288} className="mt-8 w-full" borderRadius={12} />
        </Panel>

        <Panel className="p-7">
          <Skeleton width="42%" height={16} borderRadius={6} />
          <SkeletonList count={4} showAvatar lines={1} className="mt-7" />
        </Panel>
      </div>

      <Panel className="p-7">
        <Skeleton width="36%" height={16} borderRadius={6} />
        <Skeleton width="55%" height={12} className="mt-2" borderRadius={6} />
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <Skeleton height={196} borderRadius={12} />
          <Skeleton height={196} borderRadius={12} />
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <SkeletonKpiCard key={index} />
        ))}
      </div>
    </div>
  )
}

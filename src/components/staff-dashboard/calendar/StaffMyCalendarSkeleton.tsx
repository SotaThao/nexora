import { Skeleton } from '../../ui/skeleton'
import { STAFF_CALENDAR_LAYOUT_CLASS, STAFF_CALENDAR_SKELETON_COUNT } from './constants'

export default function StaffMyCalendarSkeleton() {
  return (
    <div className={STAFF_CALENDAR_LAYOUT_CLASS.list} role="status" aria-busy="true">
      {Array.from({ length: STAFF_CALENDAR_SKELETON_COUNT }, (_, index) => (
        <div key={index} className={STAFF_CALENDAR_LAYOUT_CLASS.row} aria-hidden="true">
          <span className={STAFF_CALENDAR_LAYOUT_CLASS.time}>
            <Skeleton width={40} height={12} borderRadius={6} />
          </span>
          <span className={STAFF_CALENDAR_LAYOUT_CLASS.card}>
            <span className={STAFF_CALENDAR_LAYOUT_CLASS.copy}>
              <Skeleton width="68%" height={14} borderRadius={6} />
              <Skeleton width="52%" height={11} borderRadius={6} className="mt-2" />
            </span>
            <Skeleton width={64} height={20} borderRadius={999} />
          </span>
        </div>
      ))}
    </div>
  )
}

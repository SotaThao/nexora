import { Skeleton } from '../../ui/skeleton'
import {
  WORK_ORDER_FILTER_TABS,
  WORK_ORDER_SKELETON_COUNT,
  WORK_ORDERS_LAYOUT_CLASS,
} from './constants'

export function WorkOrderSalonPickerSkeleton() {
  return (
    <div role="status" aria-busy="true">
      <Skeleton width={120} height={14} borderRadius={6} />
      <Skeleton width="55%" height={28} borderRadius={8} className={WORK_ORDERS_LAYOUT_CLASS.skeletonMt3} />
      <Skeleton width="75%" height={14} borderRadius={6} className={WORK_ORDERS_LAYOUT_CLASS.skeletonMt2} />
      <div className={WORK_ORDERS_LAYOUT_CLASS.list}>
        {Array.from({ length: WORK_ORDER_SKELETON_COUNT.salons }, (_, index) => (
          <div key={index} className={WORK_ORDERS_LAYOUT_CLASS.card} aria-hidden="true">
            <Skeleton width={40} height={40} borderRadius={12} />
            <div className={WORK_ORDERS_LAYOUT_CLASS.grow}>
              <Skeleton width="50%" height={16} borderRadius={6} />
              <Skeleton width="70%" height={12} borderRadius={6} className={WORK_ORDERS_LAYOUT_CLASS.skeletonMt2} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function WorkOrderTicketsSkeleton() {
  return (
    <div role="status" aria-busy="true">
      <div className={WORK_ORDERS_LAYOUT_CLASS.ticketsTitleRow}>
        <Skeleton width={180} height={28} borderRadius={8} />
        <Skeleton circle width={32} height={32} />
      </div>
      <Skeleton width={140} height={16} borderRadius={6} className={WORK_ORDERS_LAYOUT_CLASS.skeletonMt2} />
      <div className={WORK_ORDERS_LAYOUT_CLASS.filterBar}>
        <div className={WORK_ORDERS_LAYOUT_CLASS.dateNav}>
          <div className={WORK_ORDERS_LAYOUT_CLASS.dateNavRow}>
            <Skeleton circle width={40} height={40} />
            <Skeleton width={96} height={18} borderRadius={6} />
            <Skeleton circle width={40} height={40} />
          </div>
          <Skeleton width={64} height={40} borderRadius={10} />
        </div>
        <div className={WORK_ORDERS_LAYOUT_CLASS.statusTabs}>
          {Array.from({ length: WORK_ORDER_FILTER_TABS.length }, (_, index) => (
            <Skeleton key={index} width={96} height={36} borderRadius={999} />
          ))}
        </div>
      </div>
      <Skeleton
        width="100%"
        height={168}
        borderRadius={22}
        className={WORK_ORDERS_LAYOUT_CLASS.featuredSlot}
      />
      <WorkOrderTicketListSkeleton />
    </div>
  )
}

export function WorkOrderTicketListSkeleton() {
  return (
    <div className={WORK_ORDERS_LAYOUT_CLASS.ticketList} role="status" aria-busy="true">
      {Array.from({ length: WORK_ORDER_SKELETON_COUNT.tickets }, (_, index) => (
        <WorkOrderTicketCardSkeleton key={index} />
      ))}
    </div>
  )
}

export function WorkOrderDetailSkeleton() {
  return (
    <div className={WORK_ORDERS_LAYOUT_CLASS.detailPage} role="status" aria-busy="true">
      <div className={WORK_ORDERS_LAYOUT_CLASS.detailHeader}>
        <div className={WORK_ORDERS_LAYOUT_CLASS.detailHeadMain}>
          <Skeleton circle width={30} height={30} />
          <div className={WORK_ORDERS_LAYOUT_CLASS.detailTitleWrap}>
            <Skeleton width={120} height={18} borderRadius={6} />
            <Skeleton width={72} height={12} borderRadius={6} className={WORK_ORDERS_LAYOUT_CLASS.skeletonMt2} />
          </div>
        </div>
        <Skeleton width={72} height={24} borderRadius={999} />
      </div>
      <div className={WORK_ORDERS_LAYOUT_CLASS.detailBody}>
        <div className={WORK_ORDERS_LAYOUT_CLASS.customerCard}>
          <div className={WORK_ORDERS_LAYOUT_CLASS.customerRow}>
            <Skeleton circle width={48} height={48} />
            <div className={WORK_ORDERS_LAYOUT_CLASS.grow}>
              <Skeleton width={72} height={12} borderRadius={6} />
              <Skeleton width="55%" height={22} borderRadius={6} className={WORK_ORDERS_LAYOUT_CLASS.skeletonMt2} />
              <div className={WORK_ORDERS_LAYOUT_CLASS.skeletonGapRow}>
                {Array.from({ length: WORK_ORDER_SKELETON_COUNT.detailMetaChips }, (_, index) => (
                  <Skeleton key={index} width={88} height={12} borderRadius={6} />
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className={WORK_ORDERS_LAYOUT_CLASS.servicesCard}>
          <div className={WORK_ORDERS_LAYOUT_CLASS.servicesTitleRow}>
            <Skeleton width={96} height={18} borderRadius={6} />
          </div>
          <div className={WORK_ORDERS_LAYOUT_CLASS.skeletonServiceList}>
            {Array.from({ length: WORK_ORDER_SKELETON_COUNT.services }, (_, index) => (
              <div key={index} className={WORK_ORDERS_LAYOUT_CLASS.skeletonServiceRow}>
                <Skeleton width="42%" height={16} borderRadius={6} />
                <Skeleton width={56} height={16} borderRadius={6} />
                <Skeleton width={48} height={14} borderRadius={6} />
              </div>
            ))}
          </div>
          <Skeleton width="100%" height={56} borderRadius={16} className={WORK_ORDERS_LAYOUT_CLASS.skeletonMt4} />
        </div>
      </div>
    </div>
  )
}

function WorkOrderTicketCardSkeleton() {
  return (
    <div className={WORK_ORDERS_LAYOUT_CLASS.ticketCard} aria-hidden="true">
      <div className={WORK_ORDERS_LAYOUT_CLASS.ticketCardTop}>
        <div className={WORK_ORDERS_LAYOUT_CLASS.ticketTime}>
          <Skeleton width={44} height={16} borderRadius={6} />
          <Skeleton width={24} height={10} borderRadius={6} className={WORK_ORDERS_LAYOUT_CLASS.skeletonMt2} />
        </div>
        <div className={WORK_ORDERS_LAYOUT_CLASS.grow}>
          <Skeleton width="58%" height={14} borderRadius={6} />
          <Skeleton width="40%" height={12} borderRadius={6} className={WORK_ORDERS_LAYOUT_CLASS.skeletonMt2} />
        </div>
        <Skeleton width={72} height={22} borderRadius={999} />
      </div>
    </div>
  )
}

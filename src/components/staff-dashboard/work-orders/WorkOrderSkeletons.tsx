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
      <div className={WORK_ORDERS_LAYOUT_CLASS.dateNav}>
        <div className={WORK_ORDERS_LAYOUT_CLASS.dateNavRow}>
          <Skeleton circle width={36} height={36} />
          <Skeleton width={96} height={18} borderRadius={6} />
          <Skeleton circle width={36} height={36} />
        </div>
      </div>
      <div className={WORK_ORDERS_LAYOUT_CLASS.filterBar}>
        {Array.from({ length: WORK_ORDER_FILTER_TABS.length }, (_, index) => (
          <Skeleton key={index} height={32} borderRadius={999} className={WORK_ORDERS_LAYOUT_CLASS.skeletonFlex} />
        ))}
      </div>
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
        <Skeleton circle width={40} height={40} />
        <div className={WORK_ORDERS_LAYOUT_CLASS.detailTitleWrap}>
          <Skeleton width={120} height={18} borderRadius={6} />
          <Skeleton width={72} height={12} borderRadius={6} className={WORK_ORDERS_LAYOUT_CLASS.skeletonMt2} />
        </div>
        <Skeleton width={72} height={24} borderRadius={999} />
      </div>
      <div className={WORK_ORDERS_LAYOUT_CLASS.customerCard}>
        <div className={WORK_ORDERS_LAYOUT_CLASS.customerRow}>
          <Skeleton circle width={56} height={56} />
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
          <Skeleton width={88} height={14} borderRadius={6} />
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
  )
}

function WorkOrderTicketCardSkeleton() {
  return (
    <div className={WORK_ORDERS_LAYOUT_CLASS.ticketCard} aria-hidden="true">
      <Skeleton width={56} height={16} borderRadius={6} />
      <div className={WORK_ORDERS_LAYOUT_CLASS.grow}>
        <div className={WORK_ORDERS_LAYOUT_CLASS.ticketHeadRow}>
          <Skeleton width="48%" height={16} borderRadius={6} />
          <Skeleton width={64} height={20} borderRadius={999} />
        </div>
        <Skeleton width="62%" height={12} borderRadius={6} className={WORK_ORDERS_LAYOUT_CLASS.skeletonMt2} />
        <div className={WORK_ORDERS_LAYOUT_CLASS.skeletonMetaWrap}>
          {Array.from({ length: WORK_ORDER_SKELETON_COUNT.metaChips }, (_, index) => (
            <Skeleton key={index} width={80} height={12} borderRadius={6} />
          ))}
        </div>
      </div>
    </div>
  )
}

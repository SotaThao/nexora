import { ChevronRight, MapPin, Store } from 'lucide-react'
import { WORK_ORDERS_LAYOUT_CLASS, type WorkOrderSalonMock } from './constants'

interface WorkOrderSalonCardProps {
  salon: WorkOrderSalonMock
  onSelect: () => void
}

export default function WorkOrderSalonCard({ salon, onSelect }: WorkOrderSalonCardProps) {
  return (
    <button type="button" className={WORK_ORDERS_LAYOUT_CLASS.card} onClick={onSelect}>
      <span className={WORK_ORDERS_LAYOUT_CLASS.iconWrap}>
        <Store className={WORK_ORDERS_LAYOUT_CLASS.storeIcon} aria-hidden="true" />
      </span>
      <span className={WORK_ORDERS_LAYOUT_CLASS.grow}>
        <span className={WORK_ORDERS_LAYOUT_CLASS.salonName}>
          {salon.name}
        </span>
        <span className={WORK_ORDERS_LAYOUT_CLASS.addressRow}>
          <MapPin className={WORK_ORDERS_LAYOUT_CLASS.pinIcon} aria-hidden="true" />
          <span className={WORK_ORDERS_LAYOUT_CLASS.truncate}>{salon.address}</span>
        </span>
      </span>
      <ChevronRight className={WORK_ORDERS_LAYOUT_CLASS.chevronIcon} aria-hidden="true" />
    </button>
  )
}

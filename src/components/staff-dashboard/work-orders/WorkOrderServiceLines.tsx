import { Puzzle } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { formatCurrency } from '../../dashboard/utils'
import {
  WORK_ORDER_COLUMN_ALIGN_CLASS,
  WORK_ORDER_SERVICE_COLUMNS,
  WORK_ORDERS_I18N,
  WORK_ORDERS_LAYOUT_CLASS,
  type WorkOrderServiceLineMock,
} from './constants'

interface WorkOrderServiceLinesProps {
  services: WorkOrderServiceLineMock[]
  total: number
}

export default function WorkOrderServiceLines({ services, total }: WorkOrderServiceLinesProps) {
  const { t } = useTranslation()

  return (
    <section className={WORK_ORDERS_LAYOUT_CLASS.servicesCard}>
      <div className={WORK_ORDERS_LAYOUT_CLASS.servicesHead}>
        <h3 className={WORK_ORDERS_LAYOUT_CLASS.servicesTitle}>
          {t(WORK_ORDERS_I18N.services)}
        </h3>
        <button type="button" className={WORK_ORDERS_LAYOUT_CLASS.textLink}>
          {t(WORK_ORDERS_I18N.addService)}
        </button>
      </div>

      <div className={WORK_ORDERS_LAYOUT_CLASS.serviceCols}>
        {WORK_ORDER_SERVICE_COLUMNS.map((column) => (
          <span key={column.id} className={WORK_ORDER_COLUMN_ALIGN_CLASS[column.align]}>
            {column.labelKey ? t(column.labelKey) : null}
          </span>
        ))}
      </div>

      <div className={WORK_ORDERS_LAYOUT_CLASS.serviceList}>
        {services.map((line) => (
          <WorkOrderServiceLineRow key={line.id} line={line} />
        ))}
      </div>

      <div className={WORK_ORDERS_LAYOUT_CLASS.serviceTotalRow}>
        <span className={WORK_ORDERS_LAYOUT_CLASS.serviceTotalLabel}>
          {t(WORK_ORDERS_I18N.serviceTotal)}
        </span>
        <span className={WORK_ORDERS_LAYOUT_CLASS.serviceTotalValue}>{formatCurrency(total)}</span>
      </div>
    </section>
  )
}

function WorkOrderServiceLineRow({ line }: { line: WorkOrderServiceLineMock }) {
  const { t } = useTranslation()

  return (
    <div className={WORK_ORDERS_LAYOUT_CLASS.serviceRow}>
      <WorkOrderServiceLineName line={line} />
      <span className={WORK_ORDERS_LAYOUT_CLASS.servicePrice}>{formatCurrency(line.price)}</span>
      <span className={WORK_ORDERS_LAYOUT_CLASS.serviceTime}>
        {t(WORK_ORDERS_I18N.durationMin, { count: line.durationMin })}
      </span>
      <span className={WORK_ORDERS_LAYOUT_CLASS.alignEnd}>
        {line.isAddOn ? null : (
          <button type="button" className={WORK_ORDERS_LAYOUT_CLASS.textLinkEnd}>
            {t(WORK_ORDERS_I18N.addOn)}
          </button>
        )}
      </span>
    </div>
  )
}

function WorkOrderServiceLineName({ line }: { line: WorkOrderServiceLineMock }) {
  if (!line.isAddOn) {
    return <span className={WORK_ORDERS_LAYOUT_CLASS.serviceName}>{line.name}</span>
  }

  return (
    <span className={WORK_ORDERS_LAYOUT_CLASS.addOnName}>
      <Puzzle className={WORK_ORDERS_LAYOUT_CLASS.addOnIcon} aria-hidden="true" />
      <span className={WORK_ORDERS_LAYOUT_CLASS.truncate}>{line.name}</span>
    </span>
  )
}

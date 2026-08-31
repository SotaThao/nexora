import { Puzzle } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { WORK_ORDERS_I18N, WORK_ORDERS_LAYOUT_CLASS, type WorkOrderItem } from './constants'
import {
  formatWorkOrderDurationMinutes,
  formatWorkOrderMoney,
  workOrderTextOrPlaceholder,
} from './workOrderTickets'

interface WorkOrderServiceLinesProps {
  items: WorkOrderItem[]
  serviceTotal: number
}

export default function WorkOrderServiceLines({ items, serviceTotal }: WorkOrderServiceLinesProps) {
  const { t } = useTranslation()

  return (
    <section className={WORK_ORDERS_LAYOUT_CLASS.servicesCard}>
      <div className={WORK_ORDERS_LAYOUT_CLASS.servicesTitleRow}>
        <h3 className={WORK_ORDERS_LAYOUT_CLASS.servicesTitle}>
          {t(WORK_ORDERS_I18N.services)}
        </h3>
        <span className={WORK_ORDERS_LAYOUT_CLASS.addServiceLink} aria-disabled="true">
          {t(WORK_ORDERS_I18N.addService)}
        </span>
      </div>

      {items.length === 0 ? (
        <p className={WORK_ORDERS_LAYOUT_CLASS.emptyInline}>{workOrderTextOrPlaceholder('')}</p>
      ) : (
        <>
        <table className={WORK_ORDERS_LAYOUT_CLASS.serviceTable}>
          <colgroup>
            <col />
            <col className={WORK_ORDERS_LAYOUT_CLASS.serviceColPrice} />
            <col className={WORK_ORDERS_LAYOUT_CLASS.serviceColTime} />
            <col className={WORK_ORDERS_LAYOUT_CLASS.serviceColAction} />
          </colgroup>
          <thead>
            <tr>
              <th scope="col" className={`${WORK_ORDERS_LAYOUT_CLASS.serviceHeadCell} ${WORK_ORDERS_LAYOUT_CLASS.textLeft}`}>
                {t(WORK_ORDERS_I18N.colService)}
              </th>
              <th scope="col" className={WORK_ORDERS_LAYOUT_CLASS.serviceHeadCellEnd}>
                {t(WORK_ORDERS_I18N.colPrice)}
              </th>
              <th scope="col" className={WORK_ORDERS_LAYOUT_CLASS.serviceHeadCellEnd}>
                {t(WORK_ORDERS_I18N.colTime)}
              </th>
              <th scope="col" className={WORK_ORDERS_LAYOUT_CLASS.serviceHeadCell}>
                <span className={WORK_ORDERS_LAYOUT_CLASS.srOnly}>{t(WORK_ORDERS_I18N.addOn)}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((line, index) => (
              <WorkOrderServiceLineRow key={line.id || `${line.serviceName}-${index}`} line={line} />
            ))}
          </tbody>
        </table>
        <div className={WORK_ORDERS_LAYOUT_CLASS.serviceTotalRow}>
          <span className={WORK_ORDERS_LAYOUT_CLASS.serviceTotalLabel}>
            {t(WORK_ORDERS_I18N.serviceTotal)}
          </span>
          <span className={WORK_ORDERS_LAYOUT_CLASS.serviceTotalValue}>
            {formatWorkOrderMoney(serviceTotal)}
          </span>
        </div>
        </>
      )}
    </section>
  )
}

function WorkOrderServiceLineRow({ line }: { line: WorkOrderItem }) {
  const { t } = useTranslation()

  return (
    <tr className={WORK_ORDERS_LAYOUT_CLASS.serviceRow}>
      <td className={WORK_ORDERS_LAYOUT_CLASS.serviceNameCell}>
        {line.isAddOn ? (
          <p className={WORK_ORDERS_LAYOUT_CLASS.serviceAddOnName}>
            <Puzzle className={WORK_ORDERS_LAYOUT_CLASS.serviceAddOnIcon} aria-hidden="true" />
            <span className={WORK_ORDERS_LAYOUT_CLASS.truncate}>
              {workOrderTextOrPlaceholder(line.serviceName)}
            </span>
          </p>
        ) : (
          <p className={WORK_ORDERS_LAYOUT_CLASS.serviceName}>
            {workOrderTextOrPlaceholder(line.serviceName)}
          </p>
        )}
      </td>
      <td className={`${WORK_ORDERS_LAYOUT_CLASS.serviceNumCell} ${WORK_ORDERS_LAYOUT_CLASS.servicePrice}`}>
        {formatWorkOrderMoney(line.lineTotal || line.unitPrice)}
      </td>
      <td className={`${WORK_ORDERS_LAYOUT_CLASS.serviceNumCell} ${WORK_ORDERS_LAYOUT_CLASS.serviceDuration}`}>
        {formatWorkOrderDurationMinutes(line.durationMinutes, t)}
      </td>
      <td className={WORK_ORDERS_LAYOUT_CLASS.serviceNumCell}>
        <span className={WORK_ORDERS_LAYOUT_CLASS.addOnLink} aria-disabled="true">
          {t(line.isAddOn ? WORK_ORDERS_I18N.addOnNested : WORK_ORDERS_I18N.addOn)}
        </span>
      </td>
    </tr>
  )
}

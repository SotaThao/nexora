// CustomerTable — presentational table for the Front Desk "Customer" tab (US-043). Table-only
// (no card view, unlike Order List/Booking): this is a read-only lookup surface, not a
// touch-heavy operational board, so information density matters more than tap-target size.
// iPad portrait hides the Status/Created At columns and folds them into a line under the name
// instead — same "responsive collapse, don't remove data" principle as elsewhere in POS.
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { Eye, Pencil } from 'lucide-react'
import type { PosCustomerListItemApiDto } from '../../../../../types/repositories'
import { formatBookingHubDateTimeParts } from '../../bookingHubFormatters'
import {
  POS_TABLE_HEADER_CELL_CLASS,
  POS_TABLE_HEADER_ROW_CLASS,
  POS_TABLE_STICKY_ACTION_CELL_CLASS,
  POS_TABLE_STICKY_ACTION_HEADER_CLASS,
} from '../posTableStyles'
import { formatCustomerPhone } from './customerFormatters'

const CUSTOMER_STATUS_LABEL_KEYS: Record<string, string> = {
  Active: 'customerStatus.Active',
  InActive: 'customerStatus.InActive',
}

const CUSTOMER_STATUS_STYLES: Record<string, { row: string; badge: string }> = {
  Active: {
    row: 'bg-emerald-50/20 hover:bg-emerald-50/45',
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  InActive: {
    row: 'bg-rose-50/20 hover:bg-rose-50/45',
    badge: 'border-rose-200 bg-rose-50 text-rose-600',
  },
}

const DEFAULT_CUSTOMER_STATUS_STYLE = {
  row: 'bg-white hover:bg-violet-50/35',
  badge: 'border-nexoraBorder bg-nexoraCanvas text-nexoraText',
}

function statusLabelKey(status: string): string {
  return CUSTOMER_STATUS_LABEL_KEYS[status] ?? 'customerStatus.Active'
}

export default function CustomerTable({
  customers,
  onView,
  onEdit,
}: {
  customers: PosCustomerListItemApiDto[]
  onView: (customerId: string) => void
  onEdit?: (customerId: string) => void
}) {
  const { t, currentLanguage } = useTranslation()
  const p = 'components.dashboard.views.pos.CustomerTab.'

  return (
    <div className="max-h-[560px] overflow-auto">
      <table className="w-full min-w-[720px] table-auto text-left text-xs">
        <thead className="sticky top-0 z-[1] bg-nexoraCanvas/90">
          <tr className={POS_TABLE_HEADER_ROW_CLASS}>
            <th className={POS_TABLE_HEADER_CELL_CLASS}>{t(p + 'columnName')}</th>
            <th className={POS_TABLE_HEADER_CELL_CLASS}>{t(p + 'columnPhone')}</th>
            <th className={`${POS_TABLE_HEADER_CELL_CLASS} hidden md:table-cell`}>{t(p + 'columnStatus')}</th>
            <th className={`${POS_TABLE_HEADER_CELL_CLASS} text-right`}>{t(p + 'columnTotalVisits')}</th>
            <th className={POS_TABLE_HEADER_CELL_CLASS}>{t(p + 'columnLastVisit')}</th>
            <th className={`${POS_TABLE_HEADER_CELL_CLASS} hidden md:table-cell`}>{t(p + 'columnCreatedAt')}</th>
            <th className={`${POS_TABLE_HEADER_CELL_CLASS} ${POS_TABLE_STICKY_ACTION_HEADER_CLASS} text-right`}>{t(p + 'columnActions')}</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => {
            const lastVisit = formatBookingHubDateTimeParts(customer.lastVisit, currentLanguage)
            const created = formatBookingHubDateTimeParts(customer.createdAt, currentLanguage)
            const statusStyle = CUSTOMER_STATUS_STYLES[customer.status] ?? DEFAULT_CUSTOMER_STATUS_STYLE
            return (
              <tr key={customer.id} className={`border-t border-nexoraBorder/70 transition-colors ${statusStyle.row}`}>
                <td className="px-4 py-3">
                  <p className="pos-customer-name font-bold text-nexoraText">{customer.name || t(p + 'unnamedCustomer')}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 md:hidden">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-extrabold ${statusStyle.badge}`}>
                      {t(p + statusLabelKey(customer.status))}
                    </span>
                    <span className="text-[11px] font-semibold text-nexoraText">
                      {created ? `${created.date} ${created.time}` : '—'}
                    </span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums text-nexoraText">{formatCustomerPhone(customer.phone, customer.phoneE164)}</td>
                <td className="hidden px-4 py-3 md:table-cell">
                  <span className={`rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${statusStyle.badge}`}>
                    {t(p + statusLabelKey(customer.status))}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-bold tabular-nums text-nexoraText">
                  <span className="inline-flex min-w-7 justify-center rounded-full bg-violet-100 px-2.5 py-1 text-violet-700">
                    {customer.totalVisit}
                  </span>
                </td>
                <td className="px-4 py-3 align-middle">
                  <div className="grid gap-0.5 whitespace-nowrap">
                    <span className="font-semibold text-nexoraText">{lastVisit?.date ?? '—'}</span>
                    <span className="text-[11px] font-semibold text-nexoraText">{lastVisit?.time ?? '—'}</span>
                  </div>
                </td>
                <td className="hidden px-4 py-3 align-middle md:table-cell">
                  <div className="grid gap-0.5 whitespace-nowrap">
                    <span className="font-semibold text-nexoraText">{created?.date ?? '—'}</span>
                    <span className="text-[11px] font-semibold text-nexoraText">{created?.time ?? '—'}</span>
                  </div>
                </td>
                <td className={`${POS_TABLE_STICKY_ACTION_CELL_CLASS} px-4 py-3 text-right`}>
                  <div className="inline-flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onView(customer.id)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-2.5 text-[10px] font-extrabold text-violet-700 transition-colors hover:border-violet-300 hover:bg-violet-100"
                    >
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                      {t(p + 'viewAction')}
                    </button>
                    {onEdit ? (
                      <button
                        type="button"
                        onClick={() => onEdit(customer.id)}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-nexoraBrand/30 bg-white px-2.5 text-[10px] font-extrabold text-nexoraBrand transition-colors hover:border-nexoraBrand hover:bg-nexoraBrand/5"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        {t(p + 'editAction')}
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

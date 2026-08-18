// CustomerTable — presentational table for the Front Desk "Customer" tab (US-043). Table-only
// (no card view, unlike Order List/Booking): this is a read-only lookup surface, not a
// touch-heavy operational board, so information density matters more than tap-target size.
// iPad portrait hides the Status/Created At columns and folds them into a line under the name
// instead — same "responsive collapse, don't remove data" principle as elsewhere in POS.
import { useTranslation } from '../../../../../contexts/LanguageContext'
import type { PosCustomerListItemApiDto } from '../../../../../types/repositories'
import { formatPosDateTime } from '../posDateTime'
import { formatCustomerPhone } from './customerFormatters'

const CUSTOMER_STATUS_LABEL_KEYS: Record<string, string> = {
  Active: 'customerStatus.Active',
  InActive: 'customerStatus.InActive',
}

function statusLabelKey(status: string): string {
  return CUSTOMER_STATUS_LABEL_KEYS[status] ?? 'customerStatus.Active'
}

export default function CustomerTable({
  customers,
  onView,
}: {
  customers: PosCustomerListItemApiDto[]
  onView: (customerId: string) => void
}) {
  const { t, currentLanguage } = useTranslation()
  const p = 'components.dashboard.views.pos.CustomerTab.'
  const formatDateTime = (iso: string | null | undefined) =>
    formatPosDateTime(iso, currentLanguage, { withYear: false })

  return (
    <div className="max-h-[560px] overflow-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
            <th className="text-xs font-black pb-2 pr-3">{t(p + 'columnName')}</th>
            <th className="text-xs font-black pb-2 pr-3">{t(p + 'columnPhone')}</th>
            <th className="hidden md:table-cell text-xs font-black pb-2 pr-3">{t(p + 'columnStatus')}</th>
            <th className="text-xs font-black pb-2 pr-3 text-right">{t(p + 'columnTotalVisits')}</th>
            <th className="text-xs font-black pb-2 pr-3">{t(p + 'columnLastVisit')}</th>
            <th className="hidden md:table-cell text-xs font-black pb-2 pr-3">{t(p + 'columnCreatedAt')}</th>
            <th className="text-xs font-black pb-2 text-right">{t(p + 'columnActions')}</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id} className="border-t border-nexoraBorder">
              <td className="py-2 pr-3">
                <p className="font-bold text-nexoraText">{customer.name || t(p + 'unnamedCustomer')}</p>
                <p className="mt-0.5 text-[11px] text-nexoraMuted md:hidden">
                  {t(p + statusLabelKey(customer.status))} · {formatDateTime(customer.createdAt)}
                </p>
              </td>
              <td className="py-2 pr-3 text-nexoraMuted">{formatCustomerPhone(customer.phone)}</td>
              <td className="hidden md:table-cell py-2 pr-3 text-nexoraMuted">
                {t(p + statusLabelKey(customer.status))}
              </td>
              <td className="py-2 pr-3 text-right font-bold tabular-nums text-nexoraText">{customer.totalVisit}</td>
              <td className="py-2 pr-3 text-nexoraMuted">{formatDateTime(customer.lastVisit)}</td>
              <td className="hidden md:table-cell py-2 pr-3 text-nexoraMuted">{formatDateTime(customer.createdAt)}</td>
              <td className="py-2 text-right">
                <button
                  type="button"
                  onClick={() => onView(customer.id)}
                  className="rounded-lg border border-nexoraBorder px-2.5 py-1 text-[11px] font-bold text-nexoraText hover:border-nexoraBrand"
                >
                  {t(p + 'viewAction')}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

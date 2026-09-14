import { Clock3, Link2, ReceiptText, UserRound, X } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useCheckInOverviewDetail } from '../../../../../data/hooks/usePosOrders'
import { SkeletonList } from '../../../../ui/skeleton'
import { formatPosDateTime } from '../posDateTime'
import { statusLabelKey } from '../booking/bookingFormatters'
import { formatCheckInPhone } from './checkInPhoneFormat'
import { CustomerSource, GUEST_SOURCE_LABEL_KEYS } from '../../../../../constants/customerSource'
import { CHECKIN_STATUS_BADGE_COLORS } from './checkInStatusColors'

export default function CheckInDetailModal({
  businessId,
  orderId,
  onClose,
}: {
  businessId: string
  orderId: string
  onClose: () => void
}) {
  const { t, currentLanguage } = useTranslation()
  const p = 'components.dashboard.views.pos.checkinOverview.CheckInDetailModal.'
  const { data: item, isLoading } = useCheckInOverviewDetail(businessId, orderId)

  const phone = item?.customerPhone ? formatCheckInPhone(item.customerPhone) ?? item.customerPhone : t(p + 'notProvided')
  const guestType = item?.isNewGuest ? t(p + 'newGuest') : t(p + 'returningGuest')
  const source = item?.isNewGuest
    ? t(p + (GUEST_SOURCE_LABEL_KEYS[item?.source as CustomerSource] ?? 'sourceWalkIn'))
    : t(p + 'sourceOriginalProfile')
  const services = item && item.serviceNames.length > 0 ? item.serviceNames.join(', ') : t(p + 'notProvided')
  const technicians = item && item.technicianNames.length > 0 ? item.technicianNames.join(', ') : t(p + 'unassigned')
  const status = item ? t(p + statusLabelKey(item.status)) : ''
  const checkedInAt = item
    ? formatPosDateTime(item.checkedInAt, currentLanguage, { withYear: false }).replace(/\b(am|pm)\b/i, (m) => m.toUpperCase())
    : ''
  const initial = (item?.customerName.trim().charAt(0) || '?').toUpperCase()

  const fieldCards = [
    { icon: Clock3, label: t(p + 'fieldCheckedInAt'), value: checkedInAt },
    { icon: UserRound, label: t(p + 'fieldGuestType'), value: guestType },
    { icon: ReceiptText, label: t(p + 'fieldService'), value: services },
    { icon: UserRound, label: t(p + 'fieldTechnician'), value: technicians },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 backdrop-blur-[2px] sm:p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkin-detail-dialog-title"
        className="flex max-h-[calc(100dvh-1rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-nexoraBorder bg-white shadow-2xl sm:max-h-[calc(100dvh-2rem)]"
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-nexoraBorder p-4 sm:p-5">
          <h2 id="checkin-detail-dialog-title" className="text-lg font-bold text-nexoraText">
            {t(p + 'title', { number: item?.orderNumber ?? '' })}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t(p + 'closeAria')}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-nexoraCanvas text-nexoraMuted transition hover:text-nexoraText"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
          {isLoading || !item ? (
            <SkeletonList count={3} lines={2} />
          ) : (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-lg font-bold text-emerald-800">
                    {initial}
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-nexoraMuted">{t(p + 'fieldCustomer')}</p>
                    <p className="text-lg font-bold text-nexoraText">{item.customerName}</p>
                    <p className="text-xs text-nexoraMuted">{phone}</p>
                  </div>
                </div>
                <span
                  className={`inline-flex h-6 shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-[11px] font-bold ${
                    CHECKIN_STATUS_BADGE_COLORS[item.status] ?? 'bg-nexoraCanvas text-nexoraText'
                  }`}
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" aria-hidden="true" />
                  {status}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {fieldCards.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="rounded-xl border border-nexoraBorder bg-gray-50 p-3">
                    <p className="flex items-center gap-1.5 text-[10px] font-medium text-nexoraMuted">
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      {label}
                    </p>
                    <p className="mt-1 truncate text-sm font-bold text-nexoraText">{value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-nexoraBorder bg-gray-50 p-3">
                <p className="flex items-center gap-1.5 text-[10px] font-medium text-nexoraMuted">
                  <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
                  {t(p + 'fieldSource')}
                </p>
                <p className="mt-1 text-sm font-bold text-nexoraText">{source}</p>
              </div>
            </>
          )}
        </div>

        <div className="flex shrink-0 justify-end border-t border-nexoraBorder p-3 sm:p-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-emerald-800 px-4 py-2 text-xs font-bold text-white"
          >
            {t(p + 'close')}
          </button>
        </div>
      </section>
    </div>
  )
}

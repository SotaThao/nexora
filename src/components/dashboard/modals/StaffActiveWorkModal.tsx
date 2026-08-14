// Blocking dialog shown when deleting a local staff member is rejected because they are
// still assigned to open orders/bookings (backend LOCAL_STAFF_HAS_ACTIVE_WORK). Read-only:
// the merchant closes or reassigns those items on the Front Desk / Booking tabs, then
// retries the delete from here.
import { AlertTriangle } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useLocalStaffActiveWork } from '../../../data/hooks/useLocalStaff'
import { SkeletonList } from '../../ui/skeleton'
import { formatPosDateTime } from '../views/pos/posDateTime'
import { formatBookingWallClock, statusLabelKey } from '../views/pos/booking/bookingFormatters'
import type { LocalStaffActiveWorkItem } from '../../../types/repositories'

const BOOKING_STATUS_PREFIX = 'components.dashboard.views.pos.BookingTab.'

export default function StaffActiveWorkModal({
  staffProfileId,
  staffName,
  onClose,
}: {
  staffProfileId: string
  staffName: string
  onClose: () => void
}) {
  const { t, currentLanguage } = useTranslation()
  const p = 'components.dashboard.modals.StaffActiveWorkModal.'

  const { data: items, isLoading } = useLocalStaffActiveWork(staffProfileId)

  // A booking's scheduledAt carries split semantics per source, so it goes through the
  // booking wall-clock resolver; a walk-in order's checkedInAt is a genuine UTC instant.
  const formatWhen = (item: LocalStaffActiveWorkItem) =>
    item.isBooking && item.scheduledAt
      ? formatBookingWallClock(item.scheduledAt, item.source ?? undefined)
      : formatPosDateTime(item.checkedInAt, currentLanguage)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="nexora-modal-card w-full max-w-lg">
        <div className="flex shrink-0 items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-nexoraWarning" />
          <div>
            <h3 className="text-sm font-bold text-nexoraText">{t(p + 'title', { name: staffName })}</h3>
            <p className="mt-1 text-xs font-medium text-nexoraMuted">{t(p + 'description')}</p>
          </div>
        </div>

        <div className="mt-4 flex-1 overflow-y-auto">
          {isLoading ? (
            <SkeletonList count={3} lines={2} />
          ) : !items || items.length === 0 ? (
            <p className="text-xs font-medium text-nexoraMuted">{t(p + 'empty')}</p>
          ) : (
            <ul className="space-y-2">
              {items.map((item) => (
                <li
                  key={item.orderId}
                  className="rounded-xl border border-nexoraBorder bg-nexoraCanvas p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-nexoraText">
                      {item.isBooking ? t(p + 'booking') : `#${item.orderNumber}`}
                    </span>
                    <span className="rounded-full bg-nexoraSurface px-2.5 py-1 text-[10px] font-extrabold uppercase text-nexoraMuted">
                      {t(BOOKING_STATUS_PREFIX + statusLabelKey(item.status))}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-medium text-nexoraMuted">
                    {[item.customerName, formatWhen(item)].filter(Boolean).join(' · ')}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-4 flex shrink-0 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-lg bg-nexoraBrand px-5 text-sm font-bold text-white hover:bg-nexoraBrandDark"
          >
            {t(p + 'close')}
          </button>
        </div>
      </div>
    </div>
  )
}

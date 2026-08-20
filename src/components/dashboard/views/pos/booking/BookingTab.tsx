// BookingTab — Ticket 9, Booking Management sub-tab inside Front Desk. View-mode switcher
// (Table/Cards/Calendar) sharing one filtered list query, plus the Check-in/Cancel/Reschedule
// actions each view calls back into. "Create" is handled by the page-level "+ New Booking"
// button already wired in PosFrontDeskView (Ticket 3) — no need to duplicate it here.
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import { getApiErrorCode } from '../../../../../types/domain'
import { getErrorI18nKey } from '../../../../../data/errorCodes'
import {
  useBookingDetail,
  useBookingList,
  useCancelBooking,
  useCheckInBookingFromList,
  useRescheduleBooking,
} from '../../../../../data/hooks/usePosBooking'
import { POS_BOOKING_STATUS_OPTIONS } from '../../../../../constants/posOrderStatus'
import { TWELVE_HOUR_INPUT_LANG } from '../../../../../constants/timeFormat'
import type { TurnBoardStationApiDto } from '../../../../../types/repositories'
import { SkeletonList } from '../../../../ui/skeleton'
import { formatCustomerPhone } from '../customer/customerFormatters'
import BookingTable from './BookingTable'
import BookingCards from './BookingCards'
import BookingCalendar from './BookingCalendar'
import RescheduleServicesEditor, { type RescheduleLineDraft } from './RescheduleServicesEditor'
import BookingLinkShare from './BookingLinkShare'
import { formatBookingWallClock, resolveBookingWallClockParts, statusLabelKey } from './bookingFormatters'
import { formatPosDateTime } from '../posDateTime'

type ViewMode = 'table' | 'cards' | 'calendar'

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function isoDateOnly(date: Date): string {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
}

export default function BookingTab({
  businessId,
  businessSlug,
  turnBoardStaff,
}: {
  businessId: string
  businessSlug?: string
  turnBoardStaff: TurnBoardStationApiDto[]
}) {
  const { t, currentLanguage } = useTranslation()
  const { showToast } = useNotification()

  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [status, setStatus] = useState('')
  const [posStaffProfileId, setPosStaffProfileId] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [calendarMonth, setCalendarMonth] = useState(() => new Date())
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null)
  const [checkingInId, setCheckingInId] = useState<string | null>(null)
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelReasonError, setCancelReasonError] = useState('')
  const [rescheduleTargetId, setRescheduleTargetId] = useState<string | null>(null)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleTime, setRescheduleTime] = useState('')
  const [rescheduleLines, setRescheduleLines] = useState<RescheduleLineDraft[]>([])
  const [viewDetailTargetId, setViewDetailTargetId] = useState<string | null>(null)

  const monthBounds = useMemo(() => {
    const year = calendarMonth.getUTCFullYear()
    const month = calendarMonth.getUTCMonth()
    const from = new Date(Date.UTC(year, month, 1))
    const to = new Date(Date.UTC(year, month + 1, 0))
    return { from: isoDateOnly(from), to: isoDateOnly(to) }
  }, [calendarMonth])

  const effectiveDateFrom = viewMode === 'calendar' ? monthBounds.from : dateFrom || undefined
  const effectiveDateTo = viewMode === 'calendar' ? monthBounds.to : dateTo || undefined

  const { data, isLoading } = useBookingList(businessId, {
    status: status || undefined,
    posStaffProfileId: posStaffProfileId || undefined,
    dateFrom: effectiveDateFrom,
    dateTo: effectiveDateTo,
    pageSize: 200,
  })
  const bookings = data?.items ?? []

  const checkInMutation = useCheckInBookingFromList(businessId)
  const cancelMutation = useCancelBooking(businessId)
  const rescheduleMutation = useRescheduleBooking(businessId)
  const rescheduleDetail = useBookingDetail(businessId, rescheduleTargetId ?? undefined)
  const viewDetail = useBookingDetail(businessId, viewDetailTargetId ?? undefined)

  useEffect(() => {
    if (rescheduleDetail.data && rescheduleDetail.data.bookingId === rescheduleTargetId) {
      setRescheduleLines(
        rescheduleDetail.data.services
          // A line whose service couldn't be resolved (see BookingDetailServiceApiDto) has no
          // real posServiceId to reschedule against — Staff must add a concrete service instead.
          .filter((s): s is typeof s & { posServiceId: string } => !!s.posServiceId)
          .map((s) => ({
            key: crypto.randomUUID(),
            posServiceId: s.posServiceId,
            serviceName: s.serviceName,
            posStaffProfileId: s.posStaffProfileId ?? undefined,
          })),
      )
    }
  }, [rescheduleDetail.data, rescheduleTargetId])

  const p = 'components.dashboard.views.pos.BookingTab.'

  const handleCheckIn = async (bookingId: string) => {
    setCheckingInId(bookingId)
    try {
      await checkInMutation.mutateAsync(bookingId)
      showToast(t(p + 'checkInSuccess'))
    } catch (err: unknown) {
      showToast(t(getErrorI18nKey(getApiErrorCode(err, 'ERROR'))), 'error')
    } finally {
      setCheckingInId(null)
    }
  }

  const submitCancel = async () => {
    if (!cancelTargetId) return
    if (!cancelReason.trim()) {
      setCancelReasonError(t(p + 'cancelReasonRequired'))
      return
    }
    try {
      await cancelMutation.mutateAsync({ bookingId: cancelTargetId, payload: { cancellationReason: cancelReason.trim() } })
      showToast(t(p + 'cancelSuccess'))
      setCancelTargetId(null)
      setCancelReason('')
      setCancelReasonError('')
    } catch (err: unknown) {
      showToast(t(getErrorI18nKey(getApiErrorCode(err, 'ERROR'))), 'error')
    }
  }

  const openReschedule = (bookingId: string) => {
    const booking = bookings.find((b) => b.bookingId === bookingId)
    if (booking) {
      const { year, month, day, hours, minutes } = resolveBookingWallClockParts(booking.scheduledAt, booking.source)
      setRescheduleDate(`${year}-${pad(month)}-${pad(day)}`)
      setRescheduleTime(`${pad(hours)}:${pad(minutes)}`)
    }
    setRescheduleLines([])
    setRescheduleTargetId(bookingId)
  }

  const closeReschedule = () => {
    setRescheduleTargetId(null)
    setRescheduleLines([])
  }

  const submitReschedule = async () => {
    if (!rescheduleTargetId || !rescheduleDate || !rescheduleTime || rescheduleLines.length === 0) return
    const [year, month, day] = rescheduleDate.split('-').map(Number)
    const [hour, minute] = rescheduleTime.split(':').map(Number)
    const scheduledAt = new Date(Date.UTC(year, month - 1, day, hour, minute)).toISOString()

    try {
      await rescheduleMutation.mutateAsync({
        bookingId: rescheduleTargetId,
        payload: {
          scheduledAt,
          items: rescheduleLines.map((l) => ({
            posServiceId: l.posServiceId,
            posStaffProfileId: l.posStaffProfileId,
          })),
        },
      })
      showToast(t(p + 'rescheduleSuccess'))
      closeReschedule()
    } catch (err: unknown) {
      showToast(t(getErrorI18nKey(getApiErrorCode(err, 'ERROR'))), 'error')
    }
  }

  const viewProps = {
    bookings,
    onCheckIn: handleCheckIn,
    onCancel: (id: string) => setCancelTargetId(id),
    onReschedule: openReschedule,
    onViewDetail: (id: string) => setViewDetailTargetId(id),
    checkingInId,
  }

  return (
    <div className="space-y-4">
      <BookingLinkShare businessSlug={businessSlug} />

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-lg border border-nexoraBorder p-1">
          {(['table', 'cards', 'calendar'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`rounded-md px-2.5 py-1 text-[11px] font-bold ${
                viewMode === mode ? 'bg-nexoraBrand text-white' : 'text-nexoraMuted hover:text-white'
              }`}
            >
              {t(p + `view${mode.charAt(0).toUpperCase()}${mode.slice(1)}`)}
            </button>
          ))}
        </div>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-8 rounded-lg border border-nexoraBorder bg-white px-2 text-[11px] text-nexoraText outline-none focus:border-nexoraBrand"
        >
          <option value="">{t(p + 'filterAllStatuses')}</option>
          {POS_BOOKING_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          value={posStaffProfileId}
          onChange={(e) => setPosStaffProfileId(e.target.value)}
          className="h-8 rounded-lg border border-nexoraBorder bg-white px-2 text-[11px] text-nexoraText outline-none focus:border-nexoraBrand"
        >
          <option value="">{t(p + 'filterAllTechnicians')}</option>
          {turnBoardStaff.map((station) => (
            <option key={station.posStaffProfileId} value={station.posStaffProfileId}>
              {station.displayName}
            </option>
          ))}
        </select>

        {viewMode !== 'calendar' ? (
          <>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              aria-label={t(p + 'filterDateFrom')}
              className="h-8 rounded-lg border border-nexoraBorder bg-white px-2 text-[11px] text-nexoraText outline-none focus:border-nexoraBrand"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              aria-label={t(p + 'filterDateTo')}
              className="h-8 rounded-lg border border-nexoraBorder bg-white px-2 text-[11px] text-nexoraText outline-none focus:border-nexoraBrand"
            />
          </>
        ) : null}

        {(status || posStaffProfileId || dateFrom || dateTo) && viewMode !== 'calendar' ? (
          <button
            type="button"
            onClick={() => {
              setStatus('')
              setPosStaffProfileId('')
              setDateFrom('')
              setDateTo('')
            }}
            className="text-[11px] font-bold text-nexoraMuted hover:text-nexoraText"
          >
            {t(p + 'clearFilters')}
          </button>
        ) : null}

        {data ? <span className="ml-auto text-[11px] text-nexoraMuted">{t(p + 'totalCount', { count: data.totalCount })}</span> : null}
      </div>

      {isLoading ? (
        <div className="nexora-card p-6">
          <SkeletonList count={3} lines={2} />
        </div>
      ) : bookings.length === 0 && viewMode !== 'calendar' ? (
        <div className="nexora-card p-6 text-center text-xs text-nexoraMuted">{t(p + 'emptyState')}</div>
      ) : viewMode === 'table' ? (
        <BookingTable {...viewProps} />
      ) : viewMode === 'cards' ? (
        <BookingCards {...viewProps} />
      ) : (
        <div className="nexora-card p-4">
          <BookingCalendar
            {...viewProps}
            monthDate={calendarMonth}
            onMonthChange={(next) => {
              setCalendarMonth(next)
              setSelectedDayKey(null)
            }}
            selectedDayKey={selectedDayKey}
            onSelectDay={(dayKey) => setSelectedDayKey(dayKey === selectedDayKey ? null : dayKey)}
          />
        </div>
      )}

      {cancelTargetId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="nexora-modal-card w-full max-w-sm rounded-xl bg-white p-5">
            <h3 className="text-sm font-bold text-nexoraText">{t(p + 'confirmCancelTitle')}</h3>
            <label className="mt-3 block text-[10px] font-extrabold uppercase text-nexoraMuted">
              {t(p + 'cancelReasonLabel')}
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => {
                setCancelReason(e.target.value)
                if (cancelReasonError) setCancelReasonError('')
              }}
              rows={3}
              className="mt-1 w-full rounded-lg border border-nexoraBorder bg-nexoraCanvas p-2.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand focus:bg-white"
            />
            {cancelReasonError ? <p className="mt-1 text-[10px] font-bold text-rose-500">{cancelReasonError}</p> : null}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setCancelTargetId(null)
                  setCancelReason('')
                  setCancelReasonError('')
                }}
                className="h-10 flex-1 rounded-lg border border-nexoraBorder text-xs font-bold text-nexoraText hover:border-nexoraBrand"
              >
                {t(p + 'confirmCancelDismiss')}
              </button>
              <button
                type="button"
                onClick={submitCancel}
                disabled={cancelMutation.isPending}
                className="h-10 flex-1 rounded-lg bg-red-600 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {t(p + 'confirmCancelSubmit')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {rescheduleTargetId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="nexora-modal-card w-full max-w-2xl">
            <h3 className="shrink-0 text-sm font-bold text-nexoraText">{t(p + 'rescheduleModalTitle')}</h3>
            <div className="mt-3 flex-1 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-nexoraMuted">
                    {t(p + 'rescheduleDateLabel')}
                  </label>
                  <input
                    type="date"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-nexoraBorder bg-nexoraCanvas px-2.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-nexoraMuted">
                    {t(p + 'rescheduleTimeLabel')}
                  </label>
                  <input
                    type="time"
                    lang={TWELVE_HOUR_INPUT_LANG}
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-nexoraBorder bg-nexoraCanvas px-2.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
                  {t(p + 'rescheduleServicesTitle')}
                </h4>
                {rescheduleDetail.isLoading ? (
                  <SkeletonList count={2} lines={2} />
                ) : (
                  <RescheduleServicesEditor businessId={businessId} lines={rescheduleLines} onChange={setRescheduleLines} />
                )}
              </div>
            </div>
            <div className="mt-4 flex shrink-0 gap-2">
              <button
                type="button"
                onClick={closeReschedule}
                className="h-10 flex-1 rounded-lg border border-nexoraBorder text-xs font-bold text-nexoraText hover:border-nexoraBrand"
              >
                {t(p + 'rescheduleCancel')}
              </button>
              <button
                type="button"
                onClick={submitReschedule}
                disabled={rescheduleMutation.isPending || rescheduleDetail.isLoading || rescheduleLines.length === 0}
                className="h-10 flex-1 rounded-lg bg-nexoraBrand text-xs font-bold text-white hover:bg-nexoraBrandDark disabled:opacity-60"
              >
                {t(p + 'rescheduleSubmit')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {viewDetailTargetId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="nexora-modal-card w-full max-w-2xl">
            <h3 className="shrink-0 text-sm font-bold text-nexoraText">{t(p + 'viewDetailModalTitle')}</h3>
            <div className="mt-3 flex-1 space-y-4 overflow-y-auto">
              {viewDetail.isLoading || !viewDetail.data ? (
                <SkeletonList count={2} lines={2} />
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase text-nexoraMuted">
                        {t(p + 'viewDetailCustomer')}
                      </p>
                      <p className="text-xs text-nexoraText">{viewDetail.data.customerName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase text-nexoraMuted">
                        {t(p + 'viewDetailPhone')}
                      </p>
                      <p className="text-xs text-nexoraText">{formatCustomerPhone(viewDetail.data.customerPhone, viewDetail.data.customerPhoneE164) || t(p + 'viewDetailNotProvided')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase text-nexoraMuted">
                        {t(p + 'viewDetailEmail')}
                      </p>
                      <p className="text-xs text-nexoraText">{viewDetail.data.customerEmail || t(p + 'viewDetailNotProvided')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase text-nexoraMuted">
                        {t(p + 'viewDetailOrderNumber')}
                      </p>
                      <p className="text-xs text-nexoraText">{viewDetail.data.orderNumber || t(p + 'viewDetailNotProvided')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase text-nexoraMuted">
                        {t(p + 'viewDetailCreatedAt')}
                      </p>
                      <p className="text-xs text-nexoraText">{formatPosDateTime(viewDetail.data.createdAt, currentLanguage)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase text-nexoraMuted">
                        {t(p + 'viewDetailScheduledAt')}
                      </p>
                      <p className="text-xs text-nexoraText">{formatBookingWallClock(viewDetail.data.scheduledAt, viewDetail.data.source)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase text-nexoraMuted">
                        {t(p + 'viewDetailStatus')}
                      </p>
                      <p className="text-xs text-nexoraText">{t(p + statusLabelKey(viewDetail.data.status))}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase text-nexoraMuted">
                        {t(p + 'viewDetailSource')}
                      </p>
                      <p className="text-xs text-nexoraText">{viewDetail.data.source}</p>
                    </div>
                  </div>

                  {viewDetail.data.cancellationReason ? (
                    <div>
                      <p className="text-[10px] font-extrabold uppercase text-nexoraMuted">
                        {t(p + 'viewDetailCancellationReason')}
                      </p>
                      <p className="text-xs text-nexoraText">{viewDetail.data.cancellationReason}</p>
                    </div>
                  ) : null}

                  <div>
                    <h4 className="mb-2 text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
                      {t(p + 'viewDetailServicesTitle')}
                    </h4>
                    <div className="space-y-2">
                      {viewDetail.data.services.map((service, index) => (
                        <div key={`${service.posServiceId ?? 'unresolved'}-${index}`} className="rounded-lg border border-nexoraBorder p-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-bold text-nexoraText">{service.serviceName}</p>
                            <p className="shrink-0 text-xs font-bold text-nexoraText">${service.price.toFixed(2)}</p>
                          </div>
                          <p className="text-[11px] text-nexoraMuted">
                            {service.technicianName || t(p + 'unassigned')}
                          </p>
                          {service.note ? (
                            <p className="mt-1 rounded bg-nexoraCanvas p-1.5 text-[11px] italic text-nexoraMuted">
                              {service.note}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="mt-4 flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => setViewDetailTargetId(null)}
                className="h-10 flex-1 rounded-lg border border-nexoraBorder text-xs font-bold text-nexoraText hover:border-nexoraBrand"
              >
                {t(p + 'viewDetailClose')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

// BookingTab — Ticket 9, Booking Management sub-tab inside Front Desk. View-mode switcher
// (Table/Cards/Calendar) sharing one filtered list query, plus the Check-in/Cancel/Reschedule
// actions each view calls back into. The create action lives beside the view selector so
// front-desk staff can reach it where they manage appointments.
import { useEffect, useMemo, useState } from 'react'
import { CalendarClock, Clock3, ReceiptText, UserRound, X } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import { getApiErrorCode } from '../../../../../types/domain'
import { getErrorI18nKey } from '../../../../../data/errorCodes'
import {
  useBookingDetail,
  useBookingList,
  useAllBookingListPages,
  useCancelBooking,
  useCheckInBookingFromList,
  useRescheduleBooking,
} from '../../../../../data/hooks/usePosBooking'
import { POS_BOOKING_STATUS_OPTIONS, PosOrderStatus } from '../../../../../constants/posOrderStatus'
import { TWELVE_HOUR_INPUT_LANG } from '../../../../../constants/timeFormat'
import type { TimeClockRosterRowApiDto } from '../../../../../types/repositories'
import { SkeletonList } from '../../../../ui/skeleton'
import { formatCustomerPhone } from '../customer/customerFormatters'
import BookingTable from './BookingTable'
import BookingCards from './BookingCards'
import BookingCalendar from './BookingCalendar'
import type { BookingCalendarSlotSelect } from '../../BookingTeamCalendar'
import RescheduleServicesEditor, { type RescheduleLineDraft } from './RescheduleServicesEditor'
import BookingLinkShare from './BookingLinkShare'
import { toBookingWallClockIso } from '../../../../../utils/bookingWallClock'
import {
  bookingDateKey,
  formatBookingWallClock,
  resolveBookingWallClockParts,
  statusLabelKey,
} from './bookingFormatters'
import { formatPosDateTime } from '../posDateTime'
import { randomUuid } from '../../../../../utils/uuid'
import { formatLocalDateIso } from '../../../../../utils/localDate'
import { shiftLocalDateIso } from '../../bookingCalendarUtils'
import {
  buildBookingCalendarOverviewDays,
  getBookingCalendarRange,
  PosBookingCalendarViewMode,
} from './bookingCalendarView'
import { TOAST_SNACK_DURATION_MS } from '../../../../../constants/toast'

type ViewMode = 'table' | 'cards' | 'calendar'

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

export default function BookingTab({
  businessId,
  businessSlug,
  rosterRows,
  rosterLoading,
  rosterError,
  onRosterRetry,
  onNewBooking,
}: {
  businessId: string
  businessSlug?: string
  rosterRows: TimeClockRosterRowApiDto[]
  rosterLoading: boolean
  rosterError: boolean
  onRosterRetry: () => void
  onNewBooking: (slot?: BookingCalendarSlotSelect) => void
}) {
  const { t, currentLanguage } = useTranslation()
  const { showToast } = useNotification()

  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [status, setStatus] = useState('')
  const [posStaffProfileId, setPosStaffProfileId] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [calendarViewMode, setCalendarViewMode] = useState(PosBookingCalendarViewMode.Day)
  const [calendarAnchorDate, setCalendarAnchorDate] = useState(() => formatLocalDateIso(new Date()))
  const [checkingInId, setCheckingInId] = useState<string | null>(null)
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelReasonError, setCancelReasonError] = useState('')
  const [rescheduleTargetId, setRescheduleTargetId] = useState<string | null>(null)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleTime, setRescheduleTime] = useState('')
  const [rescheduleLines, setRescheduleLines] = useState<RescheduleLineDraft[]>([])
  const [viewDetailTargetId, setViewDetailTargetId] = useState<string | null>(null)

  const p = 'components.dashboard.views.pos.BookingTab.'

  const listQuery = useBookingList(businessId, {
    status: status || undefined,
    posStaffProfileId: posStaffProfileId || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    pageSize: 200,
  }, {
    enabled: viewMode !== 'calendar',
  })
  const calendarRange = useMemo(
    () => getBookingCalendarRange(calendarAnchorDate, calendarViewMode),
    [calendarAnchorDate, calendarViewMode],
  )
  const calendarRequestRange = useMemo(
    () => ({
      dateFrom: shiftLocalDateIso(calendarRange.dateFrom, -1),
      dateTo: shiftLocalDateIso(calendarRange.dateTo, 1),
    }),
    [calendarRange],
  )
  const calendarQuery = useAllBookingListPages(
    businessId,
    calendarRequestRange,
    { enabled: viewMode === 'calendar' },
  )
  const calendarBookings = useMemo(
    () => (calendarQuery.data?.items ?? []).filter((booking) => {
      const date = bookingDateKey(booking.scheduledAt, booking.source)
      return date >= calendarRange.dateFrom && date <= calendarRange.dateTo
    }),
    [calendarQuery.data?.items, calendarRange],
  )
  const overviewDays = useMemo(
    () => buildBookingCalendarOverviewDays(
      calendarBookings,
      calendarRange,
      calendarViewMode === PosBookingCalendarViewMode.Month ? 0 : 2,
    ),
    [calendarBookings, calendarRange, calendarViewMode],
  )
  const data = viewMode === 'calendar' ? calendarQuery.data : listQuery.data
  const isLoading = viewMode === 'calendar' ? calendarQuery.isLoading : listQuery.isLoading
  const bookings = viewMode === 'calendar' ? calendarBookings : (listQuery.data?.items ?? [])

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
            key: randomUuid(),
            posServiceId: s.posServiceId,
            serviceName: s.serviceName,
            posStaffProfileId: s.posStaffProfileId ?? undefined,
          })),
      )
    }
  }, [rescheduleDetail.data, rescheduleTargetId])

  const handleCheckIn = async (bookingId: string) => {
    setCheckingInId(bookingId)
    try {
      await checkInMutation.mutateAsync(bookingId)
      showToast(t(p + 'checkInSuccess'), 'success', TOAST_SNACK_DURATION_MS)
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
      showToast(t(p + 'cancelSuccess'), 'success', TOAST_SNACK_DURATION_MS)
      setCancelTargetId(null)
      setCancelReason('')
      setCancelReasonError('')
    } catch (err: unknown) {
      showToast(t(getErrorI18nKey(getApiErrorCode(err, 'ERROR'))), 'error')
    }
  }

  // One slot value for the whole Reschedule modal: the technician lists inside it and the
  // scheduledAt that gets saved must never disagree.
  const rescheduleWallClock = toBookingWallClockIso(rescheduleDate, rescheduleTime)

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
    if (!rescheduleTargetId || !rescheduleWallClock || rescheduleLines.length === 0) return
    const scheduledAt = rescheduleWallClock

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
      showToast(t(p + 'rescheduleSuccess'), 'success', TOAST_SNACK_DURATION_MS)
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
        <div className="inline-flex gap-1 rounded-xl border border-nexoraBorder bg-nexoraCanvas/70 p-1">
          {(['table', 'cards', 'calendar'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors ${
                viewMode === mode
                  ? 'bg-white text-nexoraBrandDark shadow-sm ring-1 ring-inset ring-nexoraBorder/70'
                  : 'text-nexoraMuted hover:bg-nexoraBrandSoft hover:text-nexoraBrandDark'
              }`}
            >
              {t(p + `view${mode.charAt(0).toUpperCase()}${mode.slice(1)}`)}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onNewBooking()}
          className="h-8 shrink-0 rounded-lg bg-nexoraBrand px-3 text-[11px] font-bold text-white transition-colors hover:bg-nexoraBrandDark"
        >
          {t('components.dashboard.views.pos.NewBookingForm.newBookingButton')}
        </button>

        {viewMode !== 'calendar' ? (
          <>
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
              disabled={rosterLoading}
              className="h-8 rounded-lg border border-nexoraBorder bg-white px-2 text-[11px] text-nexoraText outline-none focus:border-nexoraBrand"
            >
              <option value="">{t(p + 'filterAllTechnicians')}</option>
              {rosterRows.map((staff) => (
                <option key={staff.posStaffProfileId} value={staff.posStaffProfileId}>
                  {staff.displayName}
                </option>
              ))}
            </select>
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

        {data ? (
          <span className="ml-auto text-[11px] text-nexoraMuted">
            {t(p + 'totalCount', {
              count: viewMode === 'calendar' ? calendarBookings.length : data.totalCount,
            })}
          </span>
        ) : null}
      </div>

      {rosterError ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <span>{t(p + 'rosterLoadError')}</span>
          <button
            type="button"
            onClick={onRosterRetry}
            className="rounded-lg border border-amber-300 bg-white px-2.5 py-1 font-bold hover:bg-amber-100"
          >
            {t(p + 'retry')}
          </button>
        </div>
      ) : null}

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
        <div className="min-w-0">
          <BookingCalendar
            bookings={bookings}
            mode={calendarViewMode}
            anchorDate={calendarAnchorDate}
            range={calendarRange}
            overviewDays={overviewDays}
            loading={calendarQuery.isLoading}
            error={calendarQuery.isError}
            onRetry={() => { void calendarQuery.refetch() }}
            onModeChange={setCalendarViewMode}
            onAnchorDateChange={setCalendarAnchorDate}
            rosterRows={rosterRows}
            onNewBooking={onNewBooking}
            onViewDetail={(id) => setViewDetailTargetId(id)}
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
                  <RescheduleServicesEditor
                    businessId={businessId}
                    lines={rescheduleLines}
                    onChange={setRescheduleLines}
                    scheduledAt={rescheduleWallClock}
                  />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-[2px]">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-detail-title"
            className="flex max-h-[min(720px,calc(100dvh-2rem))] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-nexoraBorder bg-white shadow-2xl"
          >
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-nexoraBorder bg-nexoraCanvas/70 px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-nexoraBrandDark">
                  {t(p + 'viewDetailModalTitle')}
                </p>
                <h3 id="booking-detail-title" className="mt-1 text-lg font-extrabold tracking-tight text-nexoraText">
                  {viewDetail.data?.customerName ? (
                    <span className="pos-customer-name">{viewDetail.data.customerName}</span>
                  ) : (
                    t(p + 'viewDetailModalTitle')
                  )}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewDetailTargetId(null)}
                aria-label={t(p + 'viewDetailClose')}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-nexoraMuted transition-colors hover:bg-white hover:text-nexoraText"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
              {viewDetail.isLoading || !viewDetail.data ? (
                <SkeletonList count={2} lines={2} />
              ) : (
                <>
                  <section className="flex flex-col gap-4 rounded-xl border border-nexoraBorder bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-nexoraBrandSoft text-sm font-extrabold text-nexoraBrandDark">
                        {viewDetail.data.customerName.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="pos-customer-name text-sm font-extrabold text-nexoraText">{viewDetail.data.customerName}</p>
                        <p className="mt-0.5 truncate text-xs text-nexoraMuted">
                          {formatCustomerPhone(viewDetail.data.customerPhone, viewDetail.data.customerPhoneE164)
                            || t(p + 'viewDetailNotProvided')}
                          {viewDetail.data.customerEmail ? ` · ${viewDetail.data.customerEmail}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-nexoraBrand/20 bg-nexoraBrandSoft px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-nexoraBrandDark">
                        {t(p + statusLabelKey(viewDetail.data.status))}
                      </span>
                      <span className="rounded-full bg-nexoraCanvas px-2.5 py-1 text-[10px] font-bold text-nexoraMuted">{viewDetail.data.source}</span>
                    </div>
                  </section>

                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                    <section className="rounded-xl border border-nexoraBorder bg-white p-4">
                      <div className="mb-3 flex items-center gap-2 text-nexoraBrandDark"><UserRound className="h-4 w-4" /><h4 className="text-xs font-extrabold">{t(p + 'viewDetailCustomer')}</h4></div>
                      <dl className="space-y-2.5 text-xs"><div className="flex justify-between gap-4"><dt className="text-nexoraMuted">{t(p + 'viewDetailPhone')}</dt><dd className="text-right font-semibold text-nexoraText">{formatCustomerPhone(viewDetail.data.customerPhone, viewDetail.data.customerPhoneE164) || t(p + 'viewDetailNotProvided')}</dd></div><div className="flex justify-between gap-4"><dt className="text-nexoraMuted">{t(p + 'viewDetailEmail')}</dt><dd className="max-w-[65%] truncate text-right font-semibold text-nexoraText">{viewDetail.data.customerEmail || t(p + 'viewDetailNotProvided')}</dd></div></dl>
                    </section>
                    <section className="rounded-xl border border-nexoraBorder bg-white p-4">
                      <div className="mb-3 flex items-center gap-2 text-nexoraBrandDark"><CalendarClock className="h-4 w-4" /><h4 className="text-xs font-extrabold">{t(p + 'viewDetailScheduledAt')}</h4></div>
                      <p className="text-sm font-extrabold text-nexoraText">{formatBookingWallClock(viewDetail.data.scheduledAt, viewDetail.data.source)}</p>
                      <p className="mt-1 text-[11px] text-nexoraMuted"><Clock3 className="mr-1 inline h-3.5 w-3.5" />{t(p + 'viewDetailCreatedAt')}: {formatPosDateTime(viewDetail.data.createdAt, currentLanguage)}</p>
                    </section>
                  </div>

                  <section className="overflow-hidden rounded-xl border border-nexoraBorder bg-white">
                    <div className="flex items-center justify-between border-b border-nexoraBorder bg-nexoraCanvas/60 px-4 py-3"><div className="flex items-center gap-2 text-nexoraBrandDark"><ReceiptText className="h-4 w-4" /><h4 className="text-xs font-extrabold">{t(p + 'viewDetailServicesTitle')}</h4></div><span className="text-[11px] font-bold text-nexoraMuted">{viewDetail.data.services.length}</span></div>
                    <div className="divide-y divide-nexoraBorder">
                      {viewDetail.data.services.map((service, index) => (
                        <div key={`${service.posServiceId ?? 'unresolved'}-${index}`} className="grid gap-1 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-x-5">
                          <div className="min-w-0"><p className="text-xs font-bold text-nexoraText">{service.serviceName}</p><p className="mt-0.5 text-[11px] text-nexoraMuted">{service.technicianName || t(p + 'unassigned')}{service.note ? ` · ${service.note}` : ''}</p></div>
                          <p className="text-xs font-extrabold tabular-nums text-nexoraText">${service.price.toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {viewDetail.data.cancellationReason ? (
                    <section className="rounded-xl border border-rose-200 bg-rose-50/60 p-4"><p className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600">{t(p + 'viewDetailCancellationReason')}</p><p className="mt-1 text-xs font-medium text-rose-950">{viewDetail.data.cancellationReason}</p></section>
                  ) : null}
                </>
              )}
            </div>
            <div className="flex shrink-0 justify-end border-t border-nexoraBorder bg-white px-5 py-3 sm:px-6">
              <button
                type="button"
                onClick={() => setViewDetailTargetId(null)}
                className="h-9 rounded-lg border border-nexoraBorder px-4 text-xs font-bold text-nexoraText transition-colors hover:border-nexoraBrand hover:bg-nexoraCanvas"
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

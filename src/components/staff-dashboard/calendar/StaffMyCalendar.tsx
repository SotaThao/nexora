import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CalendarCheck, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import type { TFunction } from '../../../types/contexts'
import { useStaffBookingCalendar } from '../../../data/hooks/useStaffWorkOrders'
import { staffWorkOrdersPath, type WorkOrderSalon } from '../work-orders/constants'
import { STAFF_SALONS_PATH } from '../staffSalonPaths'
import { WorkOrderErrorCard } from '../work-orders/WorkOrderQueryFeedback'
import {
  calendarAppointmentBarClass,
  calendarAppointmentCardClass,
  calendarAppointmentStatusClass,
  calendarDayClass,
  STAFF_CALENDAR_I18N,
  STAFF_CALENDAR_LAYOUT_CLASS,
  STAFF_CALENDAR_STATUS_I18N,
  type StaffCalendarAppointment,
} from './constants'
import {
  calendarWeekDays,
  formatCalendarDuration,
  formatCalendarTime,
  formatCalendarWeekday,
  parseCalendarDateKey,
  shiftCalendarDate,
  toCalendarDateKey,
} from './calendarUtils'
import StaffMyCalendarSkeleton from './StaffMyCalendarSkeleton'
import { useStaffCalendarSalon } from './useStaffCalendarSalon'

const SALON_PARAM = 'salon'

export default function StaffMyCalendar() {
  const { t, currentLanguage } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { salons, salon, todayKey, isPending: isSalonPending, isError: isSalonError, refetch } =
    useStaffCalendarSalon(searchParams.get(SALON_PARAM)?.trim() || undefined)

  const requestedDate = useMemo(() => {
    const parsed = parseCalendarDateKey(searchParams.get('date'))
    return parsed ? toCalendarDateKey(parsed) : null
  }, [searchParams])
  // The salon's today only arrives with the businesses query, so the picked day stays null
  // until the technician actually chooses one.
  const [pickedDate, setPickedDate] = useState<string | null>(requestedDate)
  const selectedDate = pickedDate ?? todayKey

  const calendarQuery = useStaffBookingCalendar(salon?.id, selectedDate)
  const appointments = calendarQuery.data?.items ?? []
  const weekDays = calendarWeekDays(selectedDate)
  const selectedDateValue = parseCalendarDateKey(selectedDate)
  const headingWeekday = selectedDateValue
    ? formatCalendarWeekday(selectedDateValue, currentLanguage, 'long')
    : ''
  const headingKey =
    appointments.length === 1 ? STAFF_CALENDAR_I18N.headingOne : STAFF_CALENDAR_I18N.heading
  const isPending = isSalonPending || calendarQuery.isPending
  const totalDuration = calendarQuery.data?.totalDurationMinutes ?? 0

  if (isSalonError) {
    return (
      <div className={STAFF_CALENDAR_LAYOUT_CLASS.page}>
        <WorkOrderErrorCard onAction={() => void refetch()} />
      </div>
    )
  }

  if (!isSalonPending && !salon) {
    return (
      <div className={STAFF_CALENDAR_LAYOUT_CLASS.page}>
        <NoSalonState t={t} />
      </div>
    )
  }

  return (
    <div className={STAFF_CALENDAR_LAYOUT_CLASS.page} data-selected-date={selectedDate}>
      <section className={STAFF_CALENDAR_LAYOUT_CLASS.calendar}>
        <div className={STAFF_CALENDAR_LAYOUT_CLASS.header}>
          <div className={STAFF_CALENDAR_LAYOUT_CLASS.titleBlock}>
            <div className={STAFF_CALENDAR_LAYOUT_CLASS.kicker}>{t(STAFF_CALENDAR_I18N.kicker)}</div>
            <div className={STAFF_CALENDAR_LAYOUT_CLASS.titleRow}>
              <h1 className={STAFF_CALENDAR_LAYOUT_CLASS.title}>{t(STAFF_CALENDAR_I18N.title)}</h1>
              <div className={STAFF_CALENDAR_LAYOUT_CLASS.mobileDateNavigation} aria-label={t(STAFF_CALENDAR_I18N.weekLabel)}>
                <button
                  className={STAFF_CALENDAR_LAYOUT_CLASS.dateNavigationButton}
                  type="button"
                  aria-label={t(STAFF_CALENDAR_I18N.previousDay)}
                  onClick={() => setPickedDate(shiftCalendarDate(selectedDate, -1))}
                >
                  <ChevronLeft className={STAFF_CALENDAR_LAYOUT_CLASS.dateNavigationIcon} aria-hidden="true" />
                </button>
                <button
                  className={STAFF_CALENDAR_LAYOUT_CLASS.dateNavigationButton}
                  type="button"
                  aria-label={t(STAFF_CALENDAR_I18N.nextDay)}
                  onClick={() => setPickedDate(shiftCalendarDate(selectedDate, 1))}
                >
                  <ChevronRight className={STAFF_CALENDAR_LAYOUT_CLASS.dateNavigationIcon} aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
          <div className={STAFF_CALENDAR_LAYOUT_CLASS.headerActions}>
            {salons.length > 1 ? (
              <SalonSelect
                salons={salons}
                selectedId={salon?.id ?? ''}
                label={t(STAFF_CALENDAR_I18N.salonLabel)}
                onChange={(salonId) => {
                  const next = new URLSearchParams(searchParams)
                  next.set(SALON_PARAM, salonId)
                  setSearchParams(next, { replace: true })
                }}
              />
            ) : null}
            <button
              className={STAFF_CALENDAR_LAYOUT_CLASS.todayButton}
              type="button"
              onClick={() => setPickedDate(todayKey)}
            >
              {t(STAFF_CALENDAR_I18N.today)}
            </button>
          </div>
        </div>

        <div className={STAFF_CALENDAR_LAYOUT_CLASS.weekShell}>
          <div className={STAFF_CALENDAR_LAYOUT_CLASS.weekNavigation}>
            <button
              className={`${STAFF_CALENDAR_LAYOUT_CLASS.dateNavigationButton} ${STAFF_CALENDAR_LAYOUT_CLASS.desktopDateNavigationButton}`}
              type="button"
              aria-label={t(STAFF_CALENDAR_I18N.previousDay)}
              onClick={() => setPickedDate(shiftCalendarDate(selectedDate, -1))}
            >
              <ChevronLeft
                className={STAFF_CALENDAR_LAYOUT_CLASS.dateNavigationIcon}
                aria-hidden="true"
              />
            </button>
            <div
              className={`${STAFF_CALENDAR_LAYOUT_CLASS.week} flex-1`}
              role="group"
              aria-label={t(STAFF_CALENDAR_I18N.weekLabel)}
            >
              {weekDays.map((day) => {
                const isSelected = day.key === selectedDate
                const isToday = day.key === todayKey
                return (
                  <button
                    key={day.key}
                    className={calendarDayClass(isSelected)}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setPickedDate(day.key)}
                  >
                    <span className={STAFF_CALENDAR_LAYOUT_CLASS.weekday}>
                      {formatCalendarWeekday(day.date, currentLanguage, 'short')}
                    </span>
                    <span
                      className={`${STAFF_CALENDAR_LAYOUT_CLASS.date}${
                        isToday && !isSelected ? ` ${STAFF_CALENDAR_LAYOUT_CLASS.dateToday}` : ''
                      }`}
                    >
                      {day.date.getDate()}
                    </span>
                  </button>
                )
              })}
            </div>
            <button
              className={`${STAFF_CALENDAR_LAYOUT_CLASS.dateNavigationButton} ${STAFF_CALENDAR_LAYOUT_CLASS.desktopDateNavigationButton}`}
              type="button"
              aria-label={t(STAFF_CALENDAR_I18N.nextDay)}
              onClick={() => setPickedDate(shiftCalendarDate(selectedDate, 1))}
            >
              <ChevronRight
                className={STAFF_CALENDAR_LAYOUT_CLASS.dateNavigationIcon}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>

        <section aria-live="polite" aria-busy={isPending}>
          <div className={STAFF_CALENDAR_LAYOUT_CLASS.scheduleHead}>
            <h2 className={STAFF_CALENDAR_LAYOUT_CLASS.scheduleTitle}>
              {isPending
                ? t(STAFF_CALENDAR_I18N.loading)
                : t(headingKey, { weekday: headingWeekday, count: appointments.length })}
            </h2>
            <span className={STAFF_CALENDAR_LAYOUT_CLASS.duration}>
              {isPending ? '' : formatCalendarDuration(totalDuration, t)}
            </span>
          </div>

          {isPending ? (
            <StaffMyCalendarSkeleton />
          ) : calendarQuery.isError ? (
            <WorkOrderErrorCard onAction={() => void calendarQuery.refetch()} />
          ) : appointments.length === 0 ? (
            <CalendarEmptyState t={t} />
          ) : (
            <div className={STAFF_CALENDAR_LAYOUT_CLASS.list}>
              {appointments.map((appointment) => (
                <CalendarAppointmentRow
                  key={appointment.id}
                  appointment={appointment}
                  language={currentLanguage}
                  salonId={salon?.id}
                  t={t}
                />
              ))}
            </div>
          )}
        </section>

        <Link
          to={salon?.id ? staffWorkOrdersPath(salon.id) : STAFF_SALONS_PATH}
          className={STAFF_CALENDAR_LAYOUT_CLASS.back}
        >
          <ArrowLeft className={STAFF_CALENDAR_LAYOUT_CLASS.backIcon} aria-hidden="true" />
          {t(STAFF_CALENDAR_I18N.back)}
        </Link>
      </section>
    </div>
  )
}

function SalonSelect({
  salons,
  selectedId,
  label,
  onChange,
}: {
  salons: WorkOrderSalon[]
  selectedId: string
  label: string
  onChange: (salonId: string) => void
}) {
  return (
    <div className={STAFF_CALENDAR_LAYOUT_CLASS.salonSelectWrap}>
      <select
        className={STAFF_CALENDAR_LAYOUT_CLASS.salonSelect}
        aria-label={label}
        value={selectedId}
        onChange={(event) => onChange(event.target.value)}
      >
        {salons.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
      <ChevronDown className={STAFF_CALENDAR_LAYOUT_CLASS.salonSelectIcon} aria-hidden="true" />
    </div>
  )
}

function NoSalonState({ t }: { t: TFunction }) {
  return (
    <div className={STAFF_CALENDAR_LAYOUT_CLASS.empty}>
      <CalendarCheck className={STAFF_CALENDAR_LAYOUT_CLASS.emptyIcon} aria-hidden="true" />
      <strong className={STAFF_CALENDAR_LAYOUT_CLASS.emptyTitle}>
        {t(STAFF_CALENDAR_I18N.noSalonTitle)}
      </strong>
      <span className={STAFF_CALENDAR_LAYOUT_CLASS.emptyBody}>
        {t(STAFF_CALENDAR_I18N.noSalonBody)}
      </span>
    </div>
  )
}

function CalendarEmptyState({ t }: { t: TFunction }) {
  return (
    <div className={STAFF_CALENDAR_LAYOUT_CLASS.empty}>
      <CalendarCheck className={STAFF_CALENDAR_LAYOUT_CLASS.emptyIcon} aria-hidden="true" />
      <strong className={STAFF_CALENDAR_LAYOUT_CLASS.emptyTitle}>
        {t(STAFF_CALENDAR_I18N.emptyTitle)}
      </strong>
      <span className={STAFF_CALENDAR_LAYOUT_CLASS.emptyBody}>
        {t(STAFF_CALENDAR_I18N.emptyBody)}
      </span>
    </div>
  )
}

function CalendarAppointmentRow({
  appointment,
  language,
  salonId,
  t,
}: {
  appointment: StaffCalendarAppointment
  language: string
  salonId?: string
  t: TFunction
}) {
  const timeLabel = formatCalendarTime(appointment.scheduledAt, language)
  const statusKey = STAFF_CALENDAR_STATUS_I18N[appointment.status]
  // The detail screen is addressed by order id; the WO number is only what the card shows.
  const href = salonId
    ? staffWorkOrdersPath(salonId, appointment.id)
    : STAFF_SALONS_PATH

  return (
    <Link to={href} className={STAFF_CALENDAR_LAYOUT_CLASS.row}>
      <span className={STAFF_CALENDAR_LAYOUT_CLASS.time}>{timeLabel}</span>
      <span className={calendarAppointmentCardClass(appointment.status)}>
        <span
          className={`${STAFF_CALENDAR_LAYOUT_CLASS.cardBar} ${calendarAppointmentBarClass(appointment.status)}`}
        />
        <span className={STAFF_CALENDAR_LAYOUT_CLASS.copy}>
          <span className={STAFF_CALENDAR_LAYOUT_CLASS.cardTitle}>
            {t(STAFF_CALENDAR_I18N.appointmentTitle, {
              customer: appointment.customerName,
              service: appointment.serviceNames.join(', '),
            })}
          </span>
          <span className={STAFF_CALENDAR_LAYOUT_CLASS.meta}>
            {t(STAFF_CALENDAR_I18N.appointmentMeta, {
              time: timeLabel,
              minutes: appointment.durationMinutes,
              ticket: appointment.orderNumber,
            })}
          </span>
        </span>
        {statusKey ? (
          <span
            className={`${STAFF_CALENDAR_LAYOUT_CLASS.status} ${calendarAppointmentStatusClass(appointment.status)}`}
          >
            {t(statusKey)}
          </span>
        ) : null}
      </span>
    </Link>
  )
}

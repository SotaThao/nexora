import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CalendarCheck } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import type { TFunction } from '../../../types/contexts'
import { formatDateIsoInTimeZone } from '../../../utils/localDate'
import { staffWorkOrdersPath } from '../work-orders/constants'
import {
  calendarAppointmentBarClass,
  calendarAppointmentCardClass,
  calendarAppointmentStatusClass,
  calendarDayClass,
  STAFF_CALENDAR_I18N,
  STAFF_CALENDAR_LAYOUT_CLASS,
  STAFF_CALENDAR_STATUS_I18N,
  STAFF_CALENDAR_TIME_ZONE,
  type StaffCalendarAppointment,
} from './constants'
import {
  calendarWeekDays,
  formatCalendarDuration,
  formatCalendarTime,
  formatCalendarWeekday,
  parseCalendarDateKey,
  toCalendarDateKey,
  totalAppointmentDuration,
} from './calendarUtils'
import StaffMyCalendarSkeleton from './StaffMyCalendarSkeleton'
import { useStaffCalendarAppointments } from './useStaffCalendarAppointments'

export default function StaffMyCalendar() {
  const { t, currentLanguage } = useTranslation()
  const [searchParams] = useSearchParams()
  const todayKey = useMemo(
    () => formatDateIsoInTimeZone(new Date(), STAFF_CALENDAR_TIME_ZONE),
    [],
  )
  const [selectedDate, setSelectedDate] = useState(() => {
    const requested = parseCalendarDateKey(searchParams.get('date'))
    return requested ? toCalendarDateKey(requested) : todayKey
  })
  const salonId = searchParams.get('salon')?.trim() || undefined
  const { isPending, appointments } = useStaffCalendarAppointments(selectedDate, todayKey)
  const weekDays = calendarWeekDays(selectedDate)
  const selectedDateValue = parseCalendarDateKey(selectedDate)
  const headingWeekday = selectedDateValue
    ? formatCalendarWeekday(selectedDateValue, currentLanguage, 'long')
    : ''
  const headingKey =
    appointments.length === 1 ? STAFF_CALENDAR_I18N.headingOne : STAFF_CALENDAR_I18N.heading
  const totalDuration = totalAppointmentDuration(appointments)
  const workOrdersHref = staffWorkOrdersPath(salonId)

  return (
    <div className={STAFF_CALENDAR_LAYOUT_CLASS.page} data-selected-date={selectedDate}>
      <section className={STAFF_CALENDAR_LAYOUT_CLASS.calendar}>
        <div className={STAFF_CALENDAR_LAYOUT_CLASS.header}>
          <div>
            <div className={STAFF_CALENDAR_LAYOUT_CLASS.kicker}>{t(STAFF_CALENDAR_I18N.kicker)}</div>
            <h1 className={STAFF_CALENDAR_LAYOUT_CLASS.title}>{t(STAFF_CALENDAR_I18N.title)}</h1>
          </div>
          <button
            className={STAFF_CALENDAR_LAYOUT_CLASS.todayButton}
            type="button"
            onClick={() => setSelectedDate(todayKey)}
          >
            {t(STAFF_CALENDAR_I18N.today)}
          </button>
        </div>

        <div className={STAFF_CALENDAR_LAYOUT_CLASS.weekShell}>
          <div
            className={STAFF_CALENDAR_LAYOUT_CLASS.week}
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
                  onClick={() => setSelectedDate(day.key)}
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
          ) : appointments.length === 0 ? (
            <CalendarEmptyState t={t} />
          ) : (
            <div className={STAFF_CALENDAR_LAYOUT_CLASS.list}>
              {appointments.map((appointment) => (
                <CalendarAppointmentRow
                  key={appointment.ticket}
                  appointment={appointment}
                  language={currentLanguage}
                  salonId={salonId}
                  t={t}
                />
              ))}
            </div>
          )}
        </section>

        <Link to={workOrdersHref} className={STAFF_CALENDAR_LAYOUT_CLASS.back}>
          <ArrowLeft className={STAFF_CALENDAR_LAYOUT_CLASS.backIcon} aria-hidden="true" />
          {t(STAFF_CALENDAR_I18N.back)}
        </Link>
      </section>
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
  const timeLabel = formatCalendarTime(appointment.time, language)
  const statusKey = STAFF_CALENDAR_STATUS_I18N[appointment.status]
  const href = salonId
    ? staffWorkOrdersPath(salonId, appointment.ticket)
    : staffWorkOrdersPath()

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
              customer: appointment.customer,
              service: appointment.service,
            })}
          </span>
          <span className={STAFF_CALENDAR_LAYOUT_CLASS.meta}>
            {t(STAFF_CALENDAR_I18N.appointmentMeta, {
              time: timeLabel,
              minutes: appointment.duration,
              ticket: appointment.ticket,
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

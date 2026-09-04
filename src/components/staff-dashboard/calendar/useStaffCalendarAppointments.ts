import { useEffect, useState } from 'react'
import { appointmentsForDate } from './calendarUtils'
import {
  STAFF_CALENDAR_LOAD_DELAY_MS,
  type StaffCalendarAppointment,
} from './constants'

export function useStaffCalendarAppointments(dateKey: string, todayKey: string) {
  const [isPending, setIsPending] = useState(true)
  const [appointments, setAppointments] = useState<StaffCalendarAppointment[]>([])

  useEffect(() => {
    let cancelled = false
    setIsPending(true)
    setAppointments([])

    const timer = window.setTimeout(() => {
      if (cancelled) return
      setAppointments(appointmentsForDate(dateKey, todayKey))
      setIsPending(false)
    }, STAFF_CALENDAR_LOAD_DELAY_MS)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [dateKey, todayKey])

  return { isPending, appointments }
}

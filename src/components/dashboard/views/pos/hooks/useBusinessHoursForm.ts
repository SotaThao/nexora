// useBusinessHoursForm — POS > General Settings > Business Hours edit state +
// save mutation (US-014). Lives under POS now instead of the general Settings
// hook, per the decision to move Business Hours out of Settings and into POS
// (originally its own POS screen, later merged into PosGeneralSettingsView).
//
// Unlike Business Info, Business Hours is operational data with no KYB
// significance — POS Owner Setup features work regardless of KYB status — so
// editing is never gated behind verification status here.
import { useState } from 'react'
import { useNotification } from '../../../../../contexts/NotificationContext'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useBusinessHours, useUpdateBusinessHours } from '../../../../../data/hooks/useMerchantSetup'
import type { BusinessHourEntry } from '../../../../../types/domain'

type SettingsFormErrors = Record<string, string>

// Fixed Sunday-first order, matching the backend's DayOfWeek-ordered response
// (Sunday=0..Saturday=6).
const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

// <input type="time"> works with "HH:mm"; the API uses TimeOnly ("HH:mm:ss").
const toApiTime = (hhmm: string): string | null => (hhmm ? `${hhmm}:00` : null)
const fromApiTime = (hhmmss?: string | null): string => (hhmmss ? hhmmss.slice(0, 5) : '')

// Matches the backend's default for a day with no saved row yet (GetBusinessHoursQuery):
// open every day, 9 AM - 7 PM.
const buildDefaultHoursForm = (): BusinessHourEntry[] =>
  DAYS_OF_WEEK.map((dayOfWeek) => ({ dayOfWeek, isOpen: true, openTime: '09:00', closeTime: '19:00' }))

// One error entry per dayOfWeek key (Rule 6: one continuous open/close range per day).
const validateHoursForm = (days: BusinessHourEntry[]): SettingsFormErrors => {
  const errors: SettingsFormErrors = {}
  days.forEach((day) => {
    if (!day.isOpen) return
    if (!day.openTime || !day.closeTime) {
      errors[day.dayOfWeek] = 'required'
    } else if (day.closeTime <= day.openTime) {
      errors[day.dayOfWeek] = 'invalidRange'
    }
  })
  return errors
}

export default function useBusinessHoursForm(_options: { verificationStatus?: string } = {}) {
  const { t } = useTranslation()
  const { showToast: notify } = useNotification()
  const businessHoursQuery = useBusinessHours()
  const updateBusinessHoursMutation = useUpdateBusinessHours()

  const businessHours = businessHoursQuery.data ?? buildDefaultHoursForm()

  const [isEditingHours, setIsEditingHours] = useState(false)
  const [hoursForm, setHoursForm] = useState<BusinessHourEntry[]>(buildDefaultHoursForm())
  const [hoursErrors, setHoursErrors] = useState<SettingsFormErrors>({})

  const startEditHours = () => {
    setHoursErrors({})
    setHoursForm(
      businessHours.map((day) => ({
        dayOfWeek: day.dayOfWeek,
        isOpen: day.isOpen,
        openTime: fromApiTime(day.openTime),
        closeTime: fromApiTime(day.closeTime),
      })),
    )
    setIsEditingHours(true)
  }

  const updateHoursDay = (dayOfWeek: string, patch: Partial<BusinessHourEntry>) => {
    setHoursForm((current) =>
      current.map((day) => (day.dayOfWeek === dayOfWeek ? { ...day, ...patch } : day)),
    )
    setHoursErrors((current) => {
      if (!current[dayOfWeek]) return current
      const next = { ...current }
      delete next[dayOfWeek]
      return next
    })
  }

  const saveHours = (e: { preventDefault: () => void }) => {
    e.preventDefault()
    const errors = validateHoursForm(hoursForm)
    setHoursErrors(errors)
    if (Object.keys(errors).length > 0) return

    const days = hoursForm.map((day) => ({
      dayOfWeek: day.dayOfWeek,
      isOpen: day.isOpen,
      openTime: day.isOpen ? toApiTime(day.openTime || '') : null,
      closeTime: day.isOpen ? toApiTime(day.closeTime || '') : null,
    }))

    updateBusinessHoursMutation.mutate(days, {
      onSuccess: () => {
        notify(t('components.settings.hooks.useSettingsForm.settingsUpdatedSuccessfully'))
        setIsEditingHours(false)
      },
    })
  }

  return {
    businessHours,
    isEditingHours,
    setIsEditingHours,
    hoursForm,
    hoursErrors,
    startEditHours,
    updateHoursDay,
    saveHours,
  }
}

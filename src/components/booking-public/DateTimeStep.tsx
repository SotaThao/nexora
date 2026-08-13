// DateTimeStep — POS Booking public wizard, step 2 (Ticket 5). Customer picks a date, then
// a list of time buttons computed by GetPublicAvailabilityQuery (already filtered to
// business hours, lead-time/advance window, technician schedule, and existing conflicts).
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'
import { usePublicAvailability } from '../../data/hooks/usePublicBooking'
import { formatHHmmTo12Hour } from '../../utils/bookingTimeFormat'
import type { PublicAvailabilityItemPayload } from '../../types/repositories'

export default function DateTimeStep({
  businessSlug,
  items,
  onContinue,
  onBack,
  excludeBookingId,
}: {
  businessSlug: string
  items: PublicAvailabilityItemPayload[]
  onContinue: (date: string, time: string) => void
  onBack: () => void
  // Set by the Manage-Booking reschedule flow (Ticket 8) so a booking's own existing slot
  // never shows as a conflict against itself.
  excludeBookingId?: string
}) {
  const { t, currentLanguage } = useTranslation()
  const timeLocale = currentLanguage === 'vi' ? 'vi-VN' : 'en-US'
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const availability = usePublicAvailability(businessSlug)

  useEffect(() => {
    if (!selectedDate) return
    setSelectedTime('')
    availability.mutate({ date: selectedDate, items, excludeBookingId })
    // Only re-fetch when the date changes — `items`/`excludeBookingId` are stable for the
    // lifetime of this step.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate])

  const handleContinue = () => {
    if (!selectedDate || !selectedTime) return
    onContinue(selectedDate, selectedTime)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-extrabold text-nexoraText">{t('public.booking.pickDateTitle')}</h2>

      <div>
        <label className="mb-1 block text-[10px] font-extrabold uppercase text-nexoraMuted">
          {t('public.booking.dateLabel')}
        </label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="h-10 w-full rounded-lg border border-nexoraBorder bg-white px-3.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand"
        />
      </div>

      {selectedDate ? (
        availability.isPending ? (
          <div className="flex items-center justify-center gap-2 py-6 text-xs text-nexoraMuted">
            <Loader2 className="h-4 w-4 animate-spin text-nexoraBrand" />
            {t('public.booking.loadingSlots')}
          </div>
        ) : (availability.data?.availableTimes.length ?? 0) === 0 ? (
          <p className="py-4 text-center text-xs text-nexoraMuted">
            {availability.data?.holidayReason
              ? availability.data.adjustedOpenTime && availability.data.adjustedCloseTime
                ? t('public.booking.adjustedHoursNoSlots', {
                    reason: availability.data.holidayReason,
                    open: formatHHmmTo12Hour(availability.data.adjustedOpenTime, timeLocale),
                    close: formatHHmmTo12Hour(availability.data.adjustedCloseTime, timeLocale),
                  })
                : t('public.booking.closedForHoliday', { reason: availability.data.holidayReason })
              : t('public.booking.noSlotsAvailable')}
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {availability.data!.availableTimes.map((time) => (
              <button
                key={time}
                type="button"
                onClick={() => setSelectedTime(time)}
                className={`h-10 rounded-lg border text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
                  selectedTime === time
                    ? 'border-nexoraBrand bg-nexoraBrand text-white focus-visible:ring-nexoraBrand'
                    : 'border-nexoraBorder text-nexoraText hover:border-nexoraBrand focus-visible:ring-nexoraMuted'
                }`}
              >
                {formatHHmmTo12Hour(time, timeLocale)}
              </button>
            ))}
          </div>
        )
      ) : null}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onBack}
          className="h-10 flex-1 rounded-lg border border-nexoraBorder text-xs font-bold text-nexoraText hover:border-nexoraBrand"
        >
          {t('public.booking.backButton')}
        </button>
        <button
          type="button"
          onClick={handleContinue}
          disabled={!selectedDate || !selectedTime}
          className="h-10 flex-1 rounded-lg bg-nexoraBrand text-xs font-bold text-white hover:bg-nexoraBrandDark disabled:opacity-60"
        >
          {t('public.booking.continueButton')}
        </button>
      </div>
    </div>
  )
}

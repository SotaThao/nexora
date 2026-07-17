import type React from 'react'
import {
  formatNationalNumber,
  isValidPhoneE164,
  parsePhone,
} from '../../CountryCodeSelect'

export const EMPTY_CALL_DURATION = '00:00'

export const BOOKING_KPI_ACCENTS = {
  electric: { '--kpi-accent': 'var(--nexora-electric)' } as React.CSSProperties,
  success: { '--kpi-accent': 'var(--nexora-success)' } as React.CSSProperties,
  red: { '--kpi-accent': '#ef4444' } as React.CSSProperties,
  brand: { '--kpi-accent': 'var(--nexora-brand)' } as React.CSSProperties,
}

/** Local calendar date as `YYYY-MM-DD` (end-user timezone via Date getters). */
export function toLocalDateIso(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Call duration as `mm:ss`; empty/invalid → `00:00`. */
export function formatCallDurationSeconds(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds <= 0) return EMPTY_CALL_DURATION
  const total = Math.floor(seconds)
  const minutes = String(Math.floor(total / 60)).padStart(2, '0')
  const rest = String(total % 60).padStart(2, '0')
  return `${minutes}:${rest}`
}

/**
 * Format a voice/booking phone for display.
 * @param empty Value when phone is missing (Today uses `null`, Call Log `''`, Customers `'_'`).
 */
export function formatVoicePhoneDisplay(
  phone: string | null | undefined,
  empty: string | null = '',
): string | null {
  const raw = phone?.trim()
  if (!raw) return empty

  const parsed = parsePhone(raw)
  if (isValidPhoneE164(raw, parsed.countryCode)) {
    const national = formatNationalNumber(parsed.nationalNumber, parsed.countryCode)
    if (national.replace(/\D/g, '')) {
      return `${parsed.countryCode} ${national}`.trim()
    }
  }

  return raw
}

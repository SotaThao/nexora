import {
  PUBLIC_BOOKING_ROUTE,
  parsePublicBookingLang,
} from '../components/public/booking/constants'
import { getWebUrlOrigin } from './webUrlBase'

/**
 * Absolute public booking form URL for the current environment.
 * Origin: `VITE_VLINKPAY_WEB_URL_BASE` → else `window.location.origin`.
 * Shape: `{origin}/b/{businessKey}?lang=en|vi`
 */
export function buildPublicBookingFormUrl(
  businessKey?: string | null,
  lang?: string | null,
): string {
  const key = String(businessKey ?? '').trim()
  if (!key) return ''

  const origin = (
    getWebUrlOrigin() ||
    (typeof window !== 'undefined' ? window.location.origin : '')
  ).replace(/\/$/, '')
  if (!origin) return ''

  const url = new URL(`${origin}/b/${encodeURIComponent(key)}`)
  url.searchParams.set(
    PUBLIC_BOOKING_ROUTE.langQuery,
    parsePublicBookingLang(lang),
  )
  return url.toString()
}

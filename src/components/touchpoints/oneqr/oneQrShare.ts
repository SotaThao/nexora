import { getWebUrlOrigin } from '../../../utils/webUrlBase'
import { buildOneQrPath } from '../../../constants/oneQr'
import type { OneQr } from '../../../types/oneQr'

/**
 * `OneQrConfigDto` has no `businessSlug`, but `url` always ends in `/o/{slug}`.
 */
export function slugFromUrl(url: string): string {
  const last = String(url || '')
    .split('?')[0]
    .split('/')
    .filter(Boolean)
    .pop()
  return last && last !== 'o' ? last : ''
}

/**
 * The share URL is rebuilt on this app's own origin rather than echoing
 * `oneQr.url`.
 *
 * `oneQr.url` is cached by the backend at create time from *its* `FrontEndUrl`
 * setting, so a backend pointed at `localhost:3000` hands that string to every
 * environment. `getWebUrlOrigin()` (`VITE_VLINKPAY_WEB_URL_BASE`, falling back
 * to the live origin) is the repo-wide rule for anything a customer will open
 * or scan — see `src/utils/webUrlBase.ts`.
 *
 * Falls back to the server string when the origin cannot be determined (native
 * shell, missing env), so the card is never left without a link.
 */
export function buildShareUrl(oneQr: OneQr): string {
  const slug = slugFromUrl(oneQr.url)
  const origin = getWebUrlOrigin()
  if (!slug || !origin) return oneQr.url
  return `${origin}${buildOneQrPath(slug)}`
}

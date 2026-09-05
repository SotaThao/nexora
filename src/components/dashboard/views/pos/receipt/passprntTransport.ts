/**
 * The Star PassPRNT path: hand a receipt to the companion app over its URL scheme, and read the
 * outcome back off the URL it returns to.
 *
 * Star ships no npm package — their "SDK for Web" is a single sample HTML file — so the URL is
 * built here. Parameter names and values are from the PassPRNT Users Manual (iOS, Data
 * Specifications); the launch and callback shape follow their sample verbatim.
 *
 * Two things about this integration are unusual enough to state plainly:
 *
 * 1. Printing navigates away. There is no promise to await — control returns on a later page load
 *    with `passprnt_code` in the query string, into a freshly mounted app.
 * 2. `back` carries no query string of its own. PassPRNT appends its result params, and its
 *    behaviour when `back` already contains a `?` is undocumented. Rather than gamble on it, every
 *    piece of state needed to resume lives in the persisted print job instead.
 */
import {
  PASSPRNT_CODE_PARAM,
  PASSPRNT_MAX_ENCODED_HTML_LENGTH,
  PASSPRNT_MESSAGE_PARAM,
  PASSPRNT_PRINT_PATH,
  PASSPRNT_TIMEOUT_SECONDS,
  PassPrntCode,
  PassPrntCut,
  PassPrntPopup,
  POS_PRINTER_I18N_PREFIX,
  type PassPrntCutType,
  type PassPrntDrawerType,
} from '../../../../../constants/posPrinter'

export interface PassPrntUrlInput {
  html: string
  /** Absolute app URL, path only — see the note above. */
  backUrl: string
  widthDots: number
  cut?: PassPrntCutType
  drawer?: PassPrntDrawerType
}

export type PassPrntUrlResult =
  | { url: string; encodedLength: number }
  | { tooLarge: true; encodedLength: number }

export interface PassPrntCallback {
  code: string
  message: string
  ok: boolean
}

/**
 * Builds the launch URL, or refuses when the payload is over budget.
 *
 * The refusal matters: past the limit PassPRNT answers with error 3, and iOS may truncate the URL
 * before it even gets there. Both surface to the operator as blank or half-printed paper with
 * nothing to trace, so it is far better to never navigate and fall back to the browser dialog.
 */
export function buildPassPrntUrl(input: PassPrntUrlInput): PassPrntUrlResult {
  const encodedHtml = encodeURIComponent(input.html)
  if (encodedHtml.length > PASSPRNT_MAX_ENCODED_HTML_LENGTH) {
    return { tooLarge: true, encodedLength: encodedHtml.length }
  }

  const params = [
    `back=${encodeURIComponent(input.backUrl)}`,
    `html=${encodedHtml}`,
    `size=${input.widthDots}`,
    `cut=${input.cut ?? PassPrntCut.Partial}`,
    // Suppress PassPRNT's own error dialog: we report the returned code ourselves, in the
    // operator's language and next to a retry they can actually use.
    `popup=${PassPrntPopup.Disable}`,
    `timeout=${PASSPRNT_TIMEOUT_SECONDS}`,
  ]
  if (input.drawer) params.push(`drawer=${input.drawer}`)

  return { url: `${PASSPRNT_PRINT_PATH}?${params.join('&')}`, encodedLength: encodedHtml.length }
}

/** Strips any query string — PassPRNT appends its own params to whatever it is given. */
export function buildPassPrntBackUrl(origin: string, path: string): string {
  const cleanPath = path.split('?')[0].split('#')[0]
  return `${origin.replace(/\/$/, '')}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`
}

export function parsePassPrntCallback(params: URLSearchParams): PassPrntCallback | null {
  const code = params.get(PASSPRNT_CODE_PARAM)
  if (code === null) return null
  return {
    code,
    message: params.get(PASSPRNT_MESSAGE_PARAM) ?? '',
    ok: code === PassPrntCode.Success,
  }
}

/** Returns a copy with the callback params removed, for a `replace: true` history update. */
export function stripPassPrntCallbackParams(params: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(params)
  next.delete(PASSPRNT_CODE_PARAM)
  next.delete(PASSPRNT_MESSAGE_PARAM)
  return next
}

const KNOWN_ERROR_CODES: string[] = Object.values(PassPrntCode).filter(
  (code) => code !== PassPrntCode.Success,
)

/**
 * Maps a returned code to its message key. Unknown codes fall back rather than showing a raw
 * number — PassPRNT's own message text is not localized and is often too terse to act on.
 */
export function getPassPrntErrorI18nKey(code: string | null | undefined): string {
  const base = `${POS_PRINTER_I18N_PREFIX}.passprntError`
  return code && KNOWN_ERROR_CODES.includes(code) ? `${base}.${code}` : `${base}.unknown`
}

/** Navigation, isolated so tests can assert on the URL without leaving jsdom. */
export function firePassPrnt(url: string): void {
  if (typeof window === 'undefined') return
  window.location.assign(url)
}

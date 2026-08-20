// `<input type="time">` renders its own clock in the browser/OS locale, which is 24h for vi-VN and
// many other locales. The `-u-hc-h12` Unicode extension on the element's `lang` forces the AM/PM
// widget regardless — the value the input reports is still `HH:mm`, only the rendering changes.

/** Default `lang` for a 12h `<input type="time">` / `datetime-local`. */
export const TWELVE_HOUR_INPUT_LANG = 'en-US-u-hc-h12'

/** Same, keeping the AM/PM wording of a specific UI locale (`'vi'` → `vi-VN-u-hc-h12`). */
export function toTwelveHourLangTag(locale?: string | null): string {
  const tag = String(locale ?? '').toLowerCase().startsWith('vi') ? 'vi-VN' : 'en-US'
  return `${tag}-u-hc-h12`
}

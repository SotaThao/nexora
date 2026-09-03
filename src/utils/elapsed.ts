/**
 * How long ago something happened, as raw numbers. i18n-free on purpose: the caller picks the
 * `common.elapsed_*` key so English and Vietnamese can word it differently.
 *
 * Takes an already-parsed Date rather than an API string so this file stays dependency-free —
 * callers pass `parseApiDateTime(iso)`, which is what normalizes the backend's offset-less
 * "timestamp without time zone" values to UTC.
 */
export interface Elapsed {
  seconds: number
  minutes: number
  hours: number
}

export function elapsedSince(date: Date | null | undefined, now: Date = new Date()): Elapsed | null {
  if (!date) return null

  const ms = now.getTime() - date.getTime()
  // A clock-skewed device can put a server timestamp slightly in the future; read that as "just
  // now" rather than a negative age.
  const seconds = Math.max(0, Math.floor(ms / 1000))

  return {
    seconds,
    minutes: Math.floor(seconds / 60),
    hours: Math.floor(seconds / 3600),
  }
}

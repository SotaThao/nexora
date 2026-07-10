export const VOICE_TRIAL_DAY_KEY_TO_API = {
  sun: 'CN',
  mon: 'T2',
  tue: 'T3',
  wed: 'T4',
  thu: 'T5',
  fri: 'T6',
  sat: 'T7',
} as const

export type VoiceTrialDayKey = keyof typeof VOICE_TRIAL_DAY_KEY_TO_API

export interface SubmitVoiceTrialRequest {
  shopName: string
  ownerName: string
  phoneNumber: string
  email: string
  cityArea?: string | null
  services: string[]
  openingDays: string[]
  serviceHoursFrom: string
  serviceHoursTo: string
  biggestProblem: string
  referralCode?: string | null
}

export type SubmitVoiceTrialRequestResponse = string

export function mapDayKeysToApiOpeningDays(dayKeys: Iterable<string>): string[] {
  return [...dayKeys]
    .map((key) => VOICE_TRIAL_DAY_KEY_TO_API[key as VoiceTrialDayKey])
    .filter(Boolean)
}

/** Converts UI labels like `9:30 AM` or `09:30` to API format `09:30`. */
export function formatTrialTimeLabelToApi(timeLabel: string): string {
  const trimmed = timeLabel.trim()
  const match24 = trimmed.match(/^(\d{1,2}):(\d{2})$/)
  if (match24) {
    return `${String(Number.parseInt(match24[1], 10)).padStart(2, '0')}:${match24[2]}`
  }

  const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) return trimmed

  let hours = Number.parseInt(match[1], 10)
  const minutes = match[2]
  const period = match[3].toUpperCase()

  if (period === 'PM' && hours !== 12) hours += 12
  if (period === 'AM' && hours === 12) hours = 0

  return `${String(hours).padStart(2, '0')}:${minutes}`
}

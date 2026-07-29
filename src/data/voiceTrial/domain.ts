export const VOICE_TRIAL_DAY_KEY_TO_API = {
  sun: 'Sunday',
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
} as const

export type VoiceTrialDayKey = keyof typeof VOICE_TRIAL_DAY_KEY_TO_API

/** Public marketing entry: `/voice-call/plan?package=trial` */
export enum VoiceCallPlanPackage {
  Trial = 'trial',
}

export const VoiceCallPlanRoute = {
  path: '/voice-call/plan',
  packageQuery: 'package',
} as const

/** Same copy key as BookingTrialModal success toast. */
export const VOICE_CALL_TRIAL_COPY_KEY =
  'components.dashboard.views.BookingHubView.plans.trial' as const

/** Seconds shown on the public trial success screen before auto home redirect. */
export const VOICE_CALL_PLAN_SUCCESS_REDIRECT_SECONDS = 5

/** Countdown tick interval on the public trial success screen. */
export const VOICE_CALL_PLAN_COUNTDOWN_TICK_MS = 1000

/** Wait so success toast/message is readable before leaving the public trial landing. */
export const VOICE_CALL_PLAN_SUCCESS_REDIRECT_MS =
  VOICE_CALL_PLAN_SUCCESS_REDIRECT_SECONDS * VOICE_CALL_PLAN_COUNTDOWN_TICK_MS

export function isVoiceCallTrialPackage(value: string | null | undefined): boolean {
  return value === VoiceCallPlanPackage.Trial
}

export enum VoiceTrialFormField {
  Salon = 'salon',
  Owner = 'owner',
  Phone = 'phone',
  OwnerPhone = 'ownerPhone',
  Email = 'email',
  City = 'city',
  Referral = 'referral',
  PainPoint = 'painPoint',
  CustomServiceInput = 'customServiceInput',
}

export interface SubmitVoiceTrialRequest {
  shopName: string
  ownerName: string
  phoneNumber: string
  email: string
  cityArea?: string | null
  website?: string | null
  services: string[]
  openingDays: string[]
  serviceHoursFrom: string
  serviceHoursTo: string
  biggestProblem: string
  referralCode?: string | null
}

export type SubmitVoiceTrialRequestOptions = {
  anonymous?: boolean
}

export type SubmitVoiceTrialRequestResponse = string

export enum VoiceTrialRequestStatus {
  Pending = 0,
  Done = 1,
  Rejected = 2,
}

export interface VoiceTrialRequestDetailDto {
  id: string
  shopName: string
  ownerName: string
  phoneNumber: string
  email: string
  cityArea: string | null
  website: string | null
  services: string[]
  openingDays: string[]
  serviceHoursFrom: string
  serviceHoursTo: string
  biggestProblem: string
  referralCode: string | null
  status: VoiceTrialRequestStatus
  rejectionNote: string | null
  createdAt: string
  lastModified: string | null
}

export function mapDayKeysToApiOpeningDays(
  dayKeys: Iterable<string>,
): string[] {
  return [...dayKeys]
    .map(key => VOICE_TRIAL_DAY_KEY_TO_API[key as VoiceTrialDayKey])
    .filter(Boolean)
}

/** Converts UI labels like `9:30 AM` or `09:30` to API format `09:30`. */
export function formatTrialTimeLabelToApi(timeLabel: string): string {
  const minutes = trialClockMinutes(timeLabel)
  if (minutes === null) return timeLabel.trim()
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

/** Display label for trial / settings-style hours: `7:00 AM`. */
export function formatTrialApiTimeToLabel(hhmm: string): string {
  const minutes = trialClockMinutes(hhmm)
  if (minutes === null) return hhmm.trim()
  let hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  const period = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  if (hours === 0) hours = 12
  return `${hours}:${String(mins).padStart(2, '0')} ${period}`
}

/** Minutes from midnight for `7:00 AM` / `09:30` labels; null if invalid. */
export function trialClockMinutes(value: string): number | null {
  const text = (value || '').trim().toUpperCase()
  const twelveHour = text.match(/^(\d{1,2})(?::([0-5]\d))?\s*(AM|PM)$/)
  if (twelveHour) {
    let hour = Number(twelveHour[1])
    const minute = Number(twelveHour[2] || 0)
    if (hour < 1 || hour > 12) return null
    if (twelveHour[3] === 'AM' && hour === 12) hour = 0
    if (twelveHour[3] === 'PM' && hour !== 12) hour += 12
    return hour * 60 + minute
  }

  const twentyFourHour = text.match(/^([01]?\d|2[0-3]):([0-5]\d)$/)
  if (!twentyFourHour) return null
  return Number(twentyFourHour[1]) * 60 + Number(twentyFourHour[2])
}

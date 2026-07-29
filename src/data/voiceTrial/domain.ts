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
  langQuery: 'lang',
} as const

export const VoiceCallPlanLang = {
  En: 'en',
  Vi: 'vi',
} as const

export type VoiceCallPlanLangCode =
  (typeof VoiceCallPlanLang)[keyof typeof VoiceCallPlanLang]

const VOICE_CALL_PLAN_LANG_ALIASES: Record<string, VoiceCallPlanLangCode> = {
  en: VoiceCallPlanLang.En,
  eng: VoiceCallPlanLang.En,
  english: VoiceCallPlanLang.En,
  vi: VoiceCallPlanLang.Vi,
  vn: VoiceCallPlanLang.Vi,
  vie: VoiceCallPlanLang.Vi,
  vietnamese: VoiceCallPlanLang.Vi,
}

/** `?lang=` → en | vi. Missing/unknown defaults to English. */
export function parseVoiceCallPlanLang(
  raw: string | null | undefined,
): VoiceCallPlanLangCode {
  const value = String(raw ?? '')
    .trim()
    .toLowerCase()
  return VOICE_CALL_PLAN_LANG_ALIASES[value] || VoiceCallPlanLang.En
}

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

/** API `dayOfWeek` string enum for trial operating hours. */
export enum VoiceTrialDayOfWeek {
  Sunday = 'Sunday',
  Monday = 'Monday',
  Tuesday = 'Tuesday',
  Wednesday = 'Wednesday',
  Thursday = 'Thursday',
  Friday = 'Friday',
  Saturday = 'Saturday',
}

export const VOICE_TRIAL_OPERATING_DAY_ORDER: readonly VoiceTrialDayOfWeek[] = [
  VoiceTrialDayOfWeek.Monday,
  VoiceTrialDayOfWeek.Tuesday,
  VoiceTrialDayOfWeek.Wednesday,
  VoiceTrialDayOfWeek.Thursday,
  VoiceTrialDayOfWeek.Friday,
  VoiceTrialDayOfWeek.Saturday,
  VoiceTrialDayOfWeek.Sunday,
] as const

/** UI day keys Monday-first — same order as operating-hours payload. */
export const VOICE_TRIAL_UI_DAY_ORDER = [
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
  'sun',
] as const

export interface VoiceTrialOperatingHour {
  dayOfWeek: VoiceTrialDayOfWeek
  isOpen: boolean
  /** `HH:mm:ss` when open; omit when closed. */
  openTime?: string | null
  /** `HH:mm:ss` when open; omit when closed. */
  closeTime?: string | null
}

export interface VoiceTrialHourRow {
  open: boolean
  openTime: string
  closeTime: string
}

export interface SubmitVoiceTrialRequest {
  shopName: string
  ownerName: string
  phoneNumber: string
  ownerPhoneNumber?: string | null
  email: string
  cityArea?: string | null
  website?: string | null
  services: string[]
  priceListImageUrls?: string[]
  /** Preferred weekly schedule — server derives legacy fields from this. */
  operatingHours?: VoiceTrialOperatingHour[]
  /** Legacy — only when `operatingHours` is omitted. */
  openingDays?: string[]
  /** Legacy — only when `operatingHours` is omitted. */
  serviceHoursFrom?: string
  /** Legacy — only when `operatingHours` is omitted. */
  serviceHoursTo?: string
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
  ownerPhoneNumber: string | null
  email: string
  cityArea: string | null
  website: string | null
  services: string[]
  priceListImageUrls: string[] | null
  operatingHours: VoiceTrialOperatingHour[] | null
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

/** API operating-hours time: `HH:mm:ss`. */
export function formatTrialTimeToApiHHmmss(timeLabel: string): string {
  const hhmm = formatTrialTimeLabelToApi(timeLabel)
  if (/^\d{2}:\d{2}$/.test(hhmm)) return `${hhmm}:00`
  if (/^\d{2}:\d{2}:\d{2}$/.test(hhmm)) return hhmm
  return hhmm
}

/**
 * Build preferred `operatingHours` payload (Monday-first).
 * Closed days omit times — server stores them as null.
 */
export function toVoiceTrialOperatingHours(
  hoursByDay: Record<string, VoiceTrialHourRow>,
): VoiceTrialOperatingHour[] {
  return VOICE_TRIAL_UI_DAY_ORDER.map((dayKey) => {
    const row = hoursByDay[dayKey]
    const dayOfWeek = VOICE_TRIAL_DAY_KEY_TO_API[dayKey] as VoiceTrialDayOfWeek
    if (!row?.open) {
      return { dayOfWeek, isOpen: false }
    }
    return {
      dayOfWeek,
      isOpen: true,
      openTime: formatTrialTimeToApiHHmmss(row.openTime),
      closeTime: formatTrialTimeToApiHHmmss(row.closeTime),
    }
  })
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

  const twentyFourHour = text.match(/^([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/)
  if (!twentyFourHour) return null
  return Number(twentyFourHour[1]) * 60 + Number(twentyFourHour[2])
}

/** Client limits aligned with API validation. */
export const VOICE_TRIAL_LIMITS = {
  shopNameMax: 200,
  ownerNameMax: 150,
  phoneMax: 50,
  ownerPhoneMax: 50,
  emailMax: 254,
  cityAreaMax: 200,
  websiteMax: 500,
  priceListUrlsMax: 10,
  priceListUrlMax: 500,
  biggestProblemMax: 500,
  referralCodeMax: 100,
  priceListFileMaxBytes: 10 * 1024 * 1024,
} as const

export const VOICE_TRIAL_PRICE_LIST_ACCEPT =
  '.png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp'

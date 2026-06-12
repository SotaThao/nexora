export interface ApiError {
  status: number
  errorCode: string
  message?: string
  [key: string]: unknown
}

export function isApiError(err: unknown): err is ApiError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'errorCode' in err &&
    typeof (err as ApiError).errorCode === 'string'
  )
}

export function getApiErrorCode(err: unknown, fallback = 'HTTP_ERROR'): string {
  return isApiError(err) ? err.errorCode : fallback
}

export function asRecord(val: unknown): Record<string, unknown> {
  if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
    return val as Record<string, unknown>
  }
  return {}
}

// Alias used by StaffMember and StaffFormState for open-ended payout config maps
export type LooseObject = Record<string, unknown>

// Staff domain
export interface StaffMember {
  id: string
  fullName?: string
  nickname?: string
  position?: string
  avatar?: string
  phone?: string
  email?: string
  staffCode?: string
  showInTipsFlow?: boolean
  nexoraStaffId?: string
  payoutConfigs?: LooseObject
  paymentMethods?: PaymentMethodDto[]
  [key: string]: unknown
}

export interface PaymentMethodDto {
  id?: string
  type?: string
  isActive?: boolean
  isConfigured?: boolean
  accountInfo?: string
  imageUrl?: string | null
  accountName?: string | null
  [key: string]: unknown
}

export interface NotificationRecord {
  id: string
  type: string
  title: string
  read: boolean
  message: string
  time: string
  staffId?: string
  linkTab?: string
  body?: string
  [key: string]: unknown
}

export interface UserProfile {
  id?: string
  email?: string
  firstName?: string
  lastName?: string
  fullName?: string
  phoneNumber?: string
  profileImage?: { url?: string } | string
  userType?: string
  profileType?: string
  status?: string
  staffCode?: string
  [key: string]: unknown
}

export interface AuthSession {
  userId?: string
  email?: string
  fullName?: string
  role?: string
  accountStatus?: string
  accountType?: string
  hasStaffProfile?: boolean
  staffCode?: string
  hasCompletedOnboarding?: boolean
  isLoggedIn?: boolean
  [key: string]: unknown
}

export interface AuthTokens {
  accessToken?: string
  refreshToken?: string
  [key: string]: unknown
}

export interface StaffAccountView {
  profile?: UserProfile
  paymentMethods?: PaymentMethodDto[]
  staffCode?: string
  payoutMethods?: Record<string, { enabled?: boolean; value?: string; qrCode?: string; accountName?: string }>
  defaultDisplayName?: string
  phone?: string
  email?: string
  bio?: string
  avatar?: string
  [key: string]: unknown
}

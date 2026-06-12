import type { ApiError } from './api'

/** Escape hatch for legacy form/state blobs during incremental typing. */
export type LooseObject = Record<string, any>

/** Shared loose domain shapes — tighten incrementally per repository. */
export interface MerchantBusinessInfo {
  name?: string
  industry?: string
  address?: string
  phone?: string
  website?: string
  logo?: string | null
  [key: string]: unknown
}

export interface StaffMember {
  id?: string
  fullName?: string
  nickname?: string
  email?: string
  phone?: string
  isActive?: boolean
  showInTipsFlow?: boolean
  paymentAccounts?: Record<string, string>
  [key: string]: unknown
}

export interface ReviewLinks {
  googleReview?: string
  yelpReview?: string
  facebookReview?: string
  feedbackEmail?: string
}

export interface MerchantSetup {
  businessInfo?: MerchantBusinessInfo
  reviewLinks?: ReviewLinks
  staffList?: StaffMember[]
  touchPoints?: DomainEntity[]
  touchpoints?: DomainEntity[]
  [key: string]: unknown
}

export interface PaginatedResponse<T> {
  items: T[]
  pageNumber: number
  totalPages: number
  totalCount: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface PaymentMethodDto {
  id?: string
  type: string
  /** Normalized key for logos / payout modals (e.g. cashapp, zelle). */
  uiKey?: string
  accountInfo: string | null
  imageUrl?: string | null
  accountName?: string | null
  isActive: boolean
  isConfigured?: boolean
  businessKybStatus?: string | null
  name?: string
}

export interface TouchpointRecord {
  id?: string
  name?: string
  type?: string
  qrImageUrl?: string
  assignedStaffProfileId?: string
  [key: string]: unknown
}

export type TouchpointPage = PaginatedResponse<TouchpointRecord>

export interface NotificationRecord {
  id: string
  type: string
  title: string
  message: string
  actionUrl?: string | null
  isRead?: boolean
  read: boolean
  readAt?: string | null
  referenceId?: string | null
  createdAt?: string
  /** Alias of message for legacy UI */
  body?: string
  time: string
  staffId?: string
  linkTab?: string
  [key: string]: unknown
}

export interface NotificationsPage {
  items: NotificationRecord[]
  pageNumber: number
  totalPages: number
  totalCount: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export interface StaffInviteInfo {
  invitedName: string
  invitedPosition: string | null
  businessName: string
  businessAddress: string | null
}

export interface StaffSearchResult {
  staffProfileId: string
  staffCode: string | null
  fullName: string
  avatar: string | null
  position: string | null
}

export interface StaffBusinessLink {
  businessId: string
  businessName: string
  address: string | null
  city: string | null
  state: string | null
  logoUrl: string | null
  role: string | null
  roleLabel: string | null
  linkStatus: string | null
  linkStatusLabel: string | null
  linkedAt: string | null
}

export interface TipCountAmount {
  count: number
  totalAmount: number
}

export interface StaffDashboardSummary {
  todayTips: TipCountAmount
  thisMonthTips: TipCountAmount
  pendingTips: TipCountAmount
  averageRating: number
  totalReviews: number
}

export interface StaffReviewDistribution {
  star1: number
  star2: number
  star3: number
  star4: number
  star5: number
}

export interface StaffReviewsSummary {
  totalReviews: number
  averageRating: number
  distribution: StaffReviewDistribution
}

export interface StaffReviewItem {
  id: string
  rating: number
  comment: string | null
  customerName: string | null
  businessName: string | null
  createdAt: string | null
}

export interface StaffReviewsPage {
  summary: StaffReviewsSummary
  items: StaffReviewItem[]
  pageNumber: number
  totalPages: number
  totalCount: number
}

export type StaffTipStatus = 'Initiated' | 'Confirmed' | 'Skipped' | 'Completed' | string

export interface StaffTipItem {
  id: string
  amount: number
  totalAmount: number
  status: StaffTipStatus
  statusLabel: string | null
  paymentMethod: string | null
  isMultiStaff: boolean
  touchPointName: string | null
  businessName: string | null
  createdAt: string | null
  confirmedAt: string | null
  staffConfirmedAt: string | null
  merchantConfirmedAt: string | null
}

export interface StaffTipsPage {
  items: StaffTipItem[]
  pageNumber: number
  totalPages: number
  totalCount: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export interface StaffTipsConfirmReceiptResult {
  confirmedCount: number
  failedIds: string[]
}

export interface StaffLinkRequestDetail {
  id: string
  businessName: string
  businessLogoUrl: string | null
  businessRole: string | null
  requestedAt: string | null
  status: string | null
}

export interface StaffAccountView {
  id?: string
  profile: UserProfile
  paymentMethods: PaymentMethodDto[]
  tips: unknown[]
  staffReviews: unknown[]
  kpis: {
    totalTips: number
    averageTip: number
    totalTransactions: number
    averageRating: number
    isPending: boolean
  }
  staffCode?: string
  payoutMethods?: Record<string, {
    enabled?: boolean
    value?: string
    qrCode?: string
    accountName?: string
  }>
  defaultDisplayName?: string
  phone?: string
  email?: string
  bio?: string
  avatar?: string
}

export interface DomainEntity {
  id?: string
  name?: string
  status?: string
  amount?: number
  email?: string
  phone?: string
  fullName?: string
  [key: string]: unknown
}

export interface TransactionRecord extends DomainEntity {
  amount?: number
  status?: string
  staff?: StaffMember | string
  staffId?: string
  staffName?: string
  staffProfileId?: string | null
  businessName?: string
  paymentMethod?: string
  dateTime?: string
  touchpoint?: string
  touchPointId?: string | null
  confirmedAt?: string | null
  isMultiStaff?: boolean
  tipItems?: unknown[]
  [key: string]: unknown
}

export interface ReviewRecord extends DomainEntity {
  rating?: number
  comment?: string
  [key: string]: unknown
}

export interface UserProfile {
  id?: string
  fullName?: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  phoneNumber?: string
  profileImage?: { url?: string } | string
  userType?: string
  profileType?: string
  status?: string
  staffCode?: string
  staffProfileId?: string
  staffId?: string
  hasCompletedOnboarding?: boolean
  referralCode?: string
  [key: string]: unknown
}

export interface StaffProfile {
  staffCode?: string
  displayName?: string
  bio?: string
  photo?: string
  [key: string]: unknown
}

export interface StaffAccountBlob {
  fullName?: string
  phone?: string
  defaultDisplayName?: string
  bio?: string
  displayNamesByBusiness?: Record<string, string>
  pushPreferences?: Record<string, boolean>
  notificationsRead?: string[]
  confirmedTipIds?: string[]
  payoutMethods?: DomainEntity[]
  [key: string]: unknown
}

export interface FormErrors {
  [field: string]: string | undefined
}

export interface RegisterFormState {
  email?: string
  confirmEmail?: string
  password?: string
  confirmPassword?: string
  firstName?: string
  lastName?: string
  terms?: boolean
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

export function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

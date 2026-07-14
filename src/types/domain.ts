import type { ApiError } from './api'

/** Escape hatch for legacy form/state blobs during incremental typing. */
export type LooseObject = Record<string, any>

/** Shared loose domain shapes — tighten incrementally per repository. */
export interface MerchantBusinessInfo {
  id?: string
  businessId?: string
  name?: string
  slug?: string
  industry?: string
  address?: string
  phone?: string
  website?: string
  logo?: string | null
  createdAt?: string | null
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
  refCode?: string | null
  source?: string | null
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

/** Merchant direct-payment QR — GET /api/v1/merchant/payments/qr */
export interface MerchantPaymentQr {
  paymentUrl: string
  businessId: string
}

/** Staff direct-payment QR — GET /api/v1/staff/payments/qr */
export interface StaffPaymentQr {
  paymentUrl: string
  staffProfileId: string
}

/** Public direct-payment page — GET /api/v1/public/merchant/{businessId}/payment */
export interface PublicDirectPaymentMethod {
  id: string
  type: string
  uiKey?: string
  accountInfo: string
  imageUrl?: string | null
}

export interface PublicDirectPaymentPage {
  businessId: string
  businessName: string
  logoUrl?: string | null
  paymentUrl: string
  paymentMethods: PublicDirectPaymentMethod[]
}

/** Public staff direct-payment page — GET /api/v1/public/staff/{staffProfileId}/payment */
export interface PublicStaffDirectPaymentPage {
  staffProfileId: string
  displayName: string
  photoUrl?: string | null
  paymentUrl: string
  paymentMethods: PublicDirectPaymentMethod[]
}

export interface CreateDirectPaymentResult {
  paymentId: string
  amount: number
  type: number
  paymentMethod: PublicDirectPaymentMethod
}

/** GET /api/v1/public/payments/{paymentId}/status — lightweight status poll */
export interface DirectPaymentStatusSnapshot {
  paymentId: string
  status: PaymentStatusValue
  type: number
  amount: number
  createdAt: string
  customerConfirmedAt?: string | null
  merchantConfirmedAt?: string | null
}

/** PaymentType enum — DirectPayment = 0, StaffDirectPayment = 1 per direct-payment QR specs. */
export const PaymentType = {
  DirectPayment: 0,
  StaffDirectPayment: 1,
} as const

/** PaymentStatus enum — direct-payment-qr-flow state machine. */
export const PaymentStatus = {
  Initiated: 0,
  Confirmed: 1,
  Completed: 2,
} as const

export type PaymentTypeValue = (typeof PaymentType)[keyof typeof PaymentType]
export type PaymentStatusValue = (typeof PaymentStatus)[keyof typeof PaymentStatus]

/** Merchant payment ledger item — GET /api/v1/merchant/payments */
export interface MerchantPaymentRecord {
  id: string
  type: number
  amount: number
  status: PaymentStatusValue
  paymentMethodType: string
  createdAt: string
  customerConfirmedAt?: string | null
  merchantConfirmedAt?: string | null
  accountInfo?: string | null
  imageUrl?: string | null
}

export interface MerchantPaymentsListPage {
  items: MerchantPaymentRecord[]
  pageNumber: number
  pageSize: number
  totalPages: number
  totalCount: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface MerchantPaymentStatusBucket {
  count: number
  totalAmount: number
}

export interface MerchantPaymentMethodStat {
  method: string
  count: number
  totalAmount: number
}

/** GET /api/v1/merchant/payments/stats */
export interface MerchantPaymentStats {
  totalCount: number
  totalAmount: number
  averageAmount: number
  conversionRate: number
  mostUsedMethod: string | null
  byStatus: {
    initiated: MerchantPaymentStatusBucket
    confirmed: MerchantPaymentStatusBucket
    completed: MerchantPaymentStatusBucket
  }
  byPaymentMethod: MerchantPaymentMethodStat[]
}

/** Staff payment ledger item — GET /api/v1/staff/payments */
export interface StaffPaymentRecord {
  id: string
  type: number
  amount: number
  status: PaymentStatusValue
  paymentMethodType: string
  createdAt: string
  customerConfirmedAt?: string | null
  staffConfirmedAt?: string | null
  accountInfo?: string | null
  imageUrl?: string | null
}

export interface StaffPaymentsListPage {
  items: StaffPaymentRecord[]
  pageNumber: number
  pageSize: number
  totalPages: number
  totalCount: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface TouchpointRecord {
  id?: string
  name?: string
  slug?: string | null
  type?: string
  url?: string | null
  qrImageUrl?: string | null
  isActive?: boolean
  assignedStaffProfileId?: string | null
  createdAt?: string | null
  /** Normalized from API `totalScans` */
  scans?: number
  /** Normalized from API `totalRevenue` */
  revenue?: number
  deviceId?: string | null
  [key: string]: unknown
}

export interface PhysicalCardRecord {
  id: string
  cardCode: string
  helpCode?: string | null
  linkedTouchPointId?: string | null
  touchPointName?: string | null
  linkedAt?: string | null
}

export interface PhysicalCardDetail {
  id: string
  cardCode: string
  helpCode: string
  isActive: boolean
  linkedTouchPointId?: string | null
  touchPointName?: string | null
  touchPointUrl?: string | null
  linkedAt?: string | null
}

export interface QrTouchPointRef {
  id: string
  name: string
  slug: string
  type?: string
  businessId?: string
  businessName?: string
  businessSlug: string
}

export interface ResolveQrCodePayload {
  status: string
  touchPoint: QrTouchPointRef | null
}

export type PhysicalCardPage = PaginatedResponse<PhysicalCardRecord>

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
  /** Sub-tab within the 'reports' linkTab: 'tips' | 'direct_payments'. */
  reportsTab?: string
  paymentId?: string
  /** Tip transaction id (referenceId) to auto-open in the Tips list modal. */
  transactionId?: string
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
  invitedEmail?: string | null
  businessName: string
  businessAddress: string | null
  businessId?: string | null
  businessSlug?: string | null
  refCode?: string | null
  source?: string | null
}

export interface StaffSearchResult {
  staffProfileId: string
  staffCode: string | null
  fullName: string
  avatar: string | null
  position: string | null
  paymentMethods: PaymentMethodDto[]
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
  roleAtBusiness: string | null
  linkStatus: string | null
  linkStatusLabel: string | null
  linkedAt: string | null
  /** Canonical business slug for /touch/{businessSlug}/… (from API when available). */
  businessSlug?: string | null
  /** Business touch-point slug (e.g. master-store / FrontDesk), from API. */
  touchPointSlug?: string | null
  masterTouchPointSlug?: string | null
  /** Full customer tipping URL (from API when available). */
  tipUrl?: string | null
  /** Hosted QR PNG from touchpoint API (from API when available). */
  qrImageUrl?: string | null
  /** True when BE returned touchPoints: [] and no touchpoint slug/URL is available yet. */
  touchPointsMissing?: boolean
}

export interface StaffBusinessTipQr {
  businessId: string
  businessName: string
  displayName?: string | null
  businessSlug: string
  touchPointSlug: string
  tipUrl: string | null
  qrImageUrl: string | null
  linkStatus: string | null
  linkStatusLabel: string | null
  roleLabel: string | null
  roleAtBusiness: string | null
  logoUrl: string | null
  /** True when the business has no touchpoint data to build a tipping link. */
  tipLinkIncomplete?: boolean
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

export interface StaffStatisticsCategory {
  category: string
  amount: number
  percentageOfTotal: number
}

export interface StaffDashboardStatistics {
  availableBalance: number
  pending: number
  lifetimeEarnings: number
  categories: StaffStatisticsCategory[]
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

import type { TipStatusValue } from '../constants/tipStatus'

export type StaffTipStatus = TipStatusValue | string

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
  roleAtBusiness: string | null
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
  statusLabel?: string | null
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
  staffConfirmedAt?: string | null
  merchantConfirmedAt?: string | null
  isMultiStaff?: boolean
  isLocalStaff?: boolean
  tipItems?: unknown[]
  [key: string]: unknown
}

/** Result of POST /api/v1/merchant/tips/confirm-receipt (see US-025). */
export interface MerchantTipsConfirmReceiptResult {
  confirmedCount: number
  failedIds: string[]
}

export interface ReviewRecord extends DomainEntity {
  rating?: number
  comment?: string
  [key: string]: unknown
}

export interface UserSubscription {
  plan?: string
  status?: string
  trialEndsAt?: string | null
  currentPeriodEnd?: string | null
}

export interface UserProfile {
  id?: string
  /** Nested business summary from GET /api/v1/userprofile/me (BusinessSummaryDto). */
  business?: MerchantBusinessInfo | null
  fullName?: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  phoneNumber?: string
  profileImage?: {
    id?: string | null
    title?: string | null
    imageUrl?: string | null
    thumbnailUrl?: string | null
    url?: string
  } | string
  profileImageUrl?: string
  userType?: string
  profileType?: string
  status?: string
  staffCode?: string
  staffProfileId?: string
  staffId?: string
  hasCompletedOnboarding?: boolean
  referralCode?: string
  subscription?: UserSubscription | null
  createdAt?: string | null
  [key: string]: unknown
}

export interface StaffProfile {
  id?: string
  staffCode?: string
  displayName?: string
  position?: string
  bio?: string
  photo?: string
  photoUrl?: string
  firstName?: string
  lastName?: string
  phone?: string
  isProfileComplete?: boolean
  createdAt?: string | null
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

export interface EcosystemItem {
  id: string
  name: string
  url: string
  logoUrl?: string | null
}

export interface EcosystemSignInResult {
  redirectUrl: string | null
}

export type BannerTarget = 'Redirect' | 'OpenNewTab' | 'Open New Tab' | string

export interface BannerTranslation {
  languageCode: string
  webUrl?: string | null
  mobileUrl?: string | null
  tabletUrl?: string | null
}

export interface Banner {
  id: string
  title: string
  webActionUrl?: string | null
  androidActionUrl?: string | null
  iosActionUrl?: string | null
  target: BannerTarget
  ordering: number
  status: string
  translations: BannerTranslation[]
}

export interface HomePageBannerSlide {
  id: string
  image: string
  alt: string
  link: string
  target: '_blank' | '_self'
}

/** US-55 — Payout ledger item (merchant + staff list). */
export interface PayoutRecord {
  id: string
  payoutCode: string
  staffProfileId: string
  staffDisplayName: string
  staffCode: string
  staffPhotoUrl: string | null
  amount: number
  payoutMethodType: string
  payoutTypes: number
  periodStart: string
  periodEnd: string
  evidenceCount: number
  evidenceUrls: string[]
  notes: string | null
  status: number
  staffConfirmedAt: string | null
  createdAt: string
  lastModified: string | null
  /** Present on payout detail — snapshot of staff wallet at payout time. */
  staffPaymentAccountInfo?: string | null
}

/** GET /api/v1/staff/payouts/{id} — full detail for staff viewer. */
export interface StaffPayoutDetailRecord {
  id: string
  payoutCode: string
  createdAt: string
  businessId: string
  businessName: string
  businessLogoUrl: string | null
  payoutMethodType: string
  staffPaymentAccountInfo: string | null
  amount: number
  payoutTypes: number
  periodStart: string
  periodEnd: string
  notes: string | null
  evidenceUrls: string[]
  status: number
  staffConfirmedAt: string | null
}

/** GET /api/v1/merchant/payouts/staff/{staffProfileId}/debt */
export interface StaffDebtRecord {
  staffProfileId: string
  staffDisplayName: string
  staffCode: string
  staffPhotoUrl: string | null
  balance: number
  lastUpdatedAt: string | null
}

export interface PayoutsListPage {
  items: PayoutRecord[]
  pageNumber: number
  pageSize: number
  totalPages: number
  totalCount: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface PayoutMethodBreakdownStat {
  method: string
  amount: number
  count: number
}

/** GET /api/v1/merchant/payouts/stats */
export interface MerchantPayoutStats {
  totalPaidAllTime: number
  totalPaidThisMonth: number
  totalPendingAmount: number
  totalPendingCount: number
  totalUnpaidDebt: number
  staffWithDebt: number
  cancelledThisMonth: number
  methodBreakdown: PayoutMethodBreakdownStat[]
}

/** GET /api/v1/staff/payouts/stats */
export interface StaffPayoutStats {
  totalReceivedAllTime: number
  totalReceivedThisMonth: number
  totalPendingAmount: number
  totalPendingCount: number
  currentDebtBalance: number
}

export interface UnpaidTipDebtRecord {
  payoutDebtId: string
  staffProfileId: string
  staffDisplayName: string
  staffCode: string
  staffPhotoUrl: string | null
  balance: number
  lastUpdatedAt: string
}

export interface UnpaidTipDebtsPage {
  items: UnpaidTipDebtRecord[]
  totalCount: number
}

export interface StaffUnpaidDebtRecord {
  payoutDebtId: string
  businessId: string
  businessName: string
  balance: number
  lastUpdatedAt: string
}

export interface StaffUnpaidDebtsPage {
  items: StaffUnpaidDebtRecord[]
  totalCount: number
}

export interface PayoutDebtHistoryRecord {
  id: string
  amount: number
  transactionType: number
  referenceId: string
  description: string | null
  createdAt: string
}

export interface PayoutDebtHistoryPage {
  items: PayoutDebtHistoryRecord[]
  totalCount: number
}

export interface MerchantPayoutStaffStatRecord {
  staffProfileId: string
  staffDisplayName: string
  staffCode: string
  staffPhotoUrl: string | null
  totalPaid: number
  totalPending: number
  currentDebt: number
  payoutCount: number
}

export interface MerchantPayoutStatsByStaffPage {
  items: MerchantPayoutStaffStatRecord[]
  totalCount: number
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
